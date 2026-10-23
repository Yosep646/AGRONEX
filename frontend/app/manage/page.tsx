"use client";
import { useEffect, useState } from "react";
import { Activity, BookOpen, ChevronRight, CloudSun, Database, Droplets, LayoutDashboard, Leaf, MapPin, Plus, RefreshCw, Satellite, ShieldCheck, Sprout, Waves, LogIn, LogOut } from "lucide-react";
import { addParcel, getParcels, getWeather, type Parcel, type Weather } from "../../lib/api";
import { getSupabase } from "../../lib/supabase";

type Tab = "overview" | "satellite" | "parcels" | "insights";
const nav: { id: Tab; label: string; icon: typeof Leaf }[] = [
  { id: "overview", label: "Panel general", icon: LayoutDashboard },
  { id: "satellite", label: "Datos NASA", icon: Satellite },
  { id: "parcels", label: "Mis parcelas", icon: Sprout },
  { id: "insights", label: "Análisis agrícola", icon: Activity },
];
const defaults = { latitude: "-9.93", longitude: "-76.24", start: "2025-01-01", end: "2025-01-31" };
function average(series?: Record<string, number | null>): string {
  const values = Object.values(series || {}).filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > -900);
  return values.length ? (values.reduce((a,b)=>a+b,0)/values.length).toFixed(1) : "—";
}
export default function Home() {
  const [tab,setTab] = useState<Tab>("overview");
  const [userEmail,setUserEmail] = useState("");
  const [token,setToken] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [authBusy,setAuthBusy] = useState(false);
  const [authMessage,setAuthMessage] = useState("");
  const [parcels,setParcels] = useState<Parcel[]>([]);
  const [parcelError,setParcelError] = useState("");
  const [parcelName,setParcelName] = useState("");
  const [area,setArea] = useState("");
  const [saving,setSaving] = useState(false);
  const [coords,setCoords] = useState(defaults);
  const [weather,setWeather] = useState<Weather | null>(null);
  const [loading,setLoading] = useState(false);
  const [weatherError,setWeatherError] = useState("");
  const supabaseReady = Boolean(getSupabase());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => {
      setToken(data.session?.access_token || "");
      setUserEmail(data.session?.user.email || "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || "");
      setUserEmail(session?.user.email || "");
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!token) { setParcels([]); return; }
    getParcels(token).then(setParcels).catch(e => setParcelError(e.message));
  }, [token]);
  async function login() {
    const sb = getSupabase();
    if (!sb) { setAuthMessage("Configura Supabase en .env.local"); return; }
    setAuthBusy(true); setAuthMessage("");
    const {error} = await sb.auth.signInWithPassword({email,password});
    setAuthBusy(false);
    setAuthMessage(error ? error.message : "Sesión iniciada");
    if (!error) setPassword("");
  }
  async function logout() { await getSupabase()?.auth.signOut(); }
  async function loadWeather() {
    setWeatherError("");setLoading(true);setWeather(null);
    try {
      const lat=Number(coords.latitude),lon=Number(coords.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Coordenadas inválidas");
      const data=await getWeather(lat,lon,coords.start,coords.end);
      setWeather(data);
    } catch(e){setWeatherError(e instanceof Error?e.message:"Error inesperado");}
    finally {setLoading(false);}
  }
  async function saveParcel() {
    setParcelError("");
    if (!token) return setParcelError("Inicia sesión antes de crear parcelas.");
    if (!parcelName.trim()) return setParcelError("Ingresa el nombre de la parcela.");
    setSaving(true);
    try {
      await addParcel(token,{name:parcelName.trim(),latitude:Number(coords.latitude),longitude:Number(coords.longitude),...(area?{area_ha:Number(area)}:{})});
      setParcels(await getParcels(token));setParcelName("");setArea("");
    } catch(e){setParcelError(e instanceof Error?e.message:"Error al guardar");}
    finally{setSaving(false);}
  }
  const parameter=weather?.data || {};
  const daily=Object.entries(parameter.PRECTOTCORR || {}).filter(([,v])=>v !== null && Number(v)>-900).slice(-31);
  const max=Math.max(1,...daily.map(([,v])=>Number(v)||0));
  const avgTemp=average(parameter.T2M);
  const avgRain=average(parameter.PRECTOTCORR);
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><Leaf size={29}/> AGRONEX</div>
      <div className="menu">{nav.map(item=><button type="button" key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}><item.icon size={18}/>{item.label}</button>)}</div>
      <div className="sidefoot">NASA SPACE APPS CHALLENGE 2026<br/>Prototipo técnico · Datos NASA POWER<br/>Sin recomendaciones agronómicas validadas.</div>
    </aside>
    <main className="main">
      <div className="top">
        <div><div className="eyebrow">Inteligencia para cultivar un futuro mejor</div><h1 className="h1">{tab==="overview"?"Centro de agricultura inteligente":tab==="satellite"?"Observación de la Tierra":tab==="parcels"?"Gestión de parcelas":"Análisis agrícola"}</h1><span className="muted">AGRONEX conecta datos científicos con planificación agrícola.</span></div>
        <span className="tag"><ShieldCheck size={15}/> {userEmail || "Modo exploración"}</span>
      </div>
      {tab==="overview" && <>
        <section className="hero"><div><div style={{fontSize:12,letterSpacing:2,fontWeight:800}}>PROYECTO AGRONEX · NASA 2026</div><h2>Del espacio al campo: decisiones con fundamento.</h2><p>Integramos observaciones de NASA, datos del suelo y análisis ambiental para construir herramientas de planificación sostenible de cultivos.</p><button className="btn" onClick={()=>setTab("satellite")}>Explorar datos NASA <ChevronRight size={17}/></button> <a href="/dashboard" style={{marginLeft:12,color:"#fff",fontWeight:700}}>Abrir dashboard profesional ↗</a> <a href="/satellite" style={{marginLeft:12,color:"white",fontWeight:700}}>Ver imágenes satelitales ↗</a></div><div className="heroicon">🌱</div></section>
        <div className="cards"><article className="card"><div className="cardtop">Parcelas registradas <div className="iconbox"><MapPin size={19}/></div></div><strong>{parcels.length}</strong><span className="muted">Parcelas asociadas a tu cuenta</span></article><article className="card"><div className="cardtop">NASA POWER <div className="iconbox"><Satellite size={19}/></div></div><strong>{weather?"Con datos":"Disponible"}</strong><span className="muted">Consulta de series ambientales</span></article><article className="card"><div className="cardtop">Modelos agrícolas <div className="iconbox"><Activity size={19}/></div></div><strong>En desarrollo</strong><span className="muted">ML y DL pendientes de validación</span></article></div>
        <div className="two"><section className="panel"><div className="sectionhead" style={{marginTop:0}}><h2>Capacidades del proyecto</h2></div><div className="mini"><span className="stat"><CloudSun size={19} color="#21895b"/> Datos meteorológicos NASA</span><b>API preparada</b></div><div className="mini"><span className="stat"><Database size={19} color="#21895b"/> Parcelas en Supabase</span><b>Requiere configuración</b></div><div className="mini"><span className="stat"><Waves size={19} color="#21895b"/> Análisis de vegetación HLS</span><b>Próxima fase</b></div><div className="mini"><span className="stat"><BookOpen size={19} color="#21895b"/> Reglas de rotación</span><b>Por validar</b></div></section><section className="panel"><h2>Propósito</h2><p style={{lineHeight:1.8,color:"#627b6a"}}>AGRONEX aborda la fragmentación de información climática y agronómica. Su objetivo es ayudar a evaluar alternativas de rotación, considerando incertidumbre, suelo y disponibilidad de agua.</p><div className="notice">Los indicadores ambientales no sustituyen diagnósticos en campo ni asesoría agronómica.</div></section></div>
      </>}
      {tab==="satellite" && <div className="two"><section className="panel"><h2>Consultar NASA POWER</h2><p className="muted">Temperatura, precipitación y radiación diaria para una ubicación y un intervalo histórico.</p><div className="fields">{([["latitude","Latitud"],["longitude","Longitud"],["start","Desde"],["end","Hasta"]] as const).map(([key,label])=><label className="field" key={key}>{label}<input type={key==="start"||key==="end"?"date":"number"} step="any" value={coords[key]} onChange={e=>setCoords(prev=>({...prev,[key]:e.target.value}))}/></label>)}</div><button className="btn" disabled={loading} onClick={loadWeather}><RefreshCw size={16}/>{loading?"Consultando NASA...":"Obtener datos reales"}</button>{weatherError&&<div className="notice error" role="alert">{weatherError}</div>}{weather&&<div className="notice">Datos recibidos correctamente de {weather.source}. Comprueba las unidades y la representatividad espacial antes de interpretarlos.</div>}</section><section className="panel"><h2>Resumen ambiental</h2><p className="muted">Solo se calculan valores al consultar NASA POWER.</p><div className="mini"><span className="stat"><CloudSun size={17}/> Temperatura promedio</span><b>{avgTemp} {weather?"°C":""}</b></div><div className="mini"><span className="stat"><Droplets size={17}/> Precipitación diaria promedio</span><b>{avgRain} {weather?"mm/día":""}</b></div><div className="mini"><span>Radiación promedio</span><b>{average(parameter.ALLSKY_SFC_SW_DWN)} {weather?"kWh/m²/día":""}</b></div><div className="sectionhead"><h2>Precipitación diaria</h2></div>{daily.length>0?<><div className="chart" aria-label="Barras de precipitación diaria">{daily.map(([date,value])=><div className="bar" key={date} title={`${date}: ${value} mm`} style={{height:`${Math.max(2,(Number(value)||0)/max*100)}%`}}/>)}</div><p className="muted">{daily.length} días mostrados · valores obtenidos de NASA POWER</p></>:<div className="empty">Consulta una ubicación para ver los datos.</div>}</section></div>}
      {tab==="parcels" && <div className="two"><section className="panel"><h2>Registrar parcela</h2><p className="muted">La información se almacena en Supabase bajo la cuenta autenticada.</p>{!supabaseReady?<div className="notice">Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para activar la autenticación.</div>:!token?<div className="login"><div className="fields"><label className="field">Correo<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="field">Contraseña<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label></div><button className="btn" disabled={authBusy} onClick={login}><LogIn size={16}/> Iniciar sesión</button>{authMessage&&<div className="notice">{authMessage}</div>}<p className="muted">Crea tu cuenta desde Supabase Auth si aún no existe. No se almacenan contraseñas en AGRONEX.</p></div>:<><div className="formrow"><span className="tag">{userEmail}</span><button className="btn secondary" onClick={logout}><LogOut size={15}/> Cerrar sesión</button></div><div className="fields"><label className="field">Nombre de parcela<input value={parcelName} maxLength={120} onChange={e=>setParcelName(e.target.value)} placeholder="Ej. Parcela Norte"/></label><label className="field">Área (hectáreas, opcional)<input type="number" min="0.001" step="any" value={area} onChange={e=>setArea(e.target.value)}/></label><label className="field">Latitud<input type="number" step="any" value={coords.latitude} onChange={e=>setCoords(p=>({...p,latitude:e.target.value}))}/></label><label className="field">Longitud<input type="number" step="any" value={coords.longitude} onChange={e=>setCoords(p=>({...p,longitude:e.target.value}))}/></label></div><button className="btn" disabled={saving} onClick={saveParcel}><Plus size={16}/>{saving?"Guardando...":"Guardar parcela"}</button></>}{parcelError&&<div className="notice error" role="alert">{parcelError}</div>}</section><section className="panel"><h2>Mis parcelas</h2>{!token?<div className="empty">Inicia sesión para ver tus parcelas.</div>:parcels.length===0?<div className="empty">Aún no hay parcelas o no se ha establecido conexión con Supabase.</div>:<div className="list">{parcels.map(p=><div className="parcel" key={p.id}><div className="iconbox"><MapPin size={18}/></div><div><b>{p.name}</b><small>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)} {p.area_ha?`· ${p.area_ha} ha`:""}</small></div></div>)}</div>}</section></div>}
      {tab==="insights" && <div className="two"><section className="panel"><h2>Motor de análisis agrícola</h2><p style={{lineHeight:1.8,color:"#607d6c"}}>La evaluación de rotación integrará datos climáticos de NASA con características del suelo, historial agrícola y restricciones documentadas de cada cultivo.</p><div className="mini"><span>Machine Learning</span><b>Entrenamiento separado</b></div><div className="mini"><span>Deep Learning</span><b>Pendiente</b></div><div className="mini"><span>Motor agronómico</span><b>Pendiente</b></div><div className="notice">No se muestran recomendaciones inventadas: las futuras evaluaciones requerirán modelos medidos y reglas revisadas por especialistas.</div></section><section className="panel"><h2>Próximos pasos técnicos</h2><div className="mini"><span>1. HLS y GIBS</span><b>Imágenes satelitales</b></div><div className="mini"><span>2. Series históricas</span><b>Almacenamiento</b></div><div className="mini"><span>3. Modelos ML/DL</span><b>Validación</b></div><div className="mini"><span>4. Rotaciones</span><b>Reglas agronómicas</b></div></section></div>}
      <footer className="footer">AGRONEX · NASA Space Apps Challenge 2026 · Prototipo preparatorio, no producto agrícola validado.</footer>
    </main>
  </div>;
}
