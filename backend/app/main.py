from fastapi import FastAPI

app = FastAPI(title = "RiskSentinel API")

@app.get("/")
def health_check():
    return {"Status" : "active" , "message" : "RiskSentinel is ready to process the risk !!"}

@app.get("/api/test/{ticker}")
def get_ticker(ticker: str):
    return {"ticker": ticker.upper(), "price": "Fetching..."}