"""Catálogo NASA Earthdata CMR-STAC y metadatos GIBS.
Las búsquedas STAC no descargan automáticamente las imágenes protegidas.
"""
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/satellite", tags=["satellite"])
STAC = "https://cmr.earthdata.nasa.gov/cmr-stac/LPCLOUD/search"
GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi"

@router.get("/gibs")
async def gibs_info():
    return {
        "service": "NASA GIBS WMTS",
        "capabilities": GIBS + "?SERVICE=WMTS&REQUEST=GetCapabilities",
        "layer": "MODIS_Terra_CorrectedReflectance_TrueColor",
        "note": "Las capas y fechas soportadas deben comprobarse en GetCapabilities.",
    }

@router.get("/hls/search")
async def search_hls(
    west: float = Query(..., ge=-180, le=180),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    north: float = Query(..., ge=-90, le=90),
    start: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    limit: int = Query(10, ge=1, le=50),
):
    if west >= east or south >= north or start > end:
        raise HTTPException(422, "BBox o fechas inválidas")
    # STAC de CMR: solo metadatos de gránulos públicos.
    payload = {
        "collections": ["HLSL30.v2.0", "HLSS30.v2.0"],
        "bbox": [west, south, east, north],
        "datetime": f"{start}T00:00:00Z/{end}T23:59:59Z",
        "limit": limit,
    }
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(STAC, json=payload, headers={"Accept": "application/geo+json"})
            response.raise_for_status()
            data = response.json()
        return {"source": "NASA CMR STAC", "type": data.get("type"), "features": data.get("features", []),
                "note": "La disponibilidad de colecciones y sus identificadores debe verificarse contra CMR. La descarga de assets puede requerir Earthdata Login."}
    except httpx.HTTPError as exc:
        raise HTTPException(502, "NASA CMR no respondió correctamente") from exc
