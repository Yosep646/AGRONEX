"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {CalendarDays,Layers,ExternalLink,Satellite,MapPin} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

const LAYERS=[
 {id:"MODIS_Terra_CorrectedReflectance_TrueColor",label:"MODIS Terra · Color natural"},
 {id:"MODIS_Aqua_CorrectedReflectance_TrueColor",label:"MODIS Aqua · Color natural"}
] as const;
type ParcelPoint={id:string;name:string;latitude:number;longitude:number;area_ha:number|null};
type Props={latitude?:number;longitude?:number;compact?:boolean;parcels?:ParcelPoint[];selectedParcelId?:string};
export default function SatelliteMap({latitude=-9.93,longitude=-76.24,compact=false,parcels=[],selectedParcelId}:Props){
 const host=useRef<HTMLDivElement>(null);
 const parcelList=useRef(parcels);
 parcelList.current=parcels;
 const [date,setDate]=useState(()=>{const d=new Date();d.setUTCDate(d.getUTCDate()-5);return d.toISOString().slice(0,10)});
 const [layer,setLayer]=useState<string>(LAYERS[0].id);
 const [error,setError]=useState("");
 const [base,setBase]=useState<"nasa"|"street">("street");
 useEffect(()=>{
  let map:import("maplibre-gl").Map|undefined;
  let disposed=false;
  setError("");
  const load=async()=>{
   try{
    const gl=await import("maplibre-gl");
    if(disposed||!host.current)return;
    const url=`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
    const osm="https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    map=new gl.Map({container:host.current,center:[longitude,latitude],zoom:compact?11:12,maxZoom:18,
      style:{version:8,sources:{imagery:{type:"raster",tiles:[url],tileSize:256,maxzoom:9,
      attribution:"Imagery © NASA GIBS / MODIS"},streets:{type:"raster",tiles:[osm],tileSize:256,maxzoom:19,attribution:"© OpenStreetMap contributors"}},layers:[{id:"street-base",source:"streets",type:"raster",layout:{visibility:base==="street"?"visible":"none"}},{id:"nasa-imagery",source:"imagery",type:"raster",layout:{visibility:base==="nasa"?"visible":"none"}}]}});
    map.addControl(new gl.NavigationControl({showCompass:true}),"top-left");
    for(const parcel of parcelList.current){
      if(!Number.isFinite(parcel.latitude)||!Number.isFinite(parcel.longitude))continue;
      const marker=new gl.Marker({color:parcel.id===selectedParcelId?"#fbbf24":"#2ed276"})
        .setLngLat([parcel.longitude,parcel.latitude]);
      const popup=new gl.Popup({offset:22}).setText(parcel.name+(parcel.area_ha? " · "+parcel.area_ha+" ha":""));
      marker.setPopup(popup).addTo(map);
    }
    map.addControl(new gl.ScaleControl({maxWidth:120,unit:"metric"}),"bottom-left");
    map.on("error",event=>{const msg=event.error?.message||"";if(msg.includes("gibs.earthdata.nasa.gov")||msg.includes("AJAXError"))setError("NASA no entregó alguna imagen en esta fecha o escala. Cambia a Mapa de calles o prueba otra fecha.");else if(!msg.includes("AbortError"))setError("No se pudo cargar una parte del mapa. Prueba otra capa.");});
   }catch(e){setError(e instanceof Error?e.message:"Error de mapa")}
  };
  void load();
  return()=>{disposed=true;map?.remove()};
 },[date,layer,base,latitude,longitude,compact,selectedParcelId,parcels.length]);
 return <section className="ag-satellite-widget" aria-label="Visor de imágenes satelitales NASA">
  <div className="ag-sat-toolbar"><p className="ag-map-guidance">Para encontrar tu terreno, comienza con el mapa de caminos. Las imágenes NASA MODIS pueden tener nubes y no muestran detalles de parcelas pequeñas.</p>
   <label><Layers size={15}/> Tipo de mapa<select aria-label="Tipo de mapa" value={base} onChange={e=>{setBase(e.target.value as "nasa"|"street");setError("");}}><option value="nasa">Imagen NASA</option><option value="street">Calles y caminos (OpenStreetMap)</option></select></label>
   {base==="nasa"&&<label><CalendarDays size={15}/> Fecha de imagen<input aria-label="Fecha satelital" type="date" max={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)}/></label>}
   {base==="nasa"&&<label><Layers size={15}/> Capa<select aria-label="Capa satelital" value={layer} onChange={e=>setLayer(e.target.value)}>{LAYERS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>}
   <Link href="/satellite" className="ag-sat-expand" title="Abrir visor satelital completo"><ExternalLink size={17}/> <span>Ampliar</span></Link>
  </div>
  <div className="ag-sat-map">
   <div ref={host} className="ag-map-canvas"/>
   <div className="ag-map-watermark"><Satellite size={15}/> {base==="nasa"?"NASA GIBS · MODIS":"© OpenStreetMap"}</div>
   <div className="ag-map-coordinate"><MapPin size={14}/> {latitude.toFixed(3)}, {longitude.toFixed(3)}</div>
  </div>
  {error&&<div role="status" className="ag-alert">{error} <button type="button" onClick={()=>{setBase("street");setError("");}}>Abrir mapa de calles</button></div>}
  <div className="ag-map-bottom"><span>{base==="nasa"?"NASA MODIS · resolución aproximada 250 m; no es NDVI":"Calles y caminos · OpenStreetMap, no imágenes satelitales"}</span><span>{base==="nasa"?"Para terrenos pequeños usa el mapa de calles":"La ubicación es un punto; límites de parcela no digitalizados"}</span></div>
 </section>;
}
