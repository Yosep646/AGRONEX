# AGRONEX 🌱🛰️

**Inteligencia para cultivar un futuro mejor.**

Proyecto propuesto para **NASA Space Apps Challenge 2026**, desafío **Field Shift: Adapting Farms with NASA Data**.

## Problema
La variabilidad climática, las limitaciones hídricas y la degradación del suelo dificultan la planificación sostenible y la rotación de cultivos. Los datos ambientales están fragmentados y requieren interpretación especializada.

## Propuesta
AGRONEX busca apoyar la evaluación de estrategias de rotación mediante información ambiental de NASA, propiedades del suelo y criterios agronómicos. Dirigido a agricultores, especialistas y organizaciones agrícolas.

## Fuentes de información previstas
- **NASA POWER:** temperatura, precipitación y radiación solar (API REST).
- **GPM IMERG:** estimaciones de precipitación (Earthdata).
- **SMAP:** humedad regional del suelo (Earthdata).
- **HLS:** observación multiespectral de vegetación.
- **Datos complementarios:** propiedades del suelo y requisitos de cultivos, con su procedencia documentada.

## Enfoque analítico propuesto
- **ML:** modelos de referencia y Random Forest / XGBoost para analizar indicadores agroclimáticos con variables y objetivos verificables.
- **DL:** LSTM o TCN para investigar series temporales, comparadas con métodos de referencia.
- **Motor agronómico:** restricciones documentadas para comparar alternativas de rotación.
- La IA no sustituye la validación agronómica; no se asumen resultados ni mejoras sin evidencia.

## Arquitectura prevista (NO implementada)
Frontend: Next.js + TypeScript · Backend: FastAPI/Python · Datos: Pandas/GeoPandas · ML: scikit-learn/XGBoost · DL: PyTorch · Base de datos: PostgreSQL/PostGIS.

## Estado
**Fase de planificación.** Aún no hay implementación ni modelos entrenados. Se respetarán las reglas oficiales de NASA Space Apps sobre trabajo previo al hackathon.

Consulta [docs/](docs/) para la planificación cuando esté disponible.
