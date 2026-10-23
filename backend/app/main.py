from datetime import date
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from .config import settings
from .nasa import fetch_power

app = FastAPI(title="AGRONEX API", version="0.1.0", description="Prototipo de preparación: datos ambientales NASA POWER")
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins.split(","),
    allow_credentials=False, allow_methods=["GET"], allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok", "project": "AGRONEX"}

@app.get("/api/environment/power")
async def power(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    start: date = Query(...),
    end: date = Query(...),
):
    if start > end:
        raise HTTPException(status_code=422, detail="start debe ser anterior o igual a end")
    if (end - start).days > 366:
        raise HTTPException(status_code=422, detail="Máximo 367 días por consulta")
    try:
        data = await fetch_power(latitude, longitude, start, end)
        return {"source": "NASA POWER", "data": data.get("properties", {}).get("parameter", {}), "units": data.get("parameters", {})}
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Error consultando NASA POWER: {type(exc).__name__}") from exc
