"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Leaf,LayoutDashboard,Satellite,CloudSun,BrainCircuit,MapPin,ShieldCheck,Droplets,Sun,RefreshCw,ArrowUpRight,Database,Activity,BarChart3,ExternalLink,Search,Bell,FileText,Settings,CalendarDays,TrendingUp} from "lucide-react";
import {getSupabase} from "../../lib/supabase";
import SatelliteMap from "../../components/SatelliteMap";
import ClimateChart from "../../components/ClimateChart";
import EarthdataCatalog from "../../components/EarthdataCatalog";
import ModelForecast from "../../components/ModelForecast";
import {addParcel,getParcels,getWeather,type Parcel,type Weather,API_URL} from "../../lib/api";

const links=[{name:"Panel general",icon:LayoutDashboard,href:"/dashboard"},{name:"Mis parcelas",icon:MapPin,href:"/dashboard?section=parcels"},{name:"Visión satelital",icon:Satellite,href:"/dashboard?section=satellite"},{name:"Clima NASA",icon:CloudSun,href:"/dashboard?section=climate"},{name:"Análisis e IA",icon:BrainCircuit,href:"/dashboard?section=ai"},{name:"Reportes",icon:FileText,href:"/dashboard?section=reports"},{name:"Configuración",icon:Settings,href:"/dashboard?section=settings"}];
const initial={latitude:-9.93,longitude:-76.24,start:"2025-01-01",end:"2025-01-31"};
function validValues(source?:Record<string,number|null>): [string,number][]{return Object.entries(source||{}).filter((entry):entry is [string,number]=>typeof entry[1]==="number"&&Number.isFinite(entry[1])&&entry[1]>-900)}
function mean(source?:Record<string,number|null>){const a=validValues(source);return a.length?(a.reduce((sum,[,v])=>sum+v,0)/a.length).toFixed(1):"—"}
export default function Dashboard(){
 const [section,setSection]=useState<"overview"|"parcels"|"satellite"|"climate"|"ai"|"reports"|"settings">("overview");
 const [loginEmail,setLoginEmail]=useState("");
 const [loginPassword,setLoginPassword]=useState("");
 const [authError,setAuthError]=useState("");
 const [token,setToken]=useState("");
 const [parcelName,setParcelName]=useState("");
 const [parcelArea,setParcelArea]=useState("");
 const [parcelStatus,setParcelStatus]=useState("");
 const [formBusy,setFormBusy]=useState(false);
 useEffect(()=>{{const value=new URLSearchParams(window.location.search).get("section");if(value==="parcels"||value==="satellite"||value==="climate"||value==="ai"||value==="reports"||value==="settings")setSection(value)}},[]);
 const [parcels,setParcels]=useState<Parcel[]>([]);
 const [selectedParcelId,setSelectedParcelId]=useState("");
 const [weather,setWeather]=useState<Weather|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [coords,setCoords]=useState(initial);
 const [email,setEmail]=useState("");
 const [models,setModels]=useState<{ml:string;dl:string}|null>(null);
 useEffect(()=>{
  const supabase=getSupabase();
  const update=async()=>{const session=await supabase?.auth.getSession();const t=session?.data.session?.access_token||"";setEmail(session?.data.session?.user.email||"");setToken(t);if(t)getParcels(t).then(setParcels).catch(()=>setParcels([]));else setParcels([])};
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
 async function signIn(){const sb=getSupabase();if(!sb){setAuthError("Configura Supabase en Render.");return;}setFormBusy(true);setAuthError("");const {error}=await sb.auth.signInWithPassword({email:loginEmail,password:loginPassword});setFormBusy(false);if(error)setAuthError(error.message);else setLoginPassword("");}
 async function saveParcel(){if(!token){setParcelStatus("Inicia sesión para registrar parcelas.");return;}setFormBusy(true);setParcelStatus("");try{await addParcel(token,{name:parcelName.trim(),latitude:coords.latitude,longitude:coords.longitude,...(parcelArea?{area_ha:Number(parcelArea)}:{})});setParcels(await getParcels(token));setParcelName("");setParcelArea("");setParcelStatus("Parcela guardada correctamente.");}catch(e){setParcelStatus(e instanceof Error?e.message:"Error guardando parcela");}finally{setFormBusy(false);}}
 const data=weather?.data;
 const rain=validValues(data?.PRECTOTCORR).slice(-26);
 const peak=Math.max(1,...rain.map(([,value])=>value));
 const totalArea=parcels.reduce((v,p)=>v+(p.area_ha||0),0);
 return <div className="ag-layout">
  <aside className="ag-sidebar">
   <Link className="ag-logo" href="/dashboard" onClick={()=>setSection("overview")}><Leaf size={30}/> <span>AGRONEX<small>Inteligencia agrícola espacial</small></span></Link>
   <div className="ag-nav">{links.map(x=><Link key={x.name} className={(section==="parcels"?x.name==="Mis parcelas":section==="satellite"?x.name==="Visión satelital":section==="climate"?x.name==="Clima NASA":section==="ai"?x.name==="Análisis e IA":section==="reports"?x.name==="Reportes":section==="settings"?x.name==="Configuración":x.href==="/dashboard")?"selected":""} href={x.href} onClick={()=>setSection(x.name==="Mis parcelas"?"parcels":x.name==="Visión satelital"?"satellite":x.name==="Clima NASA"?"climate":x.name==="Análisis e IA"?"ai":x.name==="Reportes"?"reports":x.name==="Configuración"?"settings":"overview")}><x.icon size={18}/>{x.name}</Link>)}</div>
   <div className="ag-side-note"><Leaf size={29}/><h3>Agricultura informada</h3><p>Observaciones de NASA y análisis científico para gestionar el territorio.</p><small>NASA Space Apps · 2026</small></div>
  </aside>
  <div className="ag-workspace">
   <div className="ag-topbar"><div className="ag-top-search"><Search size={16}/><input aria-label="Buscar parcela" placeholder="Buscar parcela por nombre..." onChange={e=>{const q=e.target.value.toLowerCase();const p=parcels.find(v=>v.name.toLowerCase().includes(q));if(p&&q.length>2){setSelectedParcelId(p.id);setCoords(v=>({...v,latitude:p.latitude,longitude:p.longitude}));}}}/></div><div className="ag-top-actions"><span><CalendarDays size={16}/> {new Date().toLocaleDateString("es-PE")}</span><span title="Alertas disponibles cuando existan reglas verificadas"><Bell size={17}/></span><span className="ag-user-avatar">{email?email[0].toUpperCase():"A"}</span></div></div>
   <header className="ag-header"><div><span className="ag-kicker">PLATAFORMA DE INTELIGENCIA AGRÍCOLA</span><h1>Panel de control</h1><p>Datos ambientales, parcelas y capacidades analíticas en un solo lugar.</p></div><div className="ag-profile"><ShieldCheck size={18}/><span>{email||"Modo exploración"}</span></div></header>
   {section==="satellite" ? <section className="ag-panel"><div className="ag-panel-title"><div><h2><Satellite size={22}/> Visión satelital NASA</h2><p>Explora las imágenes GIBS desde el mismo panel de AGRONEX.</p></div><button className="ag-action" onClick={()=>setSection("overview")}>Panel general</button></div><div className="ag-parcel-picker"><label>Parcela</label><select aria-label="Seleccionar parcela" value={selectedParcelId} onChange={e=>{const id=e.target.value;setSelectedParcelId(id);const parcel=parcels.find(p=>p.id===id);if(parcel)setCoords(v=>({...v,latitude:parcel.latitude,longitude:parcel.longitude}));}}><option value="">Ubicación de referencia · Huánuco</option>{parcels.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><SatelliteMap latitude={coords.latitude} longitude={coords.longitude} parcels={parcels} selectedParcelId={selectedParcelId}/><p className="ag-muted">Las imágenes NASA disponibles dependen de la fecha. No son una transmisión en vivo ni un mapa NDVI de parcelas.</p></section> : section==="climate" ? <section className="ag-panel"><div className="ag-panel-title"><div><h2><CloudSun size={22}/> Clima NASA POWER</h2><p>Observaciones meteorológicas históricas por coordenadas.</p></div><button className="ag-action" disabled={busy} onClick={refresh}>{busy?"Consultando...":"Consultar NASA"}</button></div><div className="ag-controls"><label>Latitud<input type="number" value={coords.latitude} step="any" onChange={e=>setCoords(v=>({...v,latitude:Number(e.target.value)}))}/></label><label>Longitud<input type="number" value={coords.longitude} step="any" onChange={e=>setCoords(v=>({...v,longitude:Number(e.target.value)}))}/></label><label>Desde<input type="date" value={coords.start} onChange={e=>setCoords(v=>({...v,start:e.target.value}))}/></label><label>Hasta<input type="date" value={coords.end} onChange={e=>setCoords(v=>({...v,end:e.target.value}))}/></label></div>{error&&<p role="alert">{error}</p>}<div className="ag-measures"><div><Sun/><span>Temperatura</span><strong>{mean(weather?.data.T2M)} °C</strong></div><div><Droplets/><span>Precipitación</span><strong>{mean(weather?.data.PRECTOTCORR)} mm/día</strong></div><div><Activity/><span>Radiación</span><strong>{mean(weather?.data.ALLSKY_SFC_SW_DWN)} kWh/m²/día</strong></div></div></section> : section==="ai" ? <section className="ag-panel"><div className="ag-panel-title"><div><h2><BrainCircuit size={22}/> Análisis con IA</h2><p>Estado verificable del entrenamiento e inferencia de modelos.</p></div></div><div className="ag-model-row"><div><b>Random Forest</b><small>Predicción experimental de lluvia</small></div><span className="ag-status">{models?.ml==="trained"?"Entrenado":"Sin pesos entrenados"}</span></div><div className="ag-model-row"><div><b>LSTM · PyTorch</b><small>Series meteorológicas</small></div><span className="ag-status">{models?.dl==="not_deployed"?"No desplegado":models?.dl||"No disponible"}</span></div><p className="ag-disclaimer">No se proporcionan pronósticos ni recomendaciones sin entrenamiento y validación.</p></section> : null}
   {(section==="reports"||section==="settings") && <section className="ag-panel"><h2>{section==="reports"?"Reportes":"Configuración"}</h2><p className="ag-muted">{section==="reports"?"Los reportes se habilitarán cuando haya observaciones y evaluaciones guardadas.":"Configura tu cuenta y las credenciales necesarias desde Supabase y Render; no compartas secretos."}</p><button className="ag-action" onClick={()=>setSection("overview")}>Volver al panel</button></section>}
   {section==="parcels" ? <section className="ag-parcel-page">
     <div className="ag-panel-title"><div><h2><MapPin size={22}/> Mis parcelas</h2><p>Administra tus terrenos desde el mismo dashboard AGRONEX.</p></div><button className="ag-action" onClick={()=>setSection("overview")}>Volver al panel</button></div>
     <div className="ag-content">
       <article className="ag-panel"><h2>Acceso y registro</h2>{!getSupabase()?<p className="ag-disclaimer">Para activar las parcelas configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Render.</p>:!token?<div className="ag-controls"><label>Correo<input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}/></label><label>Contraseña<input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)}/></label><button className="ag-action" disabled={formBusy} onClick={signIn}>Iniciar sesión</button>{authError&&<p role="alert">{authError}</p>}</div>:<><p>Sesión: {email} <button className="ag-action" onClick={()=>getSupabase()?.auth.signOut()}>Cerrar sesión</button></p><div className="ag-controls"><label>Nombre de parcela<input value={parcelName} maxLength={120} onChange={e=>setParcelName(e.target.value)}/></label><label>Área (ha)<input type="number" min="0.001" step="any" value={parcelArea} onChange={e=>setParcelArea(e.target.value)}/></label><label>Latitud<input type="number" step="any" value={coords.latitude} onChange={e=>setCoords(v=>({...v,latitude:Number(e.target.value)}))}/></label><label>Longitud<input type="number" step="any" value={coords.longitude} onChange={e=>setCoords(v=>({...v,longitude:Number(e.target.value)}))}/></label></div><button className="ag-action" disabled={formBusy||!parcelName.trim()} onClick={saveParcel}>Registrar parcela</button></>}{parcelStatus&&<p role="status">{parcelStatus}</p>}</article>
       <article className="ag-panel"><h2>Parcelas registradas</h2>{parcels.length?parcels.map(p=><div className="ag-parcel" key={p.id}><MapPin size={20}/><div><b>{p.name}</b><small>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)} · {p.area_ha||"Área no indicada"} ha</small></div><button className="ag-action" onClick={()=>{setCoords(v=>({...v,latitude:p.latitude,longitude:p.longitude}));setSelectedParcelId(p.id);setSection("overview");}}>Ver en mapa</button></div>):<p className="ag-muted">No hay parcelas disponibles. Inicia sesión y registra un terreno.</p>}</article>
     </div></section> : section==="overview" ? <>
   <div className="ag-landscape-hero"><span>PLATAFORMA DE OBSERVACIÓN Y AGRICULTURA INTELIGENTE</span><strong>Del espacio a decisiones mejor informadas</strong><small>NASA POWER · NASA GIBS · NASA Earthdata</small></div>
   <section className="ag-stats">
    <article><div className="ag-stat-icon"><MapPin/></div><span>Parcelas registradas</span><strong>{parcels.length}</strong><small>{email?"Datos de tu cuenta":"Inicia sesión para consultar"}</small></article>
    <article><div className="ag-stat-icon"><Leaf/></div><span>Superficie registrada</span><strong>{totalArea.toFixed(1)} <em>ha</em></strong><small>Superficie declarada por los usuarios</small></article>
    <article><div className="ag-stat-icon blue"><CloudSun/></div><span>Temperatura media NASA</span><strong>{mean(data?.T2M)} <em>°C</em></strong><small>{weather?"Periodo consultado":"Sin consulta todavía"}</small></article>
    <article><div className="ag-stat-icon violet"><BrainCircuit/></div><span>Modelos analíticos</span><strong className="ag-stat-text">{models?.ml==="trained"?"ML disponible":"En preparación"}</strong><small>DL: {models?.dl==="not_deployed"?"sin desplegar":models?.dl||"sin conexión"}</small></article>
   </section>
   <section className="ag-content">
    <div className="ag-left">
     <article className="ag-panel ag-map">
      <div className="ag-panel-title"><div><h2><Satellite size={21}/> Visión satelital NASA</h2><p>Imágenes reales MODIS Terra mediante NASA GIBS</p></div><Link className="ag-action" href="/dashboard?section=satellite" onClick={()=>setSection("satellite")}>Explorar mapa <ArrowUpRight size={16}/></Link></div>
      <div className="ag-parcel-picker"><label htmlFor="ag-parcel-select">Parcela en el mapa</label><select id="ag-parcel-select" value={selectedParcelId} onChange={e=>{const id=e.target.value;setSelectedParcelId(id);const p=parcels.find(x=>x.id===id);if(p)setCoords(v=>({...v,latitude:p.latitude,longitude:p.longitude}));}}><option value="">Ubicación de referencia · Huánuco</option>{parcels.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><span>{parcels.length? "Selecciona una parcela para centrar el mapa":"Inicia sesión y registra una parcela para mostrar su ubicación"}</span></div>
      <SatelliteMap compact latitude={coords.latitude} longitude={coords.longitude} parcels={parcels} selectedParcelId={selectedParcelId}/>
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
     <article className="ag-panel"><div className="ag-panel-title"><div><h2><BarChart3 size={21}/> Mis parcelas</h2><p>Información guardada en Supabase</p></div><Link href="/manage" className="ag-link">Gestionar →</Link></div>{parcels.length?parcels.slice(0,5).map(p=><div className="ag-parcel" key={p.id} role="button" tabIndex={0} title="Ubicar parcela en mapa" onClick={()=>{setSelectedParcelId(p.id);setCoords(v=>({...v,latitude:p.latitude,longitude:p.longitude}));}} onKeyDown={e=>{if(e.key==="Enter"){setSelectedParcelId(p.id);setCoords(v=>({...v,latitude:p.latitude,longitude:p.longitude}));}}}><span><MapPin size={19}/></span><div><b>{p.name}</b><small>{p.area_ha? p.area_ha+" ha · ":""}{p.latitude.toFixed(3)}, {p.longitude.toFixed(3)}</small></div></div>):<p className="ag-muted">{email?"No hay parcelas registradas.":"Inicia sesión en Mis parcelas para ver tus terrenos."}</p>}</article>
     <article className="ag-panel ag-advice"><h2><ShieldCheck size={20}/> Fuentes verificables</h2><p>NASA POWER suministra estadísticas ambientales. GIBS muestra imágenes de la Tierra. HLS podrá aportar bandas para calcular índices de vegetación.</p><a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">Fuente NASA POWER <ExternalLink size={15}/></a></article>
    </div>
   </section>
   <ModelForecast weather={weather} parcels={parcels}/>
   <EarthdataCatalog latitude={coords.latitude} longitude={coords.longitude}/>
   <section className="ag-lower-grid">
     <article className="ag-panel"><div className="ag-panel-title"><div><h2><TrendingUp size={20}/> Condiciones climáticas NASA</h2><p>Resumen del periodo histórico consultado, no pronóstico</p></div><button className="ag-action" onClick={()=>setSection("climate")}>Explorar</button></div><ClimateChart temperature={weather?.data.T2M} rain={weather?.data.PRECTOTCORR}/><button className="ag-action" onClick={refresh} disabled={busy}>{busy?"Consultando NASA...":"Actualizar datos NASA"}</button>{error&&<p className="ag-alert" role="alert">{error}</p>}</article>
     <article className="ag-panel"><div className="ag-panel-title"><div><h2><Leaf size={20}/> Vegetación (NDVI)</h2><p>Procesamiento de imágenes HLS</p></div></div><div className="ag-feature-pending"><Leaf size={27}/><strong>Pendiente de datos HLS procesados</strong><span>No se mostrará un mapa NDVI ficticio.</span></div></article>
     <article className="ag-panel"><div className="ag-panel-title"><div><h2><ShieldCheck size={20}/> Recomendaciones</h2><p>Basadas en datos y reglas agronómicas validadas</p></div></div><div className="ag-feature-pending"><BrainCircuit size={27}/><strong>Motor agronómico en desarrollo</strong><span>Se habilitará después de validar los modelos y las reglas de cultivo.</span></div></article>
   </section>
   </> : null}
   <footer className="ag-footer">AGRONEX · Prototipo de investigación · Los datos de teledetección no sustituyen diagnósticos de campo.</footer>
  </div>
 </div>
}
