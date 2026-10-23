from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["project"] == "AGRONEX"

def test_parcels_requires_auth():
    assert client.get("/api/parcels").status_code in (401, 403)

def test_invalid_power_dates():
    r = client.get("/api/environment/power", params={
        "latitude": -9.93, "longitude": -76.24,
        "start": "2025-02-01", "end": "2025-01-01"})
    assert r.status_code == 422
