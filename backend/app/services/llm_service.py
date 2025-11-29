import os
from pathlib import Path
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

def get_llm_response_internal(sys_prompt, user_prompt):
    token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not token: 
        return "Error: Token missing."
        
    client = InferenceClient(api_key=token)
    
    # Priority list: Huge model -> Fast model -> Backup
    models = [
        "Qwen/Qwen2.5-72B-Instruct", 
        "Qwen/Qwen2.5-7B-Instruct",
    ]
    
    for model in models:
        try:
            # print(f"Trying model: {model}...") 
            completion = client.chat.completions.create(
                model=model, 
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt}
                ], 
                max_tokens=1000
            )
            return completion.choices[0].message.content
        except Exception:
            continue
    return "Error: Could not connect to any AI models."
