// Narrow 0.1.11 compatibility adaptations. Layout/classes are copied from the pinned upstream,
// patch-asar.mjs:1485. This replaces only PoolSection, not native account details/cards/actions.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
function replaceFunction(source,name,expected,replacement){
 const ast=ts.createSourceFile('native.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const nodes=ast.statements.filter(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name);
 if(nodes.length!==1)throw Error('Native compatibility function missing/ambiguous: '+name);
 const node=nodes[0],text=node.getText(ast);
 for(const marker of expected)if(!text.includes(marker))throw Error('Native compatibility gate failed: '+name+' / '+marker);
 return source.slice(0,node.getStart(ast))+replacement+source.slice(node.getEnd());
}
export function adaptNativePoolSection(source){
 return replaceFunction(source,'ze',['{pool:n,now:r}','Ye(n.driver)','d.get(n.driver)','l=z(n),u=c()','(Le,{pool:e,color:a,now:r,label:t?.label,description:t?.description}'],`function ze({pool:n,now:r}){
 const a=n.splitAccount?.accentColor||Ye(n.driver);
 const base=d.get(n.driver)?.label??String(n.driver);
 const s=n.splitAccount?(n.splitAccount.displayName||(n.splitTotal>1?base+" "+n.splitIndex:base)):base;
 const l=z(n),u=c(),col1=Boolean(n.splitAccount)||l.length<=1;
 return(0,Q.jsxs)("section",{className:col1?"t3-quota-section t3-quota-col-1 flex flex-col gap-1.5":"t3-quota-section t3-quota-col-2 flex flex-col gap-1.5",children:[
  (0,Q.jsxs)("h2",{className:"flex items-center gap-2 text-sm font-medium text-foreground",children:[
   (0,Q.jsx)(ce,{driverKind:n.driver,displayName:s,accentColor:n.splitAccount?.accentColor,showBadge:Boolean(n.splitAccount?.accentColor),indicatorBackground:"var(--background)",className:"size-5",iconClassName:"size-4 text-foreground/80"}),s]}),
  (0,Q.jsx)("div",{className:col1?"t3-quota-grid-1 grid grid-cols-1 gap-2":"t3-quota-grid grid grid-cols-1 gap-2 md:grid-cols-2",children:l.map(e=>{const details=n.driver==="cursor"?he(e.id,n,u):void 0;return(0,Q.jsx)(Le,{pool:e,color:a,now:r,label:details?.label,description:details?.description},e.kind+":"+e.id)})})]})
}`);
}
export function adaptNativeCurrencyFormatter(source){
 // Upstream: patch-asar.mjs:1282–1289. 0.1.11 adds locale argument t;
 // retain official USD locale, preserve raw USD before FX, and show invalid values as unavailable.
 return replaceFunction(source,'c',['function c(e,t){return a(r(t),!0).format(e)}'],`var __t3CnyFmt=new Intl.NumberFormat("zh-CN",{style:"currency",currency:"CNY",minimumFractionDigits:2,maximumFractionDigits:2});
function c(e,t){if(!Number.isFinite(e))return "—";const api=globalThis.__t3QuotaUi;return api?.isCny?.()?__t3CnyFmt.format(e*(api.getRate?.()??7.25)):a(r(t),!0).format(e)}`);
}
