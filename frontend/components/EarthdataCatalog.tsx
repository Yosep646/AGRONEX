"use client";
import {useState} from "react";
import {Database,Search,ExternalLink} from "lucide-react";
import {API_URL} from "../lib/api";
type Item={id?:string;title?:string;time_start?:string;links?:string[]};
const OPTIONS=[{value:"smap",label:"SMAP · Humedad del suelo"},{value:"gpm",label:"GPM IMERG · Lluvia satelital"},{value:"hls-landsat",label:"HLS · Landsat"},{value:"hls-sentinel",label:"HLS · Sentinel-2"}];
export default function EarthdataCatalog({latitude,longitude}:{latitude:number;longitude:number}){
 const [product,setProduct]=useState("smap");
 const [start,setStart]=useState("2025-01-01");
 const [end,setEnd]=useState("2025-01-31");
 const [items,setItems]=useState<Item[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function search(){
  setBusy(true);setLoaded(false);setError("");setItems([]);
  try{
   const query=new URLSearchParams({product,latitude:String(latitude),longitude:String(longitude),start,end,limit:"8"});
   const r=await fetch(API_URL+"/api/earthdata/search?"+query,{cache:"no-store"});
   const payload=await r.json();
   if(!r.ok)throw new Error(typeof payload.detail==="string"?payload.detail:"NASA CMR no respondió");
   setItems(payload.items||[]);setLoaded(true);
  }catch(e){setError(e instanceof Error?e.message:"Fallo al consultar catálogo");}
  finally{setBusy(false)}
 }
 return <div className="ag-panel ag-catalog"><div className="ag-panel-title"><div><h2><Database size={20}/> Catálogo NASA Earthdata</h2><p>Buscar productos SMAP, GPM y HLS disponibles para la ubicación del mapa</p></div></div>
  <div className="ag-controls"><label>Producto<select value={product} onChange={e=>setProduct(e.target.value)}>{OPTIONS.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label><label>Inicio<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Fin<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><button className="ag-action" onClick={search} disabled={busy}><Search size={16}/>{busy?"Buscando...":"Buscar en NASA"}</button></div>
  {error&&<p className="ag-alert" role="alert">{error}</p>}
  {loaded&&items.length===0&&<p className="ag-muted">NASA no devolvió productos para la selección. Comprueba fechas, región y colección.</p>}
  {items.map((item,i)=><div className="ag-parcel" key={item.id||i}><Database size={18}/><div><b>{item.title||"Granulo NASA"}</b><small>{item.time_start||"Fecha no indicada"}</small></div>{item.links?.[0]&&<a className="ag-action" href={item.links[0]} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Fuente</a>}</div>)}
  <p className="ag-muted">Esta sección muestra metadatos, no lecturas de humedad, lluvia ni NDVI ya procesado. Algunas descargas requieren NASA Earthdata Login.</p>
 </div>;
}
