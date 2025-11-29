import os
from pathlib import Path
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

def get_llm_response(question: str):
    if not api_token:
        return "❌ Error: No API Token found in .env"

    client = InferenceClient(api_key=api_token)
    completion = client.chat.completions.create(
        model = "Qwen/Qwen3-235B-A22B-Instruct-2507",
        messages = [{"role": "user", "content": question}],
        max_tokens = 500
    )
    return completion.choices[0].message.content

# Test block
if __name__ == "__main__":
    answer = get_llm_response("Explain 'Value at Risk' (VaR) in one short paragraph.")
    print("\nAI Answer:")
    print("-----------------------------")
    print(answer)
    print("-----------------------------")