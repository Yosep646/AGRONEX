"use client";
type Props={temperature?:Record<string,number|null>;rain?:Record<string,number|null>};
export default function ClimateChart({temperature,rain}:Props){
 const temp=temperature||{},precip=rain||{};
 const dates=Object.keys(temp).filter(k=>typeof temp[k]==="number"&&Number(temp[k])>-900&&typeof precip[k]==="number"&&Number(precip[k])>=0).sort().slice(-14);
 if(dates.length<2)return <div className="ag-feature-pending"><strong>Sin series climáticas cargadas</strong><span>Consulta NASA POWER para visualizar temperatura y lluvia observadas.</span></div>;
 const width=560,height=185,pad=25,innerW=width-2*pad,innerH=height-2*pad;
 const temps=dates.map(d=>Number(temperature![d]));const rains=dates.map(d=>Number(rain![d]));
 const lo=Math.min(...temps)-2,hi=Math.max(...temps)+2,rm=Math.max(1,...rains);
 const pts=(vals:number[],min:number,max:number)=>vals.map((v,i)=>[pad+(i/(vals.length-1))*innerW,pad+(1-(v-min)/(max-min))*innerH] as const);
 const ts=pts(temps,lo,hi),rs=pts(rains,0,rm);
 return <div className="ag-climate-chart"><svg role="img" aria-label="Temperatura y precipitación observadas por NASA POWER en los últimos catorce registros" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
  {[0,1,2,3].map(i=><line key={i} x1={pad} x2={width-pad} y1={pad+i*innerH/3} y2={pad+i*innerH/3} stroke="#e1eee5"/>)}
  <polyline fill="none" stroke="#f59b22" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={ts.map(p=>p.join(",")).join(" ")}/>
  <polyline fill="none" stroke="#3187e6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={rs.map(p=>p.join(",")).join(" ")}/>
  {ts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#f59b22"><title>{dates[i]}: {temps[i]} °C</title></circle>)}
  {rs.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#3187e6"><title>{dates[i]}: {rains[i]} mm</title></circle>)}
  <text x={pad} y={height-1} fontSize="10" fill="#748a79">{dates[0]}</text><text x={width-pad} y={height-1} textAnchor="end" fontSize="10" fill="#748a79">{dates[dates.length-1]}</text>
 </svg><div className="ag-chart-legend"><span><i className="ag-temp-line"/> Temperatura (°C)</span><span><i className="ag-rain-line"/> Precipitación (mm)</span></div><small>Escalas independientes; datos históricos, no pronósticos.</small></div>;
}
