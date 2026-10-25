import {API_URL,getWeather,type Parcel} from "./api";
export type ParcelAnalysis={id:string;parcelId:string;parcelName:string;createdAt:string;observedThrough:string;status:"estimated"|"observed_only";predictedRainMm:number|null;observedRainMm:number|null;temperatureC:number|null;message:string};
const KEY="agronex_parcel_analysis_v1";
export function readLocalAnalysis():ParcelAnalysis[]{try{const data=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(data)?data:[]}catch{return []}}
function saveLocalAnalysis(item:ParcelAnalysis){const list=readLocalAnalysis().filter(x=>x.parcelId!==item.parcelId);localStorage.setItem(KEY,JSON.stringify([item,...list].slice(0,80)));window.dispatchEvent(new Event("agronex:analysis"));}
function iso(d:Date){return d.toISOString().slice(0,10)}
function mean(v:number[]){return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
export async function analyzeNewParcel(parcel:Parcel,token?:string):Promise<ParcelAnalysis>{
 const end=new Date();end.setUTCDate(end.getUTCDate()-8);
 const start=new Date(end);start.setUTCDate(end.getUTCDate()-44);
 const weather=await getWeather(parcel.latitude,parcel.longitude,iso(start),iso(end));
 const series=weather.data;
 const days=Object.keys(series.T2M||{}).sort().filter(d=>["T2M","PRECTOTCORR","ALLSKY_SFC_SW_DWN"].every(k=>typeof series[k]?.[d]==="number"&&Number(series[k][d])>-900));
 if(days.length<7)throw new Error("NASA no devolvió suficientes observaciones para analizar esta parcela.");
 const last=days.slice(-7);
 const temps=last.map(d=>Number(series.T2M[d])),rain=last.map(d=>Number(series.PRECTOTCORR[d])),solar=last.map(d=>Number(series.ALLSKY_SFC_SW_DWN[d]));
 const target=new Date(last[6]+"T12:00:00Z");target.setUTCDate(target.getUTCDate()+1);
 const dayOfYear=Math.floor((target.getTime()-Date.UTC(target.getUTCFullYear(),0,0))/86400000);
 const payload={temperature_c:temps,precipitation_mm:rain,radiation_kwh_m2:solar,day_of_year:dayOfYear};
 let prediction:number|null=null;
 let message="Observaciones NASA disponibles. La predicción automática aún no está habilitada; consulta las condiciones en campo.";
 try{
  const response=await fetch(API_URL+(token&&!parcel.id.startsWith("local-")?"/api/analysis":"/api/models/rainfall/forecast"),{method:"POST",headers:{"Content-Type":"application/json",...(token&&!parcel.id.startsWith("local-")?{Authorization:"Bearer "+token}:{})},body:JSON.stringify(token&&!parcel.id.startsWith("local-")?{parcel_id:parcel.id,model:"random_forest",period_end:last[6],weather:payload}:payload)});
  if(response.ok){const result=await response.json();prediction=Number((result.prediction||result).predicted_precipitation_mm);if(!Number.isFinite(prediction))prediction=null;}
  else{const err=await response.json().catch(()=>({}));message=typeof err.detail==="string"?err.detail:"Predicción no disponible; se conservan las observaciones NASA.";}
 }catch{message="No se pudo consultar la predicción; se conservan las observaciones NASA.";}
 if(prediction!==null)message="Estimación experimental de lluvia para el día posterior a la última observación. No sustituye un pronóstico meteorológico ni indica cuánto regar.";
 const item:ParcelAnalysis={id:"analysis-"+Date.now(),parcelId:parcel.id,parcelName:parcel.name,createdAt:new Date().toISOString(),observedThrough:last[6],status:prediction===null?"observed_only":"estimated",predictedRainMm:prediction,observedRainMm:mean(rain),temperatureC:mean(temps),message};
 saveLocalAnalysis(item);
 return item;
}
