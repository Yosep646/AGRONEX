"""Descarga datos diarios NASA POWER y exporta CSV para ML/DL.
Ejemplo:
python data/export_power.py --latitude -9.93 --longitude -76.24 --start 20220101 --end 20251231 --out data/power_daily.csv
"""
import argparse
import csv
from datetime import datetime
from pathlib import Path
import httpx

URL="https://power.larc.nasa.gov/api/temporal/daily/point"
COLUMNS={"T2M":"temperature_c","PRECTOTCORR":"precipitation_mm",
         "ALLSKY_SFC_SW_DWN":"radiation_kwh_m2"}

def export(lat:float,lon:float,start:str,end:str,out:Path):
    for dt in [start,end]:
        datetime.strptime(dt,"%Y%m%d")
    if start>end: raise ValueError("El inicio debe preceder al fin")
    params={"latitude":lat,"longitude":lon,"start":start,"end":end,
            "parameters":",".join(COLUMNS),"community":"AG","format":"JSON"}
    response=httpx.get(URL,params=params,timeout=120)
    response.raise_for_status()
    payload=response.json()
    series=payload["properties"]["parameter"]
    days=sorted(set.intersection(*(set(series[k]) for k in COLUMNS)))
    out.parent.mkdir(parents=True,exist_ok=True)
    with out.open("w",newline="",encoding="utf-8") as stream:
        writer=csv.DictWriter(stream,fieldnames=["date",*COLUMNS.values()])
        writer.writeheader()
        for day in days:
            values=[series[k][day] for k in COLUMNS]
            # POWER puede usar -999 para observaciones ausentes.
            if any(v is None or not isinstance(v,(int,float)) or v <= -900 for v in values):
                continue
            row={"date":datetime.strptime(day,"%Y%m%d").strftime("%Y-%m-%d")}
            row.update({name:series[code][day] for code,name in COLUMNS.items()})
            writer.writerow(row)
    print(f"Datos exportados: {out} ({len(days)} fechas examinadas)")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--latitude",type=float,required=True)
    p.add_argument("--longitude",type=float,required=True)
    p.add_argument("--start",required=True)
    p.add_argument("--end",required=True)
    p.add_argument("--out",type=Path,default=Path("data/power_daily.csv"))
    a=p.parse_args()
    export(a.latitude,a.longitude,a.start,a.end,a.out)
