# AGRONEX · Entrenamiento y despliegue ML/DL

## Flujo implementado
1. El workflow `.github/workflows/train-models.yml` se activa al modificar los scripts de entrenamiento o manualmente en GitHub Actions.
2. Descarga observaciones NASA POWER (por defecto 2021–2025, coordenadas configurables).
3. Entrena Random Forest (ML) y LSTM (DL) con separación temporal 80/20 y genera métricas reales.
4. Publica artefactos entrenados por la ejecución confiable de GitHub Actions, junto al archivo `metrics.json`. Este commit activa el despliegue automático Render.
5. FastAPI verifica si existen los pesos y devuelve 503 cuando no estén disponibles.

## Endpoints
- `GET /api/models/status`: ML/DL presente o ausente.
- `GET /api/models/metrics`: informe de métricas obtenido del entrenamiento.
- `POST /api/models/rainfall/forecast`: predicción Random Forest, requiere siete días, `day_of_year` del día a predecir.
- `POST /api/models/rainfall/forecast-lstm`: predicción LSTM, requiere catorce días.
- `GET /api/environment/power`: datos NASA POWER usados por el dashboard.
- `GET /api/earthdata/search`: SMAP/GPM/HLS por CMR.

## Limitaciones y validación
El entrenamiento en CI es experimental y **debe ejecutarse y finalizar con éxito** antes de considerar los modelos disponibles. Las métricas no están predeterminadas. El error debe compararse con una línea base, inspeccionarse por temporada y región y verificarse con un agrónomo antes de dar recomendaciones de cultivo.

Los modelos no predicen cosechas, NDVI, fertilidad ni rotaciones. El endpoint de ML/DL no reemplaza pronósticos meteorológicos operativos.

Para modificar el área de entrenamiento, usar **Run workflow** y pasar latitud/longitud/fechas. Los artefactos binarios versionados sirven al prototipo, pero para producción conviene usar un registro de modelos con aprobación y control de versiones independiente.
