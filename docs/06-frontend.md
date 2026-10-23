# Frontend AGRONEX

Interfaz responsiva en Next.js 15 + TypeScript.

## Módulos implementados en el código
- Panel general: objetivos, fuentes y estado real de la plataforma.
- Datos NASA: consulta de POWER por coordenadas y rango de fechas; resumen y barras de precipitación.
- Parcelas: inicio de sesión Supabase Auth, listado y registro de parcelas con API FastAPI y RLS.
- Análisis agrícola: estado de las futuras funciones; **sin recomendaciones inventadas**.

## Configuración
```bash
cd frontend
npm install
cp .env.example .env.local
# Editar .env.local con URL pública, anon key y URL del backend
npm run dev
```
Abrir http://localhost:3000.

En otra terminal levantar FastAPI:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Supabase
1. Crear proyecto y ejecutar la migración SQL de `supabase/migrations/001_initial.sql`.
2. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en frontend y `SUPABASE_URL` / `SUPABASE_ANON_KEY` en backend.
3. Crear un usuario en Supabase Auth (o activar el proceso de registro posteriormente).
4. Iniciar sesión en AGRONEX y guardar una parcela.
5. Las políticas RLS requieren JWT real y aíslan los registros de cada usuario. Nunca configurar una clave `service_role` en el navegador.

## Verificaciones sugeridas
- `npm run typecheck`
- `npm run build`
- `GET http://localhost:8000/api/health`
- Consulta de POWER con fecha y coordenadas válidas.
- Comprobar que un usuario no puede consultar parcelas de otro.
- Comprobar la operación sin configuración y los errores de red.

## Limitaciones
No se han realizado despliegue, validación de compilación ni integración en vivo de Supabase desde esta sesión. El frontend no tiene imágenes GIBS/HLS todavía. Los modelos ML/DL y las recomendaciones están pendientes de entrenamiento y evaluación científica.
