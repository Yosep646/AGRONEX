"""Inferencia LSTM CPU con NumPy; pesos exportados desde PyTorch por entrenamiento confiable."""
from pathlib import Path
import numpy as np

WEIGHTS=Path(__file__).resolve().parents[1]/"artifacts"/"weather_lstm.npz"
FIELDS=("temperature_c","precipitation_mm","radiation_kwh_m2")

def predict_lstm(temperature_c,precipitation_mm,radiation_kwh_m2):
    if not WEIGHTS.is_file():
        raise FileNotFoundError("No hay pesos LSTM desplegados")
    with np.load(WEIGHTS,allow_pickle=False) as a:
        length=int(a["sequence_length"])
        rows=np.stack([temperature_c,precipitation_mm,radiation_kwh_m2],axis=1).astype(np.float64)
        if len(rows)!=length:raise ValueError(f"Se requieren {length} días completos")
        x=(rows-a["mean"])/a["scale"]
        h=np.zeros(a["bias_hh"].shape[0]//4,dtype=np.float64)
        c=np.zeros_like(h)
        for row in x:
            gates=a["weight_ih"]@row+a["bias_ih"]+a["weight_hh"]@h+a["bias_hh"]
            i,f,g,o=np.split(gates,4)
            sigmoid=lambda z:1/(1+np.exp(-np.clip(z,-40,40)))
            c=sigmoid(f)*c+sigmoid(i)*np.tanh(g)
            h=sigmoid(o)*np.tanh(c)
        prediction=float((a["linear_weight"]@h+a["linear_bias"])[0]*a["scale"][1]+a["mean"][1])
        return max(0.0,prediction)
