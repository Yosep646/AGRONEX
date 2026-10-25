"""Inferencia basada exclusivamente en artefactos entrenados de AGRONEX."""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from .dl_inference import predict_lstm, WEIGHTS
import joblib
import numpy as np

router = APIRouter(prefix="/api/models", tags=["models"])
ARTIFACT = Path(__file__).resolve().parents[1] / "artifacts" / "weather_rf.joblib"

class HistoryInput(BaseModel):
    # Últimos siete días en orden cronológico (sin datos futuros).
    temperature_c: list[float] = Field(min_length=7, max_length=7)
    precipitation_mm: list[float] = Field(min_length=7, max_length=7)
    radiation_kwh_m2: list[float] = Field(min_length=7, max_length=7)
    day_of_year: int = Field(ge=1, le=366)

@router.get("/status")
def status():
    exists = ARTIFACT.exists()
    return {"ml": "trained" if exists else "not_trained",
            "dl": "trained" if WEIGHTS.is_file() else "not_deployed",
            "note": "Solo se publican inferencias tras entrenar y evaluar modelos con datos observados."}

@router.post("/rainfall/forecast")
def forecast(data: HistoryInput):
    if not ARTIFACT.exists():
        raise HTTPException(503, "Modelo aún no entrenado: no hay predicción disponible")
    # Cargar exclusivamente artefactos generados localmente por el equipo.
    artifact = joblib.load(ARTIFACT)
    features = ["day_of_year"]
    values = [float(data.day_of_year)]
    for name, series in [("temperature_c", data.temperature_c),
                         ("precipitation_mm", data.precipitation_mm),
                         ("radiation_kwh_m2", data.radiation_kwh_m2)]:
        for lag in (1,3,7):
            features.append(f"{name}_lag{lag}")
            values.append(float(series[-lag]))
    if features != artifact["features"]:
        raise HTTPException(503, "Versión de características incompatible")
    prediction = float(artifact["model"].predict(np.array(values).reshape(1,-1))[0])
    return {"predicted_precipitation_mm": max(0.0, prediction),
            "horizon": "1 day", "model": "RandomForest",
            "warning": "Estimación experimental, no pronóstico operativo ni recomendación agrícola."}

class LSTMHistoryInput(BaseModel):
    temperature_c: list[float] = Field(min_length=14,max_length=14)
    precipitation_mm: list[float] = Field(min_length=14,max_length=14)
    radiation_kwh_m2: list[float] = Field(min_length=14,max_length=14)

@router.post("/rainfall/forecast-lstm")
def forecast_lstm(data:LSTMHistoryInput):
    if not WEIGHTS.is_file():
        raise HTTPException(503,"LSTM sin pesos desplegados")
    try:
        value=predict_lstm(data.temperature_c,data.precipitation_mm,data.radiation_kwh_m2)
    except (ValueError,KeyError) as exc:
        raise HTTPException(422,"Datos o versión de modelo incompatibles") from exc
    return {"predicted_precipitation_mm":value,"horizon":"1 day","model":"LSTM",
            "warning":"Predicción experimental, no recomendación de siembra ni pronóstico operativo."}
