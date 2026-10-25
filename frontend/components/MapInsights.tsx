"use client";
import {useEffect,useState} from "react";
import {CloudRain,Sun,MapPin,RefreshCw,Leaf,CalendarDays} from "lucide-react";
import {getWeather,type Parcel,type Weather} from "../lib/api";
function values(input?:Record<string,number|null>){return Object.entries(input||{}).filter((v):v is [string,number]=>typeof v[1]==="number"&&Number.isFinite(v[1])&&v[1]>-900).sort((a,b)=>a[0].localeCompare(b[0])).slice(-7)}
export default function MapInsights({parcel,latitude,longitude}:{parcel:Parcel|null;latitude:number;longitude:number}){
 const [weather,setWeather]=useState<Weather|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{let canceled=false;setWeather(null);setError("");setLoading(true);
  const end=new Date();end.setUTCDate(end.getUTCDate()-8);const start=new Date(end);start.setUTCDate(end.getUTCDate()-40);
  getWeather(latitude,longitude,start.toISOString().slice(0,10),end.toISOString().slice(0,10))
   .then(x=>{if(!canceled)setWeather(x)}).catch(()=>{if(!canceled)setError("No fue posible consultar el clima de esta ubicación. Puedes volver a intentarlo.")})
   .finally(()=>{if(!canceled)setLoading(false)});
  return()=>{canceled=true};
 },[latitude,longitude,reload]);
 const rain=values(weather?.data.PRECTOTCORR),temp=values(weather?.data.T2M),solar=values(weather?.data.ALLSKY_SFC_SW_DWN);
 const rainfall=rain.length===7?rain.reduce((a,b)=>a+b[1],0):null;
 const temperature=temp.length===7?temp.reduce((a,b)=>a+b[1],0)/7:null;
 const sunlight=solar.length===7?solar.reduce((a,b)=>a+b[1],0)/7:null;
 const lastDate=rain.at(-1)?.[0]||"";
 return <section className="ag-map-insights" aria-live="polite">
 <div className="ag-map-insights-header"><div><h3><Leaf size={20}/> ¿Qué está pasando cerca de {parcel?.name||"esta ubicación"}?</h3><p>Lo que observaron los datos climáticos de NASA en los últimos siete días disponibles.</p></div><button className="ag-action" onClick={()=>setReload(v=>v+1)} disabled={loading}><RefreshCw size={15}/>{loading?"Consultando...":"Actualizar"}</button></div>
 {error&&<p role="alert" className="ag-alert">{error}</p>}
 <div className="ag-map-insights-grid">
 <article><CloudRain size={24}/><span>Lluvia reciente</span><strong>{rainfall===null?"Sin datos":rainfall.toFixed(1)+" mm"}</strong><p>{rainfall===null?"Estamos esperando los datos de NASA.":rainfall<5?"Ha llovido poco. Comprueba si la tierra está seca.":rainfall>60?"Ha llovido bastante. Revisa si se ha acumulado agua.":"Hubo algunas lluvias. Comprueba la humedad del terreno."}</p></article>
 <article><Sun size={24}/><span>Calor promedio</span><strong>{temperature===null?"Sin datos":temperature.toFixed(1)+" °C"}</strong><p>{temperature===null?"Sin observaciones disponibles.":"Comprueba cómo se encuentran las hojas y el suelo en tu cultivo."}</p></article>
 <article><Sun size={24}/><span>Energía del sol</span><strong>{sunlight===null?"Sin datos":sunlight.toFixed(1)+" kWh/m²/día"}</strong><p>{sunlight===null?"Sin observaciones disponibles.":"Radiación solar media diaria observada en la zona; no son horas de sol."}</p></article>
 </div>
 <p className="ag-map-insights-source"><CalendarDays size={15}/> {lastDate?"Último día observado: "+lastDate+". ":""}<MapPin size={15}/> Datos regionales de NASA POWER para las coordenadas seleccionadas; no son mediciones dentro de la parcela, imágenes NDVI ni pronósticos de mañana.</p>
 </section>
}
