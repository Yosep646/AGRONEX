# AGRONEX — Control de calidad y despliegue

Se incorporó el workflow `.github/workflows/quality.yml` para verificar automáticamente Python/FastAPI, pruebas y compilación TypeScript/Next.js en cada push a main y PR.

## Servicios Render
- Frontend: https://agronex-web.onrender.com
- Backend: https://agronex-api-svya.onrender.com
- Ambos servicios desplegados automáticamente desde GitHub main.

## Verificación de publicación
1. Comprueba que el último despliegue en Render termine en `live`.
2. Comprueba `/api/health` y `/api/models/status`.
3. Accede a `/dashboard`, `/manage` y `/satellite`.
4. Configura Supabase en cada servicio de Render; no añadas secretos al repositorio.
5. El workflow de entrenamiento de ML/DL se ejecuta por separado y **no publica automáticamente** pesos.

## Alcance
La publicación exitosa no prueba que NASA CMR y GIBS respondan para cada zona/fecha, que Supabase esté configurado ni que existan modelos entrenados. Se requieren pruebas funcionales reales.
