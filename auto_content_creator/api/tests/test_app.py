from fastapi.testclient import TestClient
from ..app import app

client = TestClient(app)


def test_generate_article():
    response = client.post("/generate-article", json={"topic": "Test Topic"})
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "processing"


def test_get_nonexistent_article():
    response = client.get("/articles/nonexistent-id")
    assert response.status_code == 404
