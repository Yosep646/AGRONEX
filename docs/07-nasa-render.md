# NASA + Render — AGRONEX

## Servicios NASA
- POWER: `GET /api/environment/power`, meteorología diaria.
- GIBS: `GET /api/satellite/gibs`, capacidades WMTS y capas satelitales.
- CMR STAC: `GET /api/satellite/hls/search`, búsqueda de gránulos HLS por bbox y fecha.

La búsqueda HLS solo devuelve metadatos y **no** descarga ni procesa bandas. Verificar los IDs de colección en el catálogo CMR antes de depender de ellos. Los productos protegidos pueden requerir NASA Earthdata Login.

## Render
El archivo `render.yaml` define dos servicios web: API FastAPI y Next.js.

1. Conectar GitHub a Render y elegir el repositorio AGRONEX.
2. Configurar variables de entorno privadas desde el Dashboard de Render:
   - API: SUPABASE_URL, SUPABASE_ANON_KEY, CORS_ORIGINS.
   - Web: NEXT_PUBLIC_API_URL (URL pública de la API), NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Crear los dos servicios con `render.yaml` o con configuración equivalente.
4. Validar `/api/health`, `/docs`, consulta POWER y autenticar parcelas.
5. Confirmar que CORS_ORIGINS contiene el dominio del frontend.
6. No subir secretos ni service_role al repositorio.

## Estado
Esta configuración de infraestructura no garantiza despliegue exitoso. Falta verificar la compilación, crear servicios en el workspace autorizado y probarlos. Las capas NASA aún no están dibujadas directamente en el mapa.
