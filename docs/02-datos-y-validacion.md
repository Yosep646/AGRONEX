# Fuentes, ML/DL y validación

## Fuentes candidatas
| Fuente | Variable | Consideración |
|---|---|---|
| NASA POWER | meteorología diaria | datos de rejilla / representatividad local |
| GPM IMERG | precipitación | resolución espacial y temporal |
| SMAP | humedad del suelo | escala regional, no sensor de parcela |
| HLS | índices de vegetación | nubosidad, cobertura y procesamiento |
| ISRIC SoilGrids | propiedades estimadas del suelo | fuente externa a NASA; incertidumbre |

## Hipótesis de modelado
- Definir primero un objetivo observable (p. ej., lluvia acumulada de la semana siguiente), con datos suficientes.
- Comparar una línea base estacional con Random Forest / XGBoost y LSTM / TCN solo si se justifica.
- Validación cronológica evitando fuga de datos futuros.
- Reportar MAE/RMSE para regresión, sin fabricar cifras.
- Un pronóstico ambiental no demuestra automáticamente mejoras en rendimientos agrícolas.

## Rotaciones
Usar una matriz de requisitos y restricciones revisada por un especialista. Declarar incertidumbre y procedencia de cada regla. No atribuir recomendaciones agronómicas exclusivamente a modelos de IA.
