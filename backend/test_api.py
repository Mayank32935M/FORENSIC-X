import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("---HEALTH---")
response = client.get("/api/health")
print(response.json())

print("\n---CREATE CASE---")
response = client.post("/api/cases", json={
    "title": "API Test Case",
    "case_number": "API-001",
    "description": "Testing from TestClient"
})
print(response.json())

print("\n---LIST CASES---")
response = client.get("/api/cases")
print(response.json())
