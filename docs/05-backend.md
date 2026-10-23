# Backend AGRONEX

## Objetivo
FastAPI consulta NASA POWER y proporciona CRUD básico de parcelas con Supabase Auth y Row Level Security (RLS).

## Configuración
Crear proyecto en Supabase, ejecutar `supabase/migrations/001_initial.sql` y habilitar Auth. Usar la clave pública `anon`/publishable solamente. Nunca copiar la `service_role` al frontend ni a documentación.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env
uvicorn app.main:app --reload
pytest -q
```

## API
- `GET /api/health`: verificación.
- `GET /api/environment/power?latitude=-9.93&longitude=-76.24&start=2025-01-01&end=2025-01-31`: datos meteorológicos NASA; endpoint público con límite de intervalo.
- `GET /api/parcels`: listar parcelas propias (requiere token).
- `POST /api/parcels`: crear una parcela (requiere token).
- `GET /api/parcels/{uuid}`: consultar una parcela propia.

Enviar `Authorization: Bearer <access_token>` a endpoints protegidos. El backend verifica sesión contra Supabase Auth y reenvía ese token a PostgREST, preservando las políticas RLS.

## Estado actual
Código subido a GitHub, aún no conectado a un proyecto Supabase ni probado contra su instancia real. La integración HLS/GIBS, persistencia de observaciones, ML/DL en línea y despliegue son fases siguientes.
