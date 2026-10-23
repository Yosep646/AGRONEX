"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Leaf,LayoutDashboard,Satellite,CloudSun,BrainCircuit,MapPin,ShieldCheck,Droplets,Sun,RefreshCw,ArrowUpRight,Database,Activity,BarChart3,ExternalLink} from "lucide-react";
import {getSupabase} from "../../lib/supabase";
import {getParcels,getWeather,type Parcel,type Weather,API_URL} from "../../lib/api";

const links=[{name:"Panel general",icon:LayoutDashboard,href:"/dashboard"},{name:"Mis parcelas",icon:MapPin,href:"/manage"},{name:"Visión satelital",icon:Satellite,href:"/satellite"},{name:"Clima NASA",icon:CloudSun,href:"/manage"},{name:"Análisis e IA",icon:BrainCircuit,href:"/dashboard#inteligencia"}];
const initial={latitude:-9.93,longitude:-76.24,start:"2025-01-01",end:"2025-01-31"};
function validValues(source?:Record<string,number|null>): [string,number][]{return Object.entries(source||{}).filter((entry):entry is [string,number]=>typeof entry[1]==="number"&&Number.isFinite(entry[1])&&entry[1]>-900)}
function mean(source?:Record<string,number|null>){const a=validValues(source);return a.length?(a.reduce((sum,[,v])=>sum+v,0)/a.length).toFixed(1):"—"}
export default function Dashboard(){
 const [parcels,setParcels]=useState<Parcel[]>([]);
 const [weather,setWeather]=useState<Weather|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [coords,setCoords]=useState(initial);
 const [email,setEmail]=useState("");
 const [models,setModels]=useState<{ml:string;dl:string}|null>(null);
 useEffect(()=>{
  const supabase=getSupabase();
  const update=async()=>{const session=await supabase?.auth.getSession();const t=session?.data.session?.access_token||"";setEmail(session?.data.session?.user.email||"");if(t)getParcels(t).then(setParcels).catch(()=>setParcels([]));else setParcels([])};
  void update();
  const sub=supabase?.auth.onAuthStateChange(()=>{void update()});
  fetch(API_URL+"/api/models/status").then(r=>r.ok?r.json():null).then(setModels).catch(()=>setModels(null));
  return()=>sub?.data.subscription.unsubscribe();
 },[]);
 async function refresh(){
  setBusy(true);setError("");
  try{setWeather(await getWeather(coords.latitude,coords.longitude,coords.start,coords.end))}
  catch(e){setError(e instanceof Error?e.message:"Error al consultar NASA")}
  finally{setBusy(false)}
 }
 const data=weather?.data;
 const rain=validValues(data?.PRECTOTCORR).slice(-26);
 const peak=Math.max(1,...rain.map(([,value])=>value));
 const totalArea=parcels.reduce((v,p)=>v+(p.area_ha||0),0);
 return <div className="ag-layout">
  <aside className="ag-sidebar">
   <Link className="ag-logo" href="/dashboard"><Leaf size={30}/> <span>AGRONEX<small>Inteligencia agrícola espacial</small></span></Link>
   <div className="ag-nav">{links.map(x=><Link key={x.name} className={x.href==="/dashboard"?"selected":""} href={x.href}><x.icon size={18}/>{x.name}</Link>)}</div>
   <div className="ag-side-note"><Leaf size={29}/><h3>Agricultura informada</h3><p>Observaciones de NASA y análisis científico para gestionar el territorio.</p><small>NASA Space Apps · 2026</small></div>
  </aside>
  <div className="ag-workspace">
   <header className="ag-header"><div><span className="ag-kicker">PLATAFORMA DE INTELIGENCIA AGRÍCOLA</span><h1>Panel de control</h1><p>Datos ambientales, parcelas y capacidades analíticas en un solo lugar.</p></div><div className="ag-profile"><ShieldCheck size={18}/><span>{email||"Modo exploración"}</span></div></header>
   <section className="ag-stats">
    <article><div className="ag-stat-icon"><MapPin/></div><span>Parcelas registradas</span><strong>{parcels.length}</strong><small>{email?"Datos de tu cuenta":"Inicia sesión para consultar"}</small></article>
    <article><div className="ag-stat-icon"><Leaf/></div><span>Superficie registrada</span><strong>{totalArea.toFixed(1)} <em>ha</em></strong><small>Superficie declarada por los usuarios</small></article>
    <article><div className="ag-stat-icon blue"><CloudSun/></div><span>Temperatura media NASA</span><strong>{mean(data?.T2M)} <em>°C</em></strong><small>{weather?"Periodo consultado":"Sin consulta todavía"}</small></article>
    <article><div className="ag-stat-icon violet"><BrainCircuit/></div><span>Modelos analíticos</span><strong className="ag-stat-text">{models?.ml==="trained"?"ML disponible":"En preparación"}</strong><small>DL: {models?.dl==="not_deployed"?"sin desplegar":models?.dl||"sin conexión"}</small></article>
   </section>
   <section className="ag-content">
    <div className="ag-left">
     <article className="ag-panel ag-map">
      <div className="ag-panel-title"><div><h2><Satellite size={21}/> Visión satelital NASA</h2><p>Imágenes reales MODIS Terra mediante NASA GIBS</p></div><Link className="ag-action" href="/satellite">Explorar mapa <ArrowUpRight size={16}/></Link></div>
      <Link href="/satellite" className="ag-map-preview"><div className="ag-map-copy"><span className="ag-pill">NASA Earth Observation</span><h3>Observa tus parcelas desde el espacio</h3><p>Explora imágenes por fecha y posición. La evaluación NDVI con HLS es una fase independiente.</p><span className="ag-open">Abrir visor satelital <ArrowUpRight size={17}/></span></div><div className="ag-orbit">◎</div></Link>
      <div className="ag-map-bottom"><span><Satellite size={15}/> NASA GIBS</span><span><Database size={15}/> HLS pendiente de procesamiento</span></div>
     </article>
     <article className="ag-panel">
       <div className="ag-panel-title"><div><h2><CloudSun size={21}/> Clima y observaciones</h2><p>NASA POWER · consultas históricas por ubicación</p></div><button className="ag-action" onClick={refresh} disabled={busy}><RefreshCw size={16}/>{busy?"Consultando...":"Consultar"}</button></div>
       <div className="ag-controls"><label>Latitud<input type="number" step="any" min={-90} max={90} value={coords.latitude} onChange={e=>setCoords(v=>({...v,latitude:Number(e.target.value)}))}/></label><label>Longitud<input type="number" step="any" min={-180} max={180} value={coords.longitude} onChange={e=>setCoords(v=>({...v,longitude:Number(e.target.value)}))}/></label><label>Desde<input type="date" value={coords.start} onChange={e=>setCoords(v=>({...v,start:e.target.value}))}/></label><label>Hasta<input type="date" value={coords.end} onChange={e=>setCoords(v=>({...v,end:e.target.value}))}/></label></div>
       {error&&<div className="ag-alert" role="alert">{error}</div>}
       <div className="ag-measures"><div><Sun size={23}/><span>Temperatura</span><strong>{mean(data?.T2M)} °C</strong></div><div><Droplets size={23}/><span>Precipitación media</span><strong>{mean(data?.PRECTOTCORR)} mm/día</strong></div><div><Activity size={23}/><span>Radiación media</span><strong>{mean(data?.ALLSKY_SFC_SW_DWN)} kWh/m²/día</strong></div></div>
       <h3 className="ag-chart-heading">Precipitación diaria <small>últimos {rain.length} registros disponibles</small></h3>
       {rain.length?<div className="ag-rain-chart">{rain.map(([date,value])=><div key={date} title={date+" · "+value+" mm"} style={{height:Math.max(2,100*value/peak)+"%"}}/>)}</div>:<div className="ag-chart-empty">Consulta NASA POWER para visualizar datos reales.</div>}
     </article>
    </div>
    <div className="ag-right">
     <article className="ag-panel" id="inteligencia"><div className="ag-panel-title"><div><h2><BrainCircuit size={21}/> Inteligencia artificial</h2><p>Entrenamiento ML / DL y evaluación</p></div></div><div className="ag-model-row"><span className="ag-dot green"/><div><b>Random Forest</b><small>Predicción experimental de precipitación</small></div><span className="ag-status">{models?.ml==="trained"?"Entrenado":"Sin pesos"}</span></div><div className="ag-model-row"><span className="ag-dot purple"/><div><b>LSTM · PyTorch</b><small>Aprendizaje de series temporales</small></div><span className="ag-status">No desplegado</span></div><p className="ag-disclaimer">No mostramos pronósticos ni consejos agrícolas inventados. Los modelos requieren datos, validación y despliegue de artefactos.</p></article>
     <article className="ag-panel"><div className="ag-panel-title"><div><h2><BarChart3 size={21}/> Mis parcelas</h2><p>Información guardada en Supabase</p></div><Link href="/manage" className="ag-link">Gestionar →</Link></div>{parcels.length?parcels.slice(0,5).map(p=><div className="ag-parcel" key={p.id}><span><MapPin size={19}/></span><div><b>{p.name}</b><small>{p.area_ha? p.area_ha+" ha · ":""}{p.latitude.toFixed(3)}, {p.longitude.toFixed(3)}</small></div></div>):<p className="ag-muted">{email?"No hay parcelas registradas.":"Inicia sesión en Mis parcelas para ver tus terrenos."}</p>}</article>
     <article className="ag-panel ag-advice"><h2><ShieldCheck size={20}/> Fuentes verificables</h2><p>NASA POWER suministra estadísticas ambientales. GIBS muestra imágenes de la Tierra. HLS podrá aportar bandas para calcular índices de vegetación.</p><a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">Fuente NASA POWER <ExternalLink size={15}/></a></article>
    </div>
   </section>
   <footer className="ag-footer">AGRONEX · Prototipo de investigación · Los datos de teledetección no sustituyen diagnósticos de campo.</footer>
  </div>
 </div>
}
