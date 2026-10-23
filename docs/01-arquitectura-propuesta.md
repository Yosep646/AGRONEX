# Arquitectura propuesta (sin implementar)

```text
NASA POWER / GPM / SMAP / HLS + datos agronómicos
                    |
             Ingesta y validación
                    |
          Normalización geotemporal
                    |
      Series e indicadores ambientales
             /               \
  ML (RF / XGBoost)     DL (LSTM / TCN)
             \               /
              Evaluación comparativa
                    |
       Reglas agronómicas trazables
                    |
       API FastAPI + almacenamiento
                    |
         Panel web Next.js/MapLibre
```

## Componentes previstos
- `frontend/`: interfaz de visualización, mapas y alternativas evaluadas.
- `backend/`: API REST, integración y lógica de análisis.
- `ml/`: modelos tabulares y líneas base.
- `dl/`: modelos de series temporales.
- `data/`: adaptadores para NASA y procesamiento.
- `tests/`: pruebas de integración, modelos y reglas.
- `docs/`: decisiones, fuentes y documentación.

Estas carpetas representan el diseño futuro. No indican que los componentes ya estén desarrollados.
