"""Historial seguro de análisis experimentales por parcela, bajo RLS Supabase."""
from uuid import UUID
from datetime import datetime,timezone
from fastapi import APIRouter,Depends,HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from pydantic import BaseModel,Field
from .security import require_user
from .db import supabase_request
from .ml_service import HistoryInput,forecast
from .dl_inference import predict_lstm,WEIGHTS

router=APIRouter(prefix="/api/analysis",tags=["parcel-analysis"])
bearer=HTTPBearer()

class AnalyzeRequest(BaseModel):
    parcel_id:UUID
    model:str=Field(pattern="^(random_forest|lstm)$")
    weather:HistoryInput|None=None
    temperature_c:list[float]|None=None
    precipitation_mm:list[float]|None=None
    radiation_kwh_m2:list[float]|None=None
    period_end:str=Field(pattern=r"^\d{4}-\d{2}-\d{2}$")

async def owned_parcel(parcel_id:UUID,token:str):
    rows=await supabase_request("GET","parcels",token,params={"select":"id,name","id":"eq."+str(parcel_id),"limit":"1"})
    if not rows:raise HTTPException(404,"Parcela no encontrada o sin autorización")
    return rows[0]

@router.get("/{parcel_id}")
async def history(parcel_id:UUID,user_id:str=Depends(require_user),credentials:HTTPAuthorizationCredentials=Depends(bearer)):
    token=credentials.credentials
    await owned_parcel(parcel_id,token)
    return await supabase_request("GET","analysis_runs",token,params={"select":"id,model_name,model_version,result,created_at","parcel_id":"eq."+str(parcel_id),"order":"created_at.desc","limit":"30"})

@router.post("",status_code=201)
async def run(req:AnalyzeRequest,user_id:str=Depends(require_user),credentials:HTTPAuthorizationCredentials=Depends(bearer)):
    token=credentials.credentials
    parcel=await owned_parcel(req.parcel_id,token)
    if req.model=="random_forest":
        if req.weather is None:raise HTTPException(422,"Se requieren siete días y día del año para Random Forest")
        prediction=forecast(req.weather)
    else:
        if not WEIGHTS.is_file():raise HTTPException(503,"Modelo LSTM todavía no entrenado/desplegado")
        values=[req.temperature_c,req.precipitation_mm,req.radiation_kwh_m2]
        if any(v is None or len(v)!=14 for v in values):raise HTTPException(422,"LSTM requiere 14 días de tres variables")
        prediction={"predicted_precipitation_mm":predict_lstm(*values),"model":"LSTM","horizon":"1 day","warning":"Estimación experimental, no pronóstico operativo."}
    result={"period_end":req.period_end,"predicted_precipitation_mm":prediction["predicted_precipitation_mm"],
            "horizon":"1 day","source":"NASA POWER (serie suministrada por cliente; procedencia no verificada)",
            "interpretation":"Señal experimental de precipitación. Contrasta con alertas oficiales antes de tomar decisiones de riego.",
            "warning":"No es una prescripción de riego ni una recomendación agronómica validada."}
    saved=await supabase_request("POST","analysis_runs",token,payload={"parcel_id":str(req.parcel_id),"model_name":req.model,"model_version":"experimental-v1","result":result})
    return {"parcel":parcel,"prediction":prediction,"saved":saved}
