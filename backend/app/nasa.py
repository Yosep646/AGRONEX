from datetime import date
import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = "T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN"

async def fetch_power(latitude: float, longitude: float, start: date, end: date) -> dict:
    if start > end:
        raise ValueError("La fecha inicial debe ser anterior a la final")
    params = {
        "parameters": PARAMETERS, "community": "AG",
        "latitude": latitude, "longitude": longitude,
        "start": start.strftime("%Y%m%d"), "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    async with httpx.AsyncClient(timeout=40) as client:
        response = await client.get(POWER_URL, params=params)
        response.raise_for_status()
        return response.json()
