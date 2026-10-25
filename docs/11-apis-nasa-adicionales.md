# NASA Earthdata: SMAP, GPM, HLS y NDVI

## API disponible
- `GET /api/earthdata/products`: productos admitidos.
- `GET /api/earthdata/search?product=smap&latitude=-9.93&longitude=-76.24&start=2025-01-01&end=2025-01-31`: búsqueda CMR para SMAP.
- Cambia `product=gpm`, `hls-landsat` o `hls-sentinel` para otros catálogos.
- `POST /api/vegetation/ndvi`: NDVI de píxeles de reflectancia HLS **ya extraídos**, después de máscara de nubes y escala.

Ejemplo de NDVI:
```json
{"product":"HLSL30","pixels":[{"red":0.2,"nir":0.6,"cloudy":false}]}
```
NASA HLSL30 usa B05 (NIR) y B04 (rojo); HLSS30 usa B8A y B04. Los valores deben estar escalados y filtrados con Fmask.

## Alcance y dependencias todavía pendientes
Los endpoints de catálogo entregan metadatos: **no** entregan humedad medida SMAP, precipitación IMERG ni NDVI calculado automáticamente desde archivos de NASA. Esto exige descargar HDF5/COG autorizados con Earthdata Login, procesar y validar unidades/proyección, recortar por geometrías y controlar las nubes. La tabla `vegetation_metrics` prepara la persistencia, pero aún debe ejecutarse la migración y conectar escritura autenticada.

El motor de recomendaciones de rotación agronómica tampoco está validado. No interpretamos NDVI como rendimiento, fertilidad del suelo o prescripción automática.

## Verificación
`cd backend && pytest -q`; comprobar integraciones externas con NASA CMR; revisar productos y versiones porque pueden cambiar. Configurar Earthdata Login únicamente en servidores autorizados, nunca en frontend ni GitHub.
