from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.services.rag_service import query_rag

app = FastAPI(title="RiskSentinel API")

# Define the data format for the request
class RiskQuery(BaseModel):
    question: str

@app.get("/")
def health_check():
    return {"status": "active", "service": "RiskSentinel Brain"}

@app.post("/api/analyze")
def analyze_risk(query: RiskQuery):
    """
    Takes a question, searches the 10-K, and returns the AI analysis.
    """
    if not query.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    print(f"📥 API received question: {query.question}")
    
    # Call your RAG engine
    try:
        answer = query_rag(query.question)
        return {"answer": answer}
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))