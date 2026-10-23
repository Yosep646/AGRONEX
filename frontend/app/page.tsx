"use client";
import { useState } from "react";
export default function Home() {
 const [lat, setLat] = useState("-9.93"); const [lon, setLon] = useState("-76.24");
 const [data, setData] = useState<Record<string, Record<string, number>> | null>(null);
 const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
 async function load() {
  setLoading(true); setError(""); setData(null);
  try {
   const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
   const params = new URLSearchParams({latitude:lat,longitude:lon,start:"2025-01-01",end:"2025-01-31"});
   const response = await fetch(`${api}/api/environment/power?${params}`);
   if (!response.ok) throw new Error("No se pudo obtener información de NASA POWER");
   const payload = await response.json(); setData(payload.data);
  } catch(e){ setError(e instanceof Error ? e.message : "Error de conexión");}
  finally {setLoading(false);}
 }
 return <main style={{maxWidth:920,margin:"auto",padding:"50px 24px"}}>
  <p style={{color:"#19805c",fontWeight:700}}>NASA SPACE APPS · PROTOTIPO PREPARATORIO</p>
  <h1 style={{fontSize:54,marginBottom:8}}>AGRONEX</h1>
  <p style={{fontSize:20}}>Datos ambientales de NASA para planificar una agricultura más sostenible.</p>
  <section style={{background:"white",borderRadius:16,padding:24,marginTop:36}}>
   <h2>Consulta meteorológica histórica</h2>
   <p>Coordenadas de referencia editables; muestra datos reales cuando el backend NASA POWER responde.</p>
   <label>Latitud <input aria-label="Latitud" type="number" step="any" value={lat} onChange={e=>setLat(e.target.value)}/></label>{" "}
   <label>Longitud <input aria-label="Longitud" type="number" step="any" value={lon} onChange={e=>setLon(e.target.value)}/></label>{" "}
   <button onClick={load} disabled={loading} style={{padding:"10px 16px",background:"#176c4d",color:"white",border:0,borderRadius:8}}>{loading?"Consultando...":"Consultar NASA POWER"}</button>
   {error && <p role="alert" style={{color:"darkred"}}>{error}</p>}
   {data && <div><h3>Variables recibidas</h3>{Object.entries(data).map(([name,series])=><p key={name}><strong>{name}</strong>: {Object.keys(series).length} registros</p>)}</div>}
  </section>
  <p style={{marginTop:28,fontSize:13,color:"#52675e"}}>La integración con Supabase, el entrenamiento ML y las rotaciones están en fase de preparación; no se presentan recomendaciones agrícolas no validadas.</p>
 </main>;
}
