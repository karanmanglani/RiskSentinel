import pytest
from fastapi.testclient import TestClient
import sys
import os
from pathlib import Path

# --- PATH HACK (To find your app) ---
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
sys.path.append(str(project_root))

from app.main import app

# Create a "Virtual Client" (Simulates a browser without running the server)
client = TestClient(app)

def test_health_check():
    """
    Verifies that the server is up and returning status 200.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "active", "service": "RiskSentinel Brain"}

def test_analyze_endpoint_valid():
    """
    Verifies that we can send a question and get a text answer.
    """
    payload = {"question": "What is the company's primary business?"}
    response = client.post("/api/analyze", json=payload)
    
    # Check 1: Did we get a success code?
    assert response.status_code == 200
    
    # Check 2: Is the answer a string?
    data = response.json()
    assert "answer" in data
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 10 # The answer should be substantial

def test_analyze_endpoint_empty():
    """
    Negative Testing: What happens if we send an empty question?
    """
    payload = {"question": ""}
    response = client.post("/api/analyze", json=payload)
    
    # We expect a 400 Bad Request error (as we defined in main.py)
    assert response.status_code == 400