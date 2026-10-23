"use client";
import {useState} from "react";
export default function SatellitePage(){
 const [date,setDate]=useState("2025-01-15");
 const capabilities="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities";
 return <main style={{fontFamily:"Arial,sans-serif",maxWidth:900,margin:"40px auto",padding:20}}>
  <a href="/">← AGRONEX</a><h1>Observación satelital NASA</h1>
  <p>Primer módulo de integración con NASA GIBS. Las capas disponibles se consultan mediante WMTS.</p>
  <label>Fecha de referencia <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
  <p>Fecha seleccionada: {date}</p>
  <p><a href={capabilities} target="_blank" rel="noreferrer">Consultar catálogo oficial de capas GIBS</a></p>
  <p>Próximo paso: renderizar las teselas WMTS en MapLibre y vincular selección geográfica con el catálogo HLS.</p>
 </main>;
}
