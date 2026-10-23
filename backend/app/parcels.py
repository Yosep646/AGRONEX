from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from .db import supabase_request
from .security import require_user

router = APIRouter(prefix="/api/parcels", tags=["parcels"])
bearer = HTTPBearer()

class ParcelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    area_ha: float | None = Field(default=None, gt=0)

@router.get("")
async def list_parcels(
    user_id: str = Depends(require_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    return await supabase_request("GET", "parcels", credentials.credentials,
                                  params={"select": "id,name,latitude,longitude,area_ha,created_at",
                                          "order": "created_at.desc", "limit": "100"})

@router.post("", status_code=201)
async def create_parcel(
    parcel: ParcelCreate,
    user_id: str = Depends(require_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    payload = {**parcel.model_dump(), "owner_id": user_id}
    return await supabase_request("POST", "parcels", credentials.credentials, payload=payload)

@router.get("/{parcel_id}")
async def get_parcel(
    parcel_id: UUID,
    user_id: str = Depends(require_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    result = await supabase_request("GET", "parcels", credentials.credentials,
                                    params={"select": "*", "id": "eq." + str(parcel_id), "limit": "1"})
    if not result:
        raise HTTPException(404, "Parcela no encontrada")
    return result[0]
