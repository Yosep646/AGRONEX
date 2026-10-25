"""Búsqueda de granulos NASA CMR para SMAP, GPM y HLS; no implica descarga de píxeles."""
from datetime import date
import httpx
from fastapi import APIRouter, HTTPException, Query

router=APIRouter(prefix="/api/earthdata",tags=["earthdata"])
PRODUCTS={"smap":("SPL3SMP_E","006"),"gpm":("GPM_3IMERGDF","07"),
          "hls-landsat":("HLSL30","2.0"),"hls-sentinel":("HLSS30","2.0")}
CMR="https://cmr.earthdata.nasa.gov/search/granules.json"

@router.get("/products")
def products():
    return {"products":PRODUCTS,"source":"NASA CMR","note":"Resultados de catálogo: no valores científicos procesados"}

@router.get("/search")
async def search(
    product:str=Query(...),
    latitude:float=Query(...,ge=-90,le=90),
    longitude:float=Query(...,ge=-180,le=180),
    start:date=Query(...),
    end:date=Query(...),
    limit:int=Query(8,ge=1,le=20),
):
    if product not in PRODUCTS:raise HTTPException(422,"Producto no soportado")
    if end<start or (end-start).days>366:raise HTTPException(422,"Rango de fechas inválido o superior a 366 días")
    name,version=PRODUCTS[product]
    params={"short_name":name,"version":version,
            "point":f"{longitude},{latitude}",
            "temporal":f"{start.isoformat()}T00:00:00Z,{end.isoformat()}T23:59:59Z",
            "page_size":limit,"sort_key":"-start_date"}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response=await client.get(CMR,params=params,headers={"Accept":"application/json"})
            response.raise_for_status()
            entries=response.json().get("feed",{}).get("entry",[])
    except (httpx.HTTPError,ValueError) as ex:
        raise HTTPException(502,"No se pudo consultar el catálogo NASA CMR") from ex
    return {"source":"NASA CMR","product":product,"collection":name,"count":len(entries),
            "items":[{"id":e.get("id"),"title":e.get("title"),"time_start":e.get("time_start"),
                      "links":[l.get("href") for l in e.get("links",[]) if l.get("href") and l.get("rel","").find("data#")>=0][:4]}
                     for e in entries],
            "note":"Catálogo de granulos; descarga y extracción de SMAP/GPM requiere Earthdata y procesamiento adicional."}
