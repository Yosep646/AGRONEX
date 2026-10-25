"use client";
import {Leaf,CloudRain,Sun,ShieldCheck} from "lucide-react";
import type {Weather,Parcel} from "../lib/api";

function numbers(input?:Record<string,number|null>){return Object.entries(input||{}).filter((x):x is [string,number]=>typeof x[1]==="number"&&Number.isFinite(x[1])&&x[1]>-900).sort((a,b)=>a[0].localeCompare(b[0]));}
function avg(a:number[]){return a.length?a.reduce((s,v)=>s+v,0)/a.length:null;}
export default function FarmGuidance({weather,parcels}:{weather:Weather|null;parcels:Parcel[]}){
 const t=numbers(weather?.data?.T2M),r=numbers(weather?.data?.PRECTOTCORR),s=numbers(weather?.data?.ALLSKY_SFC_SW_DWN);
 const rainfall=r.slice(-7),rainTotal=rainfall.length===7?rainfall.reduce((a,b)=>a+b[1],0):null;
 const temp=avg(t.slice(-7).map(x=>x[1])),solar=avg(s.slice(-7).map(x=>x[1]));
 const obs=rainfall.at(-1)?.[0];
 return <section className="ag-panel ag-guidance">
 <div className="ag-panel-title"><div><h2><Leaf size={21}/> Orientación para tus parcelas</h2><p>Señales climáticas observadas, no recetas automáticas de riego o siembra</p></div></div>
 <div className="ag-guidance-grid">
  <div className="ag-guidance-item"><CloudRain size={20}/><strong>Lluvia acumulada (7 días)</strong><b>{rainTotal===null?"Sin datos":rainTotal.toFixed(1)+" mm"}</b><small>{rainTotal===null?"Consulta al menos siete días de NASA POWER.":rainTotal===0?"No se registró precipitación en la serie consultada. Revisa la humedad del suelo en campo antes de regar.":"Comprueba drenaje y humedad de tu parcela antes de ajustar el riego."}</small></div>
  <div className="ag-guidance-item"><Sun size={20}/><strong>Temperatura media (7 días)</strong><b>{temp===null?"Sin datos":temp.toFixed(1)+" °C"}</b><small>{temp===null?"Carga observaciones de NASA POWER.":"Verifica las necesidades térmicas de tu cultivo y su etapa de desarrollo."}</small></div>
  <div className="ag-guidance-item"><ShieldCheck size={20}/><strong>Contexto de análisis</strong><b>{parcels.length} parcelas</b><small>{obs?"Última observación: "+obs+". Radiación media: "+(solar?.toFixed(1)??"—")+" kWh/m²/día.":"Sin serie climática cargada."} Los indicadores son orientativos.</small></div>
 </div>
 <p className="ag-muted">AGRONEX no determina aún un cultivo óptimo: faltan datos del suelo, historial de siembra, etapa fenológica y validación agronómica. Las observaciones de NASA POWER no son un pronóstico futuro.</p>
 </section>;
}
