"""Verificación de tokens de Supabase Auth (sin service-role key)."""
from functools import lru_cache
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .config import settings

bearer = HTTPBearer(auto_error=False)

async def require_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if not credentials:
        raise HTTPException(401, "Se requiere token de acceso")
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(503, "Supabase Auth no está configurado")
    # Supabase Auth verifica la sesión y devuelve al usuario asociado al JWT.
    url = settings.supabase_url.rstrip("/") + "/auth/v1/user"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": "Bearer " + credentials.credentials,
            })
    except httpx.HTTPError as exc:
        raise HTTPException(502, "No se pudo verificar la sesión") from exc
    if response.status_code != 200:
        raise HTTPException(401, "Sesión inválida o expirada")
    user_id = response.json().get("id")
    if not user_id:
        raise HTTPException(401, "No se pudo identificar al usuario")
    return user_id
