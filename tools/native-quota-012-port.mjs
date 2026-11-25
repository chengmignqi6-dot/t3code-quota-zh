// 0.1.12 exact native view compatibility; all account/window math stays source-derived.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {selectPinnedFrontendTransform} from './probe-upstream.mjs';import {adaptNativeCurrencyFormatter} from './native-upstream-adapters.mjs';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
const parse=s=>ts.createSourceFile('native.js',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
export function portNativeQuotaAssets012({assetsDirectory}){
 const files=new Map(),report={nativeVersion:'0.1.12',transforms:[]};
 for(const [file,fun,stop,markers]of [
  ['runtime-CerGdK8c.js','patchUsageLimitsShared','if (out.includes("__t3LimSharedZh")) return out;',['splitAccount:','splitTotal:','poolKey:']],
  ['UsageLimits-DJoUW9my.js','patchUsageLimitsView','if (out.includes("__t3LimViewZh")) return out;',['t3-quota-sections','t3-quota-grid','__T3BurnBadge']],
  ['usageFormat-D1we3jzL.js','patchUsageFormatBundle','// 2. Malformed records notice',['__t3CnyFmt']]
 ]){
  const original=fs.readFileSync(path.join(assetsDirectory,file),'utf8');let code=selectPinnedFrontendTransform(fun,stop)(original);
  if(fun==='patchUsageFormatBundle'&&!code.includes('__t3CnyFmt'))code=adaptNativeCurrencyFormatter(code);
  if(fun==='patchUsageLimitsView'){
   const ast=parse(code),nodes=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Ve');if(nodes.length!==1)throw Error('0.1.12 PoolSection owner drift');const node=nodes[0],text=node.getText(ast);
   for(const a of ['{pool:n,now:r}','Ze(n.driver)','g.get(n.driver)','c=O(n),u=l()','(Be,{pool:e,color:a,now:r,label:t?.label,description:t?.description}'])if(!text.includes(a))throw Error('0.1.12 PoolSection drift: '+a);
   const replacement=`function Ve({pool:n,now:r}){
    const a=n.splitAccount?.accentColor||Ze(n.driver),base=g.get(n.driver)?.label??String(n.driver),s=n.splitAccount?(n.splitAccount.displayName||(n.splitTotal>1?base+" "+n.splitIndex:base)):base,c=O(n),u=l(),col1=Boolean(n.splitAccount)||c.length<=1;
    return(0,Q.jsxs)("section",{className:col1?"t3-quota-section t3-quota-col-1 flex flex-col gap-1.5":"t3-quota-section t3-quota-col-2 flex flex-col gap-1.5",children:[
     (0,Q.jsxs)("h2",{className:"flex items-center gap-2 text-sm font-medium text-foreground",children:[(0,Q.jsx)(ae,{driverKind:n.driver,displayName:s,accentColor:n.splitAccount?.accentColor,showBadge:Boolean(n.splitAccount?.accentColor),indicatorBackground:"var(--background)",className:"size-5",iconClassName:"size-4 text-foreground/80"}),s]}),
     (0,Q.jsx)("div",{className:col1?"t3-quota-grid-1 grid grid-cols-1 gap-2":"t3-quota-grid grid grid-cols-1 gap-2 md:grid-cols-2",children:c.map(e=>{const details=n.driver==="cursor"?ve(e.id,n,u):void 0;return(0,Q.jsx)(Be,{pool:e,color:a,now:r,label:details?.label,description:details?.description},e.kind+":"+e.id)})})]})
   }`;
   code=code.slice(0,node.getStart(ast))+replacement+code.slice(node.getEnd());
  }
  const syntax=parse(code).parseDiagnostics,missing=markers.filter(x=>!code.includes(x));if(syntax.length||missing.length||code.includes('__t3LimSharedZh')||code.includes('__t3LimViewZh'))throw Error('Incomplete 0.1.12 quota port: '+file+' '+missing.join(','));
  files.set(file,code);report.transforms.push({nativeBundle:file,function:fun,applicable:true,syntaxErrors:0,policy:'native locale, account details and actions preserved; no provider balance fabrication'});
 }
 return {files,report};
}
