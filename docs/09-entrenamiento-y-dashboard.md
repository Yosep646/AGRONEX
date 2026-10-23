# AGRONEX — Dashboard y entrenamiento automático

## Nuevo dashboard
Acceso: `/dashboard` en Next.js. Panel responsivo con tarjetas, parcelas de Supabase, observaciones reales NASA POWER, barras de lluvia, estado del modelo y acceso a la vista satelital GIBS. No presenta datos ni predicciones fabricadas.

## Cómo ejecutar entrenamiento con datos NASA reales
Desde GitHub: pestaña **Actions** → **AGRONEX - entrenamiento ML y DL** → **Run workflow**. Por defecto usa la región piloto próxima a Huánuco (lat -9.93, lon -76.24) y la serie 2021–2025; todas las coordenadas y fechas son configurables.

El workflow:
1. Instala las dependencias para ML/DL.
2. Descarga NASA POWER y exporta datos a CSV; aborta ante errores.
3. Entrena Random Forest y LSTM separadamente.
4. Evalúa cronológicamente y produce métricas reales.
5. Adjunta los archivos `weather_rf.joblib`, `weather_lstm.pt` y `metrics.json` como artefactos privados de ejecución del workflow.

**El workflow no está confirmado como ejecutado.** Puede requerir ajustar la disponibilidad de POWER, tiempos de ejecución, dependencias y validación. Los artefactos **no** se activan automáticamente en Render: antes se deben revisar científicamente y empaquetar en un despliegue separado, protegiendo pesos y acceso.

## Comportamiento seguro
En ausencia de un modelo, `GET /api/models/status` anuncia no entrenado y `POST /api/models/rainfall/forecast` retorna 503. Nunca mostrar una precisión, un NDVI ni una recomendación sin datos.

## Arquitectura progresiva
Dashboard / Next.js → FastAPI → POWER / CMR / GIBS → Supabase → entrenamiento offline → revisión de calidad → inferencia versionada.

**Pendientes**: métricas verificadas en ejecución, carga protegida de modelos en Render, inferencia DL por API, clasificación de vegetación HLS y motor de rotación de cultivos validado.
