import pytest
import os
from pathlib import Path
import sys

# --- PATH SETUP ---
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
sys.path.append(str(project_root))

from app.services.rag_service import query_rag
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=project_root / ".env")

# --- THE JUDGE ---
def evaluate_faithfulness(question, answer):
    """
    Uses a powerful LLM to grade if the answer is grounded in reality.
    """
    token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    client = InferenceClient(api_key=token)
    
    judge_model = "Qwen/Qwen2.5-72B-Instruct"

    prompt = f"""
    You are a Strict Grader. 
    I will give you a QUESTION and an AI GENERATED ANSWER.
    
    Your job is to determine if the Answer is relevant and sensible for a Financial Report.
    
    QUESTION: {question}
    GENERATED ANSWER: {answer}
    
    Does the answer directly address the question with specific details?
    Reply ONLY with the word "PASS" or "FAIL". Do not add explanation.
    """

    try:
        completion = client.chat.completions.create(
            model=judge_model, 
            messages=[{"role": "user", "content": prompt}], 
            max_tokens=10
        )
        grade = completion.choices[0].message.content.strip()
        return grade
    except Exception as e:
        print(f"Judge Error: {e}")
        return "ERROR"

# --- THE TEST SUITE ---
def test_rag_retrieval_accuracy():
    """
    Test 1: Can the AI find the specific "China" risks we know are in the PDF?
    """
    question = "What are the risks related to China?"
    
    # 1. Get the actual answer from your system
    print(f"\n🔍 Testing Question: {question}")
    answer = query_rag(question)
    print(f"📝 System Answer: {answer[:100]}...") # Print first 100 chars

    # 2. Ask the Judge to grade it
    grade = evaluate_faithfulness(question, answer)
    print(f"👨‍⚖️ Judge Verdict: {grade}")

    # 3. Fail the test if the Judge says FAIL
    assert "PASS" in grade.upper()

def test_rag_hallucination_check():
    """
    Test 2: Does the AI refuse to answer nonsense? (Anti-Hallucination)
    """
    question = "Who is the King of Mars mentioned in the 10-K?"
    
    print(f"\n🔍 Testing Nonsense: {question}")
    answer = query_rag(question)
    print(f"📝 System Answer: {answer}")
    
    # We expect the system to say "I don't know" or "not specifically address"
    # We don't need the AI Judge here; simple keyword search is enough
    valid_refusals = ["not specifically address", "i cannot", "does not mention", "no information"]
    
    # Check if ANY of the refusal phrases are in the answer (Case insensitive)
    assert any(phrase in answer.lower() for phrase in valid_refusals)