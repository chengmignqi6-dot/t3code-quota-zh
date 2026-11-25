// Pure presentation adapter. No provider lookup, network, storage or inferred quota windows.
// Contract auth=unknown is not an explicit denial. Only reported usable windows can
// supply a balance; availability/unavailable notices and unauthenticated still block it.
export function createQuotaOverview({remainingPercent,formatShortWindowLabel,limitsNotice}){
 if([remainingPercent,formatShortWindowLabel,limitsNotice].some(f=>typeof f!=='function'))throw Error('Pinned quota dependencies are required');
 return function overview(providers,now){
  if(!Number.isFinite(now))throw Error('A finite display clock is required');
  return (Array.isArray(providers)?providers:[]).filter(e=>e?.enabled===true&&e.installed===true&&typeof e.instanceId==='string'&&e.instanceId.trim()).map(e=>{
   const limits=e.usageLimits??e.snapshot?.usageLimits,auth=e.auth??e.snapshot?.auth,blocked=e.isAvailable===false||e.availability==='unavailable'||e.snapshot?.availability==='unavailable'||['unavailable','error','disconnected','disabled'].includes(e.status)||auth?.status==='unauthenticated',notice=blocked?'Temporarily unavailable.':limits?limitsNotice({...limits,windows:Array.isArray(limits.windows)?limits.windows:[]}):'No limits reported.';
   const supplied=(Array.isArray(limits?.windows)?limits.windows:[]).filter(w=>w&&w.kind!=='custom_api'&&w.id!=='custom_api');
   const unavailable=blocked||Boolean(notice&&notice!=='No limits reported.');
   const windows=supplied.map((w,index)=>{
    const reset=w.resetsAt==null?null:Date.parse(w.resetsAt);let status=unavailable?'unavailable':!Number.isFinite(w.usedPercent)?'not-provided':reset!==null&&!Number.isFinite(reset)?'unavailable':reset!==null&&reset<=now?'refreshing':'available';
    const value=status==='available'?remainingPercent(w):null,remaining=Number.isFinite(value)?value:null;if(status==='available'&&remaining===null)status='not-provided';
    return{id:String(w.id??index),label:formatShortWindowLabel({...w,label:typeof w.label==='string'?w.label:'Quota'}),fullLabel:typeof w.label==='string'?w.label:'',remaining,resetsAt:Number.isFinite(reset)?reset:null,status,tone:remaining===null?'normal':remaining<=10?'critical':remaining<=20?'warning':'normal'};
   });
   return{id:e.instanceId,displayName:e.displayName?.trim()||String(e.snapshot?.driver??e.driverKind??'Account'),driver:e.snapshot?.driver??e.driver??e.driverKind??null,status:unavailable?'unavailable':windows.length?'available':'not-provided',notice:unavailable?(notice||'Temporarily unavailable.'):windows.length?null:'No limits reported.',windows};
  });
 };
}
