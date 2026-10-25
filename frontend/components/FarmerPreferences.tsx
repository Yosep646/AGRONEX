"use client";
import {useEffect,useState} from "react";
import type {Parcel,Weather} from "../lib/api";
type Preference={farmer:string;community:string;language:string;view:string;alerts:boolean;crop:string;soil:string;water:string;planted:string};
const defaults:Preference={farmer:"",community:"",language:"es",view:"simple",alerts:true,crop:"",soil:"desconocido",water:"desconocido",planted:""};
export function readPreference(id:string):Preference{try{return {...defaults,...JSON.parse(localStorage.getItem("agronex_preference_"+id)||"{}")}}catch{return defaults}}
export default function FarmerPreferences({parcel}:{parcel:Parcel|null}){
 const [form,setForm]=useState<Preference>(defaults);const [saved,setSaved]=useState(false);
 useEffect(()=>{setForm(readPreference(parcel?.id||"general"));setSaved(false)},[parcel?.id]);
 function edit(key:keyof Preference,value:string|boolean){setForm(s=>({...s,[key]:value}));setSaved(false)}
 function save(){localStorage.setItem("agronex_preference_"+(parcel?.id||"general"),JSON.stringify(form));setSaved(true);window.dispatchEvent(new Event("agronex:preferences"))}
 return <section className="ag-panel ag-farmer-preferences"><h2>Mis preferencias y datos del terreno</h2><p className="ag-muted">Estos datos ayudan a explicar mejor los resultados. En modo demostración solo se guardan en este navegador.</p><div className="ag-simple-form">
 <label>Mi nombre<input value={form.farmer} onChange={e=>edit("farmer",e.target.value)} placeholder="¿Cómo te llamas?"/></label>
 <label>Comunidad o distrito<input value={form.community} onChange={e=>edit("community",e.target.value)} placeholder="Ej. Pucallpa"/></label>
 <label>Tipo de explicación<select value={form.view} onChange={e=>edit("view",e.target.value)}><option value="simple">Fácil de entender</option><option value="technical">Mostrar también datos técnicos</option></select></label>
 <label>Idioma<select value={form.language} onChange={e=>edit("language",e.target.value)}><option value="es">Español</option></select></label>
 <label>¿Qué has sembrado?{parcel?<input value={form.crop} onChange={e=>edit("crop",e.target.value)} placeholder="Ej. maíz, arroz, cacao"/>:<input disabled placeholder="Selecciona una parcela para indicar el cultivo"/>}</label>
 <label>¿Cuándo sembraste?<input disabled={!parcel} type="date" value={form.planted} onChange={e=>edit("planted",e.target.value)}/></label>
 <label>Tipo de terreno<select disabled={!parcel} value={form.soil} onChange={e=>edit("soil",e.target.value)}><option value="desconocido">No lo sé</option><option value="arenoso">Arenoso</option><option value="arcilloso">Arcilloso</option><option value="franco">Mixto / franco</option></select></label>
 <label>¿De dónde viene el agua?<select disabled={!parcel} value={form.water} onChange={e=>edit("water",e.target.value)}><option value="desconocido">No indicado</option><option value="lluvia">Solo lluvia</option><option value="riego">Tengo riego</option><option value="mixto">Lluvia y riego</option></select></label></div>
 <label className="ag-check-setting"><input type="checkbox" checked={form.alerts} onChange={e=>edit("alerts",e.target.checked)}/> Mostrar avisos y recordatorios en el panel</label>
 <button className="ag-action" onClick={save}>Guardar mis preferencias</button>{saved&&<p role="status">Preferencias guardadas para {parcel?.name||"mi cuenta local"}.</p>}</section>
}
export function FriendlyClimate({weather,parcel}:{weather:Weather|null;parcel:Parcel|null}){
 const vals=(key:string)=>Object.entries(weather?.data[key]||{}).filter((v):v is [string,number]=>typeof v[1]==="number"&&v[1]>-900).sort((a,b)=>a[0].localeCompare(b[0])).slice(-7).map(x=>x[1]);
 const r=vals("PRECTOTCORR"),t=vals("T2M");const rain=r.length===7?r.reduce((a,b)=>a+b,0):null;const temp=t.length===7?t.reduce((a,b)=>a+b,0)/7:null;
 const pref=readPreference(parcel?.id||"general");
 return <section className="ag-panel ag-simple-climate"><h2>¿Cómo estuvo el clima en {parcel?.name||"esta zona"}?</h2>{rain===null||temp===null?<p>Para conocer el clima de este terreno, pulsa <b>Consultar NASA</b>. Te lo explicaremos con palabras sencillas.</p>:<div className="ag-friendly-results">
 <article><span>🌧️ Lluvia en los últimos 7 días</span><strong>{rain.toFixed(1)} mm</strong><p>{rain<5?"Ha llovido poco. Mira si la tierra está seca antes de decidir regar.":rain>60?"Ha llovido bastante. Revisa si hay charcos y si el terreno drena bien.":"Hubo algunas lluvias. Revisa con la mano si la tierra todavía guarda humedad."}</p></article>
 <article><span>🌡️ Calor en el terreno</span><strong>{temp.toFixed(1)} °C</strong><p>Es el calor promedio observado. Revisa cómo se ven las hojas de {pref.crop||"tu cultivo"}.</p></article>
 <article><span>🌱 ¿Qué conviene hacer?</span><strong>Revisar el suelo</strong><p>Antes de regar, toca la tierra y observa las plantas. Estos datos son de días pasados, no anuncian el clima de mañana.</p></article>
 </div>}{pref.view==="technical"&&<p className="ag-muted">Los datos vienen de NASA POWER. La cantidad de lluvia se expresa en milímetros (mm) y la temperatura en grados Celsius (°C).</p>}</section>
}
