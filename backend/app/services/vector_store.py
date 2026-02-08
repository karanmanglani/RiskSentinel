import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEndpointEmbeddings

# --- CONFIGURATION ---
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent.parent # backend/
data_folder = project_root / "data"
vector_db_path = project_root / "chroma_db" # Where we save the DB

# Define the Embedding Model (Converts text -> numbers)
# We use a small, fast model explicitly for this
repo_id = "sentence-transformers/all-MiniLM-L6-v2"

embedding_model = HuggingFaceEndpointEmbeddings(
    model=repo_id,
    task="feature-extraction",
    huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN")
)

def build_vector_db():
    pdf_path = data_folder / "apple_10k.pdf"
    
    if not pdf_path.exists():
        print(f"❌ CRITICAL ERROR: File not found at {pdf_path}")
        print("Please download a 10-K PDF and rename it to 'apple_10k.pdf'")
        return

    print("--- 1. LOADING PDF ---")
    loader = PyPDFLoader(str(pdf_path))
    docs = loader.load()
    print(f"✅ Loaded {len(docs)} pages.")

    print("--- 2. CHUNKING TEXT ---")
    # Split text into 1000-character chunks with overlap
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    print(f"✅ Created {len(splits)} text chunks.")

    print("--- 3. CREATING VECTOR DATABASE (This may take a minute) ---")
    # This actually sends data to the embedding model and saves to disk
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embedding_model,
        persist_directory=str(vector_db_path)
    )
    print(f"🎉 Success! Vector DB saved to {vector_db_path}")

def get_retriever():
    # Helper function to load the DB later for querying
    vectorstore = Chroma(
        persist_directory=str(vector_db_path), 
        embedding_function=embedding_model
    )
    return vectorstore.as_retriever(search_kwargs={"k": 3}) # Retrieve top 3 matches

if __name__ == "__main__":
    build_vector_db()