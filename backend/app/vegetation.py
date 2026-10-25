"""Cálculo NDVI reproducible para muestras de reflectancia HLS ya extraídas."""
import math
from fastapi import APIRouter,HTTPException
from pydantic import BaseModel,Field

router=APIRouter(prefix="/api/vegetation",tags=["vegetation"])

class Pixel(BaseModel):
    red:float=Field(ge=-1,le=2)
    nir:float=Field(ge=-1,le=2)
    cloudy:bool=False

class NDVIRequest(BaseModel):
    product:str
    pixels:list[Pixel]=Field(min_length=1,max_length=10000)

@router.post("/ndvi")
def calculate(request:NDVIRequest):
    if request.product not in ("HLSL30","HLSS30"):
        raise HTTPException(422,"Usa HLSL30 (B05/B04) o HLSS30 (B8A/B04)")
    values=[]
    for p in request.pixels:
        if p.cloudy or p.red<0 or p.nir<0 or p.red+p.nir<=0:
            continue
        n=(p.nir-p.red)/(p.nir+p.red)
        if math.isfinite(n):values.append(n)
    if not values:
        raise HTTPException(422,"No hay píxeles válidos, libres de nubes")
    return {"product":request.product,"ndvi_mean":round(sum(values)/len(values),4),
            "valid_pixels":len(values),"total_pixels":len(request.pixels),
            "method":"NDVI=(NIR-RED)/(NIR+RED), reflectancia HLS previamente escalada",
            "note":"Las muestras deben provenir de bandas HLS y máscaras Fmask procesadas; no equivale a salud de cultivos certificada."}
