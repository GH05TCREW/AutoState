import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AutoState API is running"}

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_templates_list():
    response = client.get("/api/generator/templates")
    assert response.status_code == 200
    data = response.json()
    assert "templates" in data
    assert len(data["templates"]) == 3  # Python, YAML, C

# Example scenario test data
test_scenario = {
    "title": "Test FSM",
    "language": "en",
    "scenarios": [
        "Given the system is idle, when start is pressed, then activate and go to running"
    ]
} 