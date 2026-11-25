// Narrow source-derived currency extension. Does not import/execute the upstream patcher or native app.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {selectDeclarations} from './select-source.mjs';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
const parse=(s,name='cost.js')=>ts.createSourceFile(name,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function oneReplace(text,before,after){if(text.split(before).length!==2)throw Error('Nonunique native/source anchor: '+before.slice(0,80));return text.replace(before,after);}
function evaluate(text,values={}){return new vm.Script('('+text+')').runInNewContext(values,{timeout:1000,contextCodeGeneration:{strings:false,wasm:false}});}
function pinnedCostSource(){
 const bytes=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs'),source=bytes.toString();
 if(crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!=='da89945cbd3cd023aebff23310fd4d27a39cbb1f')throw Error('Source pin mismatch');
 const nodes=parse(source).statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='patchChatUsageBundle');
 if(nodes.length!==1)throw Error('Upstream function missing');return nodes[0];
}
export function buildCostHelpers(){
 const node=pinnedCostSource(),footer=node.body.statements.flatMap(s=>ts.isVariableStatement(s)?[...s.declarationList.declarations]:[]).find(d=>d.name.getText()==='helperFooter');
 if(!footer||!ts.isTemplateExpression(footer.initializer))throw Error('Original helper footer missing');
 let helper=evaluate(footer.initializer.getText(),{reactNs:'Z',jsxNs:'$',toggleGroupIdent:'Ze',toggleItemIdent:'$e',currButtonExpr:'__currSeg'});
 // Delete precisely the rejected language/cache controls; preserve original currency JSX unchanged.
 const ast=parse(helper),toggle=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text==='__t3RenderToolbarToggles');
 const deletions=toggle.body.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>['__langTip','__langSeg','__cacheBtn'].includes(d.name.getText(ast))));
 if(deletions.length!==3)throw Error('Excluded UI control shape changed');
 for(const s of deletions.sort((a,b)=>b.pos-a.pos))helper=helper.slice(0,s.pos)+helper.slice(s.end);
 helper=oneReplace(helper,'const isZh=__t3UsageZh();','const isZh=false;');
 helper=oneReplace(helper,'children:[__currSeg,__langSeg,__cacheBtn]','children:[__currSeg]');
 const selected=selectDeclarations(helper,['__t3UsageCny','__t3UsageRate','__t3UseSavedBreakdown','__t3RenderToolbarToggles']);
 return selected.code.replace(/\nexport \{[^}]+\};\s*$/,'');
}
export function portNativeCost(original){
 if(original.includes('__T3UsageRootWrapper'))throw Error('Pristine input required');
 const upstream=pinnedCostSource().getText(),start=upstream.indexOf('// 2. Inject Currency'),end=upstream.indexOf('// 4. Chart Hover Tooltip:');
 if(start<0||end<=start)throw Error('Original transform boundary changed');
 const transform=evaluate('function(src){let out=src;'+upstream.slice(start,end)+'return out;}');
 let output=transform(original);
 for(const marker of ['__t3RenderToolbarToggles(!1)','__metric===\"cost\"','t3-usage-yaxis','t3-usage-xaxis'])if(!output.includes(marker))throw Error('Original transform missed: '+marker);
 // 0.1.11 hoists compact toolbar class to St, unlike upstream's inline literal.
 if(!output.includes('__t3RenderToolbarToggles(!0)')){
  const ast=parse(output),matches=[];
  function visit(n){if(ts.isObjectLiteralExpression(n)){
   const props=n.properties.filter(ts.isPropertyAssignment),cls=props.find(x=>x.name.getText(ast)==='className'),children=props.find(x=>x.name.getText(ast)==='children');
   if(cls?.initializer.getText(ast)==='St'&&children&&ts.isArrayLiteralExpression(children.initializer)&&children.initializer.elements.length===3)matches.push(children.initializer);
  }ts.forEachChild(n,visit);}visit(ast);
  if(matches.length!==1)throw Error('Compact toolbar anchor ambiguous');
  const arr=matches[0],last=arr.elements[2];output=output.slice(0,last.getStart(ast))+'__t3RenderToolbarToggles(!0),'+output.slice(last.getStart(ast));
 }
 output=oneReplace(output,'[b,x]=(0,Z.useState)(`model`)','[b,x]=__t3UseSavedBreakdown()');
 // Official 0.1.11 already persists selected environments/period/metric through its preferences atom.
 const footer='var Qr=kr;export{Qr as component};';
 const wrapper=`${buildCostHelpers()}
function __T3UsageRootWrapper(props){
 const [snap,setSnap]=(0,Z.useState)(()=>[__t3UsageCny(),__t3UsageRate()].join(":"));
 (0,Z.useEffect)(()=>globalThis.__t3QuotaUi?.subscribe(()=>setSnap([__t3UsageCny(),__t3UsageRate()].join(":"))),[]);
 return (0,$.jsx)(kr,{...props},snap);
}
var Qr=__T3UsageRootWrapper;export{Qr as component};`;
 output=oneReplace(output,footer,wrapper);
 const ast=parse(output);if(ast.parseDiagnostics.length)throw Error('Transformed cost syntax invalid');
 for(const token of ['setLang','__langSeg','__t3UsageZh','openCacheCleaner','__t3UseSavedEnvIds'])if(output.includes(token))throw Error('Excluded feature present: '+token);
 return output;
}
if(process.argv.includes('--probe')){
 const target='_chat.usage-Cuvca1lh.js',original=fs.readFileSync('work/pristine/apps/server/dist/client/assets/'+target,'utf8'),output=portNativeCost(original);
 fs.mkdirSync('work/source-port/probes',{recursive:true});fs.writeFileSync('work/source-port/probes/'+target,output);
 fs.writeFileSync('work/source-port/cost-port-report.json',JSON.stringify({status:'source-cost-probe-not-installable',nativeBundle:target,upstreamCommit:'bc64236511ee61dae9b75beef3ea0275eb71b2dd',sourceSections:['patchChatUsageBundle: 1706–1737 currency toolbar / chart scaling','patchChatUsageBundle: 2016–2082 original currency control and saved breakdown helpers'],adaptations:['0.1.11 compact compiler-hoisted St toolbar class','0.1.11 Ze/$e official ToggleGroup/Toggle item aliases','currency-only remount subscription; preserve official preferences and locale','remove custom language and cache-cleaner controls'],originalSha256:crypto.createHash('sha256').update(original).digest('hex'),outputSha256:crypto.createHash('sha256').update(output).digest('hex')},null,2));
 console.log('Original cost currency toolbar and CNY chart transform applied; no installation touched.');
}
