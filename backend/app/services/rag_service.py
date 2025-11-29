import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

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

# --- THE RAG ENGINE ---
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