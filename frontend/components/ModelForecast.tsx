"use client";
import {useEffect,useState} from "react";
import {BrainCircuit,RefreshCw} from "lucide-react";
import {getSupabase} from "../lib/supabase";
import {API_URL,type Weather,type Parcel} from "../lib/api";
type State={ml:string;dl:string};
type Output={predicted_precipitation_mm:number;model:string;warning:string};
const names=[["T2M","temperature_c"],["PRECTOTCORR","precipitation_mm"],["ALLSKY_SFC_SW_DWN","radiation_kwh_m2"]] as const;
export default function ModelForecast({weather,parcels}:{weather:Weather|null;parcels:Parcel[]}){
 const [status,setStatus]=useState<State|null>(null);
 const [model,setModel]=useState<"ml"|"dl">("ml");
 const [busy,setBusy]=useState(false);
 const [parcelId,setParcelId]=useState("");
 const [history,setHistory]=useState<Array<{id:string;model_name:string;created_at:string;result:{predicted_precipitation_mm?:number}}>>([]);
 const [saveNote,setSaveNote]=useState("");
 const [result,setResult]=useState<Output|null>(null);
 const [error,setError]=useState("");
 const [metrics,setMetrics]=useState<Record<string,unknown>|null>(null);
 useEffect(()=>{fetch(API_URL+"/api/models/status").then(r=>r.json()).then(setStatus).catch(()=>setStatus(null));fetch(API_URL+"/api/models/metrics").then(r=>r.ok?r.json():null).then(setMetrics).catch(()=>setMetrics(null));},[]);
 async function loadHistory(id:string){
  setParcelId(id);setHistory([]);if(!id)return;
  const token=(await getSupabase()?.auth.getSession())?.data.session?.access_token;
  if(!token)return;
  const r=await fetch(API_URL+"/api/analysis/"+id,{headers:{Authorization:"Bearer "+token}});
  if(r.ok)setHistory(await r.json());
 }
 async function predict(){
  setError("");setResult(null);setSaveNote("");setBusy(true);
  try{
   if(!weather)throw new Error("Primero consulta NASA POWER en el panel de clima.");
   const days=Object.keys(weather.data.T2M||{}).sort().filter(d=>names.every(([key])=>typeof weather.data[key]?.[d]==="number"&&Number(weather.data[key][d])>-900));
   const required=model==="dl"?14:7;
   if(days.length<required)throw new Error("Se necesitan "+required+" días de datos válidos.");
   const last=days.slice(-required);
   const params:Record<string,number[]|number>={};
   for(const [field,key] of names)params[key]=last.map(day=>Number(weather.data[field][day]));
   if(model==="ml"){
     const date=new Date(last[last.length-1]+"T12:00:00Z");date.setUTCDate(date.getUTCDate()+1);
     params.day_of_year=Math.floor((date.getTime()-Date.UTC(date.getUTCFullYear(),0,0))/86400000);
   }
   const token=(await getSupabase()?.auth.getSession())?.data.session?.access_token;
   if(parcelId&&token){
     const payload=model==="ml"?{parcel_id:parcelId,model:"random_forest",period_end:last[last.length-1],weather:params}:{parcel_id:parcelId,model:"lstm",period_end:last[last.length-1],...params};
     const r=await fetch(API_URL+"/api/analysis",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(payload)});
     const body=await r.json();
     if(!r.ok)throw new Error(typeof body.detail==="string"?body.detail:"No se pudo guardar el análisis");
     setResult(body.prediction);setSaveNote("Análisis guardado en el historial de la parcela.");
     void loadHistory(parcelId);
     return;
   }
   const path=model==="ml"?"/api/models/rainfall/forecast":"/api/models/rainfall/forecast-lstm";
   const response=await fetch(API_URL+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(params)});
   const body=await response.json();
   if(!response.ok)throw new Error(typeof body.detail==="string"?body.detail:"La inferencia no está disponible");
   setResult(body);
  }catch(e){setError(e instanceof Error?e.message:"Error de predicción");}finally{setBusy(false)}
 }
 return <article className="ag-panel"><div className="ag-panel-title"><div><h2><BrainCircuit size={21}/> Predicción experimental ML/DL</h2><p>Estimación meteorológica para el día siguiente; no recomendación de cultivo</p></div></div>
  <div className="ag-controls"><label>Parcela para registrar el análisis<select value={parcelId} onChange={e=>void loadHistory(e.target.value)}><option value="">Sin parcela (no guardar)</option>{parcels.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
  <div className="ag-model-predict-controls"><label>Modelo<select value={model} onChange={e=>{setModel(e.target.value as "ml"|"dl");setResult(null);}}><option value="ml">Random Forest · ML</option><option value="dl">LSTM · Deep Learning</option></select></label><span>ML: {status?.ml||"desconocido"} · DL: {status?.dl||"desconocido"}</span><button className="ag-action" onClick={predict} disabled={busy}><RefreshCw size={14}/>{busy?"Analizando...":"Estimar precipitación"}</button></div>
  {error&&<p className="ag-alert" role="alert">{error}</p>}
  {saveNote&&<p role="status" className="ag-muted">{saveNote}</p>}
  {result&&<div className="ag-result"><strong>{result.predicted_precipitation_mm.toFixed(2)} mm</strong><span>{result.model} · horizonte de un día</span><small>{result.warning}</small></div>}
  {parcelId&&<div className="ag-history"><h3>Historial de análisis de la parcela</h3>{history.length===0?<p className="ag-muted">Aún no hay predicciones registradas.</p>:history.map(item=><div key={item.id} className="ag-parcel"><span>{new Date(item.created_at).toLocaleDateString("es-PE")} · {item.model_name}</span><strong>{item.result?.predicted_precipitation_mm?.toFixed(2)??"—"} mm</strong></div>)}</div>}
  {metrics&&<p className="ag-muted">Métricas experimentales publicadas por el entrenamiento. Consulta <a href={API_URL+"/api/models/metrics"} target="_blank" rel="noreferrer">el reporte de evaluación</a>.</p>}
 </article>;
}
