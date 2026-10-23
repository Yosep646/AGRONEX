"""Acceso REST a Supabase conservando RLS del usuario.

Usa anon/publishable key y JWT de usuario; nunca la service_role.
"""
import httpx
from fastapi import HTTPException
from .config import settings

async def supabase_request(method: str, table: str, token: str, *,
                          params: dict | None = None,
                          payload: dict | None = None) -> object:
    if table not in {"parcels", "crop_history", "environmental_observations", "analysis_runs"}:
        raise HTTPException(400, "Tabla no admitida")
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(503, "Supabase no configurado")
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(
                method, settings.supabase_url.rstrip("/") + "/rest/v1/" + table,
                headers=headers, params=params, json=payload,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Base de datos no disponible") from exc
    if response.status_code >= 400:
        # No exponer detalles internos de Supabase a usuarios finales.
        raise HTTPException(403 if response.status_code in (401, 403) else 502,
                            "Operación de base de datos rechazada")
    return response.json() if response.content else []
