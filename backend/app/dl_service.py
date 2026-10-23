"""LSTM opcional: entrenamiento fuera del servicio web.
Se importa torch únicamente cuando se ejecuta la fase de entrenamiento.
"""
from pathlib import Path
import numpy as np

FEATURES = ["temperature_c", "precipitation_mm", "radiation_kwh_m2"]

def build_sequences(values: np.ndarray, sequence_length: int = 14):
    if len(values) <= sequence_length:
        raise ValueError("Historial insuficiente para crear secuencias")
    x, y = [], []
    for i in range(sequence_length, len(values)):
        x.append(values[i-sequence_length:i])
        y.append(values[i,1])
    return np.asarray(x, dtype=np.float32), np.asarray(y, dtype=np.float32)

def train_lstm(csv_path: str, output_path: str, epochs: int = 25):
    import pandas as pd
    import torch
    from torch import nn
    from sklearn.metrics import mean_absolute_error
    from sklearn.preprocessing import StandardScaler
    torch.manual_seed(42)
    data = pd.read_csv(csv_path, parse_dates=["date"]).sort_values("date")
    data = data.drop_duplicates("date").dropna(subset=FEATURES)
    if len(data) < 120:
        raise ValueError("Se requieren al menos 120 registros diarios completos")
    raw = data[FEATURES].to_numpy(dtype=np.float32)
    split = int(len(raw)*0.8)
    scaler = StandardScaler().fit(raw[:split])
    normalized = scaler.transform(raw).astype(np.float32)
    length = 14
    X, y = build_sequences(normalized, length)
    train_samples = split-length
    x_train=torch.tensor(X[:train_samples]);y_train=torch.tensor(y[:train_samples])
    x_test=torch.tensor(X[train_samples:]);y_test=torch.tensor(y[train_samples:])
    class LSTMModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.lstm=nn.LSTM(input_size=3,hidden_size=24,batch_first=True)
            self.out=nn.Linear(24,1)
        def forward(self,z):
            h,_=self.lstm(z)
            return self.out(h[:,-1,:]).squeeze(-1)
    model=LSTMModel()
    optimizer=torch.optim.Adam(model.parameters(),lr=0.003)
    loss_fn=nn.MSELoss()
    for _ in range(epochs):
        model.train();optimizer.zero_grad()
        loss=loss_fn(model(x_train),y_train);loss.backward();optimizer.step()
    model.eval()
    with torch.no_grad(): forecast=model(x_test).numpy()
    # Invertir solo la variable objetivo mediante escala y media de precipitación.
    scale=float(scaler.scale_[1]);center=float(scaler.mean_[1])
    mae=float(mean_absolute_error(y_test.numpy()*scale+center,forecast*scale+center))
    output=Path(output_path);output.parent.mkdir(parents=True,exist_ok=True)
    torch.save({"state_dict":model.state_dict(),"mean":scaler.mean_.tolist(),
                "scale":scaler.scale_.tolist(),"sequence_length":length,
                "features":FEATURES,"mae_test_mm":mae}, output)
    return {"model":"LSTM","mae_test_mm":round(mae,3),"test_samples":len(x_test)}

if __name__=="__main__":
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument("--csv",required=True)
    parser.add_argument("--out",default="backend/artifacts/weather_lstm.pt")
    args=parser.parse_args()
    print(train_lstm(args.csv,args.out))
