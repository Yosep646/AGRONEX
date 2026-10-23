"""Entrenamiento reproducible ML con CSV de observaciones NASA POWER.
Columnas: date,temperature_c,precipitation_mm,radiation_kwh_m2.
"""
from pathlib import Path
import argparse
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

FIELDS = ("temperature_c", "precipitation_mm", "radiation_kwh_m2")

def train(csv_path: Path, output_path: Path):
    df = pd.read_csv(csv_path, parse_dates=["date"]).sort_values("date").drop_duplicates("date")
    df = df.dropna(subset=list(FIELDS))
    if len(df) < 120:
        raise ValueError("Se requieren 120 observaciones completas como mínimo")
    df["day_of_year"] = df["date"].dt.dayofyear
    features = ["day_of_year"]
    for field in FIELDS:
        for lag in (1, 3, 7):
            name = f"{field}_lag{lag}"
            df[name] = df[field].shift(lag)
            features.append(name)
    df = df.dropna(subset=features)
    split = int(len(df)*0.8)
    x_train, x_test = df[features].iloc[:split], df[features].iloc[split:]
    y_train, y_test = df["precipitation_mm"].iloc[:split], df["precipitation_mm"].iloc[split:]
    model = RandomForestRegressor(n_estimators=120, min_samples_leaf=3, random_state=42, n_jobs=-1)
    model.fit(x_train, y_train)
    predicted = model.predict(x_test)
    baseline = [float(y_train.mean())]*len(y_test)
    metrics = {"mae_ml_mm": float(mean_absolute_error(y_test, predicted)),
               "mae_baseline_mm": float(mean_absolute_error(y_test, baseline)),
               "samples_train": len(x_train), "samples_test": len(x_test)}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model":model, "features":features, "metrics":metrics}, output_path)
    print(metrics)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--csv", type=Path, required=True)
    p.add_argument("--out", type=Path, default=Path("backend/artifacts/weather_rf.joblib"))
    a = p.parse_args()
    train(a.csv, a.out)
