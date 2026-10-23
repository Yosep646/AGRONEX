"use client";
import {useEffect,useRef,useState} from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export default function SatellitePage(){
 const host=useRef<HTMLDivElement>(null);
 const [date,setDate]=useState("2025-01-15");
 const [error,setError]=useState("");
 useEffect(()=>{
   if(!host.current)return;
   let map:import("maplibre-gl").Map|undefined;
   let cancelled=false;
   (async()=>{
     try{
       const module=await import("maplibre-gl");
       if(cancelled||!host.current)return;
       const tiles=`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
       map=new module.Map({container:host.current,center:[-76.24,-9.93],zoom:6,maxZoom:9,
         style:{version:8,sources:{nasa:{type:"raster",tileSize:256,tiles:[tiles],
         attribution:"NASA GIBS / MODIS"}},layers:[{id:"nasa",type:"raster",source:"nasa"}]}});
       map.addControl(new module.NavigationControl(),"top-right");
       map.on("error",e=>setError(e.error?.message || "No se pudo cargar una tesela NASA"));
     }catch(e){setError(e instanceof Error?e.message:"Error creando el mapa")}
   })();
   return()=>{cancelled=true;map?.remove()};
 },[date]);
 return <main style={{fontFamily:"Arial,sans-serif",maxWidth:1080,margin:"30px auto",padding:20}}>
   <a href="/">← Panel AGRONEX</a><h1>Visión satelital NASA</h1>
   <p>Mapa NASA GIBS con imágenes MODIS Terra en color natural. Consulta la disponibilidad según la fecha y la región.</p>
   <label>Fecha: <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <div ref={host} style={{height:510,marginTop:20,borderRadius:16,overflow:"hidden",background:"#dbe8dd"}} aria-label="Mapa de imágenes satelitales NASA"/>
   {error&&<p role="alert" style={{color:"#9e331d"}}>{error}</p>}
   <p style={{fontSize:13,color:"#667c70"}}>Fuente: NASA GIBS. Los píxeles MODIS no sustituyen mediciones de parcelas pequeñas. El análisis de vegetación HLS requiere un procesamiento distinto.</p>
 </main>;
}
