from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_ndvi_math():
    r=client.post("/api/vegetation/ndvi",json={"product":"HLSL30","pixels":[{"red":0.2,"nir":0.6},{"red":0.2,"nir":0.4,"cloudy":True}]})
    assert r.status_code==200
    assert r.json()["ndvi_mean"]==0.5
    assert r.json()["valid_pixels"]==1

def test_no_valid_pixels():
    r=client.post("/api/vegetation/ndvi",json={"product":"HLSS30","pixels":[{"red":0,"nir":0,"cloudy":True}]})
    assert r.status_code==422
