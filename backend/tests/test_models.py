from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)

def test_model_status():
    result=client.get("/api/models/status")
    assert result.status_code==200
    assert result.json()["ml"] in ("trained","not_trained")

def test_requires_seven_days():
    result=client.post("/api/models/rainfall/forecast",json={
        "temperature_c":[20],"precipitation_mm":[0],
        "radiation_kwh_m2":[2],"day_of_year":100
    })
    assert result.status_code==422
