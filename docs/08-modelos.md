# ML/DL AGRONEX — estado y entrenamiento

Los modelos experimentales deben entrenarse con **observaciones reales**. El backend no inventa predicciones.

## ML
`ml/train.py` entrena Random Forest con separación cronológica y reporta MAE frente a la media histórica. Su formato original sigue siendo un prototipo independiente; antes de habilitar inferencia en producción debe unificarse el esquema de características y guardar el modelo verificado como `backend/artifacts/weather_rf.joblib`. Mientras tanto `POST /api/models/rainfall/forecast` retorna 503, no información ficticia.

## DL
`backend/app/dl_service.py` implementa entrenamiento LSTM con PyTorch para predicción de precipitación del día siguiente. La separación es temporal (80/20), estandariza usando solo entrenamiento y reporta MAE de prueba. No se ha ejecutado aún el entrenamiento ni generado pesos.

Instalación para entrenamiento (equipo de investigación):
```bash
pip install -r backend/requirements-ml.txt
python -m backend.app.dl_service --csv datos_meteorologicos.csv
```
CSV: `date,temperature_c,precipitation_mm,radiation_kwh_m2` con registros diarios en orden y calidad comprobada.

Los pesos generados no se suben al repositorio por defecto. Falta determinar comparabilidad, errores por temporada y validación científica antes de considerar integración de inferencia DL en producción.

## Consideraciones
NASA POWER: servicios diarios, calidad de datos y resolución espacial; no equivalen a sensores de parcela. Ninguno de los dos modelos estima rendimientos ni prescribe cultivos directamente.
