import sys
from pathlib import Path
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
import os
import glob
from sec_edgar_downloader import Downloader
from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# --- PATH FIX (CRITICAL) ---
# This ensures Python knows where 'backend' is
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent.parent
sys.path.append(str(project_root))

# NOW we can import from 'app'
from app.services.vector_store import get_retriever

# --- CONFIGURATION ---
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)

# -- Setup Vector DB (Chroma) ---
PERSIST_DIRECTORY = "./chroma_db"
EMBEDDING_MODEL = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

vector_db = Chroma(
    persist_directory=PERSIST_DIRECTORY,
    embedding_function=EMBEDDING_MODEL
)

# --- THE RAG ENGINE ---

def download_and_ingest_10k(ticker: str):
    """
    Downloads the latest 10-K for a ticker and ingests it.
    """
    print(f"🚀 Starting SEC Download for: {ticker}")
    
    # 1. Setup Downloader (Requires an email for User-Agent compliance)
    dl = Downloader("RiskSentinel", "admin@risksentinel.com")
    
    # 2. Download latest 10-K
    # This saves to: ./sec-edgar-filings/{ticker}/10-K/...
    try:
        dl.get("10-K", ticker, limit=1)
    except Exception as e:
        raise ValueError(f"Failed to download 10-K for {ticker}: {e}")

    # 3. Find the file (It's deeply nested)
    # We look for the .html or .txt file in the download folder
    search_path = f"sec-edgar-filings/{ticker}/10-K/**/*.txt" # Modern filings are often .txt (HTML inside)
    files = glob.glob(search_path, recursive=True)
    
    if not files:
        # Fallback for some companies that use .html
        search_path = f"sec-edgar-filings/{ticker}/10-K/**/*.html"
        files = glob.glob(search_path, recursive=True)
        
    if not files:
        raise FileNotFoundError(f"No 10-K file found for {ticker}")
        
    target_file = files[0]
    print(f"📂 Found filing: {target_file}")
    
    # 4. Load and Clean (HTML -> Text)
    # We use BSHTMLLoader because SEC filings are HTML
    loader = BSHTMLLoader(target_file)
    docs = loader.load()
    
    # 5. Split and Vectorize
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000, # 10-Ks are dense, so larger chunks
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)
    
    # 6. Store in DB
    vector_db.add_documents(documents=splits)
    print(f"✅ Ingested {len(splits)} chunks for {ticker}")
    
    return len(splits)

def query_rag(user_question: str):
    print(f"🔎 Analyzing PDF for: '{user_question}'")
    
    # 1. RETRIEVE
    try:
        retriever = get_retriever()
        relevant_docs = retriever.invoke(user_question)
    except Exception as e:
        return f"Error accessing Vector DB: {e}. Did you run vector_store.py?"
    
    context_text = "\n\n".join([doc.page_content for doc in relevant_docs])
    
    if not context_text:
        return "I couldn't find any relevant information in the uploaded PDF."

    print(f"✅ Found {len(relevant_docs)} relevant sections.")

    # 2. AUGMENT
    system_prompt = """You are a Senior Risk Analyst at D. E. Shaw. 
    Use the provided CONTEXT (Excerpts from a 10-K Report) to answer the question.
    If the answer is not in the context, admit you don't know. Do not hallucinate.
    Keep the answer professional and concise."""

    final_prompt = f"""
    CONTEXT FROM 10-K REPORT:
    {context_text}

    USER QUESTION: 
    {user_question}
    """

    # 3. GENERATE
    return get_llm_response_internal(system_prompt, final_prompt)

# Internal helper to call Qwen
from app.services.llm_service import get_llm_response_internal


if __name__ == "__main__":
    # Test Question
    response = query_rag("What are the risks related to China mentioned in the report?")
    print("\n🤖 RAG RESPONSE:\n" + response)