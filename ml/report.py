"""Exporta métricas almacenadas por los entrenamientos, sin inventar resultados."""
import argparse
import json
from pathlib import Path
import joblib
import torch

def main(ml:Path, dl:Path, out:Path):
    a=joblib.load(ml)
    b=torch.load(dl,map_location="cpu",weights_only=True)
    report={
        "source":"NASA POWER (CSV descargado en la ejecución)",
        "target":"precipitation_mm, un día futuro",
        "validation":"división cronológica de aproximadamente 80/20",
        "random_forest":a["metrics"],
        "lstm":{"mae_test_mm":float(b["mae_test_mm"])},
        "disclaimer":"Estimaciones experimentales; requieren comparación con línea base e inspección de sesgos."
    }
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--ml",type=Path,required=True)
    parser.add_argument("--dl",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    main(args.ml,args.dl,args.out)
