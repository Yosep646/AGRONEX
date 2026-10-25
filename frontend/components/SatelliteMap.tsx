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
 const [drawing,setDrawing]=useState(false);
 const [vertices,setVertices]=useState<number[][]>([]);
 const [outline,setOutline]=useState<number[][]>([]);
 const [compare,setCompare]=useState(false);
 const [previousDate,setPreviousDate]=useState("2025-01-15");
 const [blend,setBlend]=useState(50);
 const key="agronex_boundary_"+(selectedParcelId||"reference");
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(key)||"[]");setOutline(Array.isArray(stored)?stored:[])}catch{setOutline([])}setVertices([]);setDrawing(false)},[key]);
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
    const older=`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${previousDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
    map=new gl.Map({container:host.current,center:[longitude,latitude],zoom:compact?11:12,maxZoom:18,
      style:{version:8,sources:{imagery:{type:"raster",tiles:[url],tileSize:256,maxzoom:9,
      attribution:"Imagery © NASA GIBS / MODIS"},older:{type:"raster",tiles:[older],tileSize:256,maxzoom:9},streets:{type:"raster",tiles:[osm],tileSize:256,maxzoom:19,attribution:"© OpenStreetMap contributors"}},layers:[{id:"street-base",source:"streets",type:"raster",layout:{visibility:base==="street"?"visible":"none"}},{id:"nasa-imagery",source:"imagery",type:"raster",layout:{visibility:base==="nasa"?"visible":"none"}},{id:"nasa-previous",source:"older",type:"raster",layout:{visibility:base==="nasa"&&compare?"visible":"none"},paint:{"raster-opacity":compare?blend/100:0}}]}});
    map.on("load",()=>{
      const path=vertices.length?vertices:outline;
      const polygon=path.length>=3?{type:"FeatureCollection" as const,features:[{type:"Feature" as const,properties:{},geometry:{type:"Polygon" as const,coordinates:[[...path,path[0]]]}}]}:{type:"FeatureCollection" as const,features:[]};
      map?.addSource("ag-boundary",{type:"geojson",data:polygon as import("geojson").FeatureCollection});
      map?.addLayer({id:"ag-boundary-fill",type:"fill",source:"ag-boundary",paint:{"fill-color":"#30c96b","fill-opacity":0.2}});
      map?.addLayer({id:"ag-boundary-outline",type:"line",source:"ag-boundary",paint:{"line-color":"#24a75b","line-width":3}});
    });
    if(drawing){map.getCanvas().style.cursor="crosshair";map.on("click",e=>setVertices(v=>[...v,[e.lngLat.lng,e.lngLat.lat]]));}
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
 },[date,layer,base,latitude,longitude,compact,selectedParcelId,parcels.length,vertices,drawing,outline,compare,previousDate,blend]);
 return <section className="ag-satellite-widget" aria-label="Visor de imágenes satelitales NASA">
  <div className="ag-sat-toolbar">
   <label><Layers size={15}/> Tipo de mapa<select aria-label="Tipo de mapa" value={base} onChange={e=>{setBase(e.target.value as "nasa"|"street");setError("");}}><option value="nasa">Imagen NASA</option><option value="street">Calles y caminos (OpenStreetMap)</option></select></label>
   {base==="nasa"&&<label><CalendarDays size={15}/> Fecha de imagen<input aria-label="Fecha satelital" type="date" max={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)}/></label>}
   {base==="nasa"&&<label><Layers size={15}/> Capa<select aria-label="Capa satelital" value={layer} onChange={e=>setLayer(e.target.value)}>{LAYERS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>}
   {base==="nasa"&&<button type="button" className="ag-action" onClick={()=>setCompare(v=>!v)}>{compare?"Cerrar comparación":"Comparar dos fechas"}</button>}
   {base==="nasa"&&compare&&<label>Fecha anterior<input type="date" value={previousDate} onChange={e=>setPreviousDate(e.target.value)}/></label>}
   {base==="nasa"&&compare&&<label>Mostrar fecha anterior: {blend}%<input type="range" min="0" max="100" value={blend} onChange={e=>setBlend(Number(e.target.value))}/></label>}
   {selectedParcelId&&<button type="button" className="ag-action" onClick={()=>{setDrawing(v=>!v);setVertices([])}}>{drawing?"Cancelar dibujo":"Dibujar límites"}</button>}
   {drawing&&<button type="button" className="ag-action" disabled={vertices.length<3} onClick={()=>{localStorage.setItem(key,JSON.stringify(vertices));setOutline(vertices);setDrawing(false);setVertices([])}}>Guardar contorno ({vertices.length} puntos)</button>}
   {selectedParcelId&&outline.length>=3&&!drawing&&<button type="button" className="ag-action" onClick={()=>{localStorage.removeItem(key);setOutline([])}}>Borrar contorno</button>}
   <Link href="/satellite" className="ag-sat-expand" title="Abrir visor satelital completo"><ExternalLink size={17}/> <span>Ampliar</span></Link>
  </div>
  <div className="ag-sat-map">
   <div ref={host} className="ag-map-canvas"/>
   <div className="ag-map-watermark"><Satellite size={15}/> {base==="nasa"?"NASA GIBS · MODIS":"© OpenStreetMap"}</div>
   <div className="ag-map-coordinate"><MapPin size={14}/> {latitude.toFixed(3)}, {longitude.toFixed(3)}</div>
  </div>
  {error&&<div role="status" className="ag-alert">{error} <button type="button" onClick={()=>{setBase("street");setError("");}}>Abrir mapa de calles</button></div>}
  <div className="ag-map-bottom"><span>{base==="nasa"?"NASA MODIS · resolución aproximada 250 m; no es NDVI":"Calles y caminos · OpenStreetMap, no imágenes satelitales"}</span><span>{base==="nasa"?"Para terrenos pequeños usa el mapa de calles":"Dibuja los límites de tu parcela en este mapa"}</span></div>
 </section>;
}
