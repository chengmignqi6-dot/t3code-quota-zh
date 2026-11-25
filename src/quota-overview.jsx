// Quiet, account/window-first presentation. No animation, automatic refresh, routing or settings writes.
import{useEffect,useState}from'react';
import{remainingPercent,limitsNotice,formatDuration}from'@t3tools/shared/usageLimits';
import{formatShortWindowLabel}from'@source/metrics';
import{createQuotaOverview}from'./quota-overview-data.mjs';
const overview=createQuotaOverview({remainingPercent,limitsNotice,formatShortWindowLabel});
export function QuotaOverview({providers,now,locale='en',onOpenUsageLimits}){
 const rows=overview(providers,now);if(!rows.length)return null;
 const zh=locale.toLowerCase().startsWith('zh'),text=zh?{quota:'额度',remaining:'剩余',weekly:'周额度',five:'5小时',reset:'后重置',unknownReset:'重置时间未提供',missing:'未提供额度',unavailable:'暂不可用',refreshing:'等待刷新',all:'全部额度'}:{quota:'Quotas',remaining:'left',weekly:'Weekly',five:'5h',reset:'until reset',unknownReset:'Reset time not reported',missing:'Limits not reported',unavailable:'Temporarily unavailable',refreshing:'Awaiting refresh',all:'All limits'};
 function windowLabel(w){const cadence=w.label==='7d'?text.weekly:w.label==='5h'?text.five:w.label,raw=w.fullLabel;if(!raw||/^(?:weekly|week|5\s*(?:h|hours?))$/i.test(raw.trim()))return cadence;return raw===w.label?raw:`${raw} · ${cadence}`;}
 return <section className="t3q-overview" data-quota-overview aria-label={text.quota}>
  <div className="t3q-accounts">{rows.map(row=><section className="t3q-account" key={row.id} data-quota-account={row.id} aria-label={row.displayName}>
   <div className="t3q-account-name">{row.displayName}</div>
   {row.windows.length?<div className="t3q-windows">{row.windows.map(w=><div className="t3q-window" key={w.id} data-quota-window={w.id} data-status={w.status} data-tone={w.tone}>
    <div className="t3q-window-heading"><span className="t3q-window-label" title={w.fullLabel||w.label}>{windowLabel(w)}</span><span className="t3q-balance">{w.remaining===null?'—':`${w.remaining}%`}<span className="t3q-remaining"> {text.remaining}</span></span></div>
    <div className="t3q-meter" aria-hidden="true"><span style={{width:`${w.remaining??0}%`}}/></div>
    <span className="t3q-reset" title={w.resetsAt===null?undefined:new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(w.resetsAt)}>{w.status!=='available'?(w.status==='refreshing'?text.refreshing:w.status==='not-provided'?text.missing:text.unavailable):w.resetsAt===null?text.unknownReset:`${formatDuration(w.resetsAt-now)} ${text.reset}`}</span>
   </div>)}</div>:<span className="t3q-empty" title={row.notice??undefined}>{row.status==='unavailable'?text.unavailable:text.missing}</span>}
  </section>)}</div>
  {onOpenUsageLimits?<button type="button" className="t3q-all" onClick={onOpenUsageLimits}>{text.all}<span aria-hidden="true"> ↗</span></button>:null}
 </section>;
}
export function NativeQuotaOverview(props){
 const[now,setNow]=useState(Date.now);useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(id);},[]);
 const locale=typeof document!=='undefined'?(document.documentElement.lang||'en'):'en';
 return <QuotaOverview {...props} now={now} locale={locale}/>;
}
