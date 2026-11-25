// Exact 0.1.12 native usage-page anchors; currency helpers remain pinned upstream source.
import vm from 'node:vm';import {pinnedCostSource,buildCostHelpers} from './source-cost-port.mjs';
function once(code,a,b){if(code.split(a).length!==2)throw Error('0.1.12 cost anchor drift: '+a);return code.replace(a,b);}
export function portNativeCost012(original){
 const source=pinnedCostSource().getText(),start=source.indexOf('// 2. Inject Currency'),end=source.indexOf('// 4. Chart Hover Tooltip:');if(start<0||end<=start)throw Error('Pinned currency boundaries changed');
 const transform=vm.runInNewContext('(src=>{let out=src;'+source.slice(start,end)+'return out})',Object.create(null),{timeout:1000,contextCodeGeneration:{strings:false,wasm:false}});let code=transform(original);
 for(const marker of ['__t3RenderToolbarToggles(!1)','__metric==="cost"','t3-usage-yaxis','t3-usage-xaxis'])if(!code.includes(marker))throw Error('0.1.12 native cost transform missing: '+marker);
 const cls='Ct=`ms-auto flex shrink-0 items-center justify-end gap-1 @4xl/usage-header:hidden`';code=once(code,cls,'Ct=`ms-auto flex shrink-0 flex-wrap items-center justify-end gap-1 @4xl/usage-header:hidden`');
 if(code.includes('className:Ct,children:['))code=once(code,'className:Ct,children:[','className:Ct,children:[__t3RenderToolbarToggles(!0),');else throw Error('0.1.12 compact toolbar missing');
 code=once(code,'[y,b]=(0,Z.useState)(`model`)','[y,b]=__t3UseSavedBreakdown()');
 code=once(code,'var Zr=Or;export{Zr as component};',`function __T3CostCurrencyBoundary(){const [revision,rerender]=Z.useState(0);Z.useEffect(()=>{const api=globalThis.__t3QuotaUi;if(!api)return;let c=api.isCny(),r=api.getRate();return api.subscribe(()=>{const nc=api.isCny(),nr=api.getRate();if(nc!==c||nr!==r){c=nc;r=nr;rerender(v=>v+1)}})},[]);return(0,$.jsx)(Or,{},revision)}var Zr=__T3CostCurrencyBoundary;export{Zr as component};`);
 return code+'\n'+buildCostHelpers({toggleGroupIdent:'Ve',toggleItemIdent:'Be'});
}
