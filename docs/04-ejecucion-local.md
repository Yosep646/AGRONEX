# Ejecutar AGRONEX localmente (prototipo preparatorio)

## 1. Supabase
Crear un proyecto propio en https://supabase.com/ y ejecutar `supabase/migrations/001_initial.sql` en SQL Editor.
Las tablas usan RLS y vinculan parcelas con `auth.users`. No publicar jamás claves secretas.
El backend inicial **no escribe aún en Supabase**: la migración prepara la estructura sin fingir integración.

## 2. API FastAPI
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
API: http://localhost:8000/docs
Ejemplo: http://localhost:8000/api/environment/power?latitude=-9.93&longitude=-76.24&start=2025-01-01&end=2025-01-31

## 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Abrir http://localhost:3000

## 4. ML
El archivo `ml/train.py` contiene entrenamiento **local y separado** de un baseline Random Forest; no está conectado a la API ni se suministran pesos preentrenados.
Se requiere CSV histórico propio con encabezados `date,temperature_c,precipitation_mm,radiation_mj_m2`.
```bash
python ml/train.py --csv path/to/daily_weather.csv
```
Los resultados se evalúan cronológicamente y deben compararse con la línea base.
Deep Learning se integrará después de conseguir y validar datos suficientes.

## Estado y cumplimiento
Este repositorio contiene un **prototipo preparatorio desarrollado antes del evento**. Verificar las reglas de NASA Space Apps antes de reutilizar cualquier parte como solución presentada durante el hackathon.
