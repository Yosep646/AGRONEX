"use client";
import {useEffect,useRef,useState} from "react";
import {CloudRain,RefreshCw,Leaf,CalendarDays,MapPin} from "lucide-react";
import {analyzeNewParcel,readLocalAnalysis,type ParcelAnalysis} from "../lib/parcelAnalysis";
import {getSupabase} from "../lib/supabase";
import type {Weather,Parcel} from "../lib/api";

export default function ModelForecast({weather,parcels,selectedParcelId}:{weather:Weather|null;parcels:Parcel[];selectedParcelId?:string}){
 const [selected,setSelected]=useState("");
 const [records,setRecords]=useState<ParcelAnalysis[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const activeRef=useRef(new Set<string>());
 const mountedRef=useRef(true);
 const current=selectedParcelId&&parcels.some(p=>p.id===selectedParcelId)?selectedParcelId:selected||parcels[0]?.id||"";
 const parcel=parcels.find(p=>p.id===current);
 const record=records.find(a=>a.parcelId===current);
 useEffect(()=>{const sync=()=>setRecords(readLocalAnalysis());sync();window.addEventListener("agronex:analysis",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("agronex:analysis",sync);window.removeEventListener("storage",sync)}},[]);
 useEffect(()=>{mountedRef.current=true;return()=>{mountedRef.current=false}},[]);
 useEffect(()=>{if(!parcel)return;const found=readLocalAnalysis().find(a=>a.parcelId===parcel.id);if(found)return;if(activeRef.current.has(parcel.id))return;activeRef.current.add(parcel.id);void update(parcel);},[parcel?.id]);
 async function update(target=parcel){
  if(!target)return;
  setBusy(true);setMessage("Consultando los datos de tu terreno...");
  try{
   const token=(await getSupabase()?.auth.getSession())?.data.session?.access_token;
   const outcome=await analyzeNewParcel(target,token);
   if(mountedRef.current)setRecords(readLocalAnalysis());
   setMessage(outcome.predictedRainMm===null?"El clima se ha consultado. La predicción todavía no está disponible.": "Se actualizó el análisis de tu terreno.");
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudieron consultar los datos ahora.");}
  finally{if(mountedRef.current)setBusy(false);activeRef.current.delete(target.id)}
 }
 return <section className="ag-panel ag-easy-analysis">
  <div className="ag-panel-title"><div><h2><Leaf size={22}/> Así está tu terreno</h2><p>AGRONEX revisa automáticamente los datos de tu parcela y te explica el resultado.</p></div></div>
  {parcels.length>0?<div className="ag-controls"><label>Terreno que deseas consultar<select value={current} onChange={e=>setSelected(e.target.value)}>{parcels.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>:<div className="ag-easy-empty"><MapPin size={28}/><strong>Primero registra tu terreno</strong><p>Necesitamos su ubicación para consultar el clima y analizarlo.</p><a href="/dashboard?section=parcels">Registrar terreno</a></div>}
  {parcel&&(record?<div className="ag-easy-result">
    <div className="ag-easy-result-head"><CloudRain size={30}/><div><span>Último análisis de {parcel.name}</span><strong>{record.predictedRainMm!==null?record.predictedRainMm.toFixed(1)+" mm de lluvia estimada":"Datos climáticos consultados"}</strong></div></div>
    <p>{record.predictedRainMm!==null?"Esta es una estimación experimental calculada con observaciones pasadas. Comprueba los avisos oficiales antes de decidir el riego.":"Tenemos datos observados de tu zona, pero no hay una predicción disponible para mostrar."}</p>
    <div className="ag-easy-facts"><span><CalendarDays size={15}/> Datos hasta {record.observedThrough}</span><span>Temperatura media reciente: {record.temperatureC===null?"—":record.temperatureC.toFixed(1)+" °C"}</span><span>Lluvia media reciente: {record.observedRainMm===null?"—":record.observedRainMm.toFixed(1)+" mm/día"}</span></div>
    <p className="ag-muted">Es información de apoyo. No mide directamente la humedad del suelo ni determina cuánto debes regar.</p>
  </div>:<div className="ag-easy-empty"><CloudRain size={29}/><strong>{busy?"Estamos analizando tu terreno":"Análisis pendiente"}</strong><p>{busy?"Consultamos NASA con la ubicación de tu parcela.":"Si los datos no se pudieron consultar automáticamente, puedes volver a intentarlo."}</p></div>)}
  {parcel&&<button className="ag-action" disabled={busy} onClick={()=>void update()}><RefreshCw size={16}/>{busy?"Analizando tu terreno...":"Actualizar análisis de mi terreno"}</button>}
  {message&&<p className="ag-muted" role="status">{message}</p>}
 </section>;
}
