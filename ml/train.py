"""Baseline educativo: comparar climatología histórica y Random Forest.
No estima rendimientos ni recomienda cultivos. Entrenamiento con CSV propio.
CSV esperado: date,temperature_c,precipitation_mm,radiation_mj_m2
"""
import argparse
from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

def build_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, parse_dates=["date"]).sort_values("date").drop_duplicates("date")
    required = ["temperature_c", "precipitation_mm", "radiation_mj_m2"]
    if not set(required).issubset(df.columns):
        raise ValueError(f"Se requieren columnas: {required}")
    df["day_of_year"] = df["date"].dt.dayofyear
    for column in required:
        for lag in (1, 3, 7):
            df[f"{column}_lag{lag}"] = df[column].shift(lag)
    # Objetivo: precipitación observada del día presente; entradas únicamente de días anteriores.
    df["target"] = df["precipitation_mm"]
    return df.dropna()

def train(path: Path, out: Path):
    df = build_dataset(path)
    if len(df) < 50:
        raise ValueError("Se necesitan al menos 50 registros diarios utilizables")
    feature_cols = [c for c in df.columns if "_lag" in c or c == "day_of_year"]
    split = int(len(df) * 0.8)
    X_train, X_test = df[feature_cols].iloc[:split], df[feature_cols].iloc[split:]
    y_train, y_test = df["target"].iloc[:split], df["target"].iloc[split:]
    model = RandomForestRegressor(n_estimators=100, random_state=42, min_samples_leaf=3)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    baseline = [float(y_train.mean())] * len(y_test)
    print({"mae_model": round(mean_absolute_error(y_test, preds), 3),
           "mae_baseline": round(mean_absolute_error(y_test, baseline), 3),
           "train_samples": len(X_train), "test_samples": len(X_test)})
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": feature_cols, "target": "daily_precipitation_mm"}, out)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("ml/artifacts/rf_precipitation.joblib"))
    args = parser.parse_args()
    train(args.csv, args.out)
