// Exact 0.1.12 / ca81b7b97a1c frontend bindings. Never execute the upstream patcher.
import {createRequire} from 'node:module';
import {readOriginalFunctionTemplate,excludeCustomLanguage} from './source-template-port.mjs';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
const parse=s=>ts.createSourceFile('native.js',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function once(s,a,b){if(s.split(a).length!==2)throw Error('0.1.12 anchor drift: '+a.slice(0,90));return s.replace(a,b);}
export function adaptComposer012(source){
 const sf=parse(source),owner=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='eK');if(!owner)throw Error('0.1.12 composer owner drift');
 for(const a of ['q=Ts(me)?.projection??null','tc=Xs?.instanceId??null','rc=[gs?Dt:null,Kr?.modelSelection].find(e=>e?.instanceId===tc)?.model??null','xl=Cl(We??[],Ue,He)','sources:fs?.usageLimitSources??WG'])if(!owner.getText(sf).includes(a))throw Error('0.1.12 identity/context drift: '+a);
 let cache;const shells=[];function scan(n){if(n!==owner&&(ts.isFunctionDeclaration(n)||ts.isArrowFunction(n)||ts.isFunctionExpression(n)))return;if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='t'&&n.initializer?.getText(sf)==='(0,Q.c)(828)')cache=n.initializer.arguments[0];if(ts.isCallExpression(n)&&n.arguments[0]?.getText(sf)==='zv.Shell')shells.push(n);ts.forEachChild(n,scan);}scan(owner);
 if(!cache||shells.length!==1)throw Error('0.1.12 compiler/Shell drift');const shell=shells[0],children=shell.arguments[1].properties.find(n=>n.name?.getText(sf)==='children')?.initializer;
 if(children?.getText(sf)!=='[Wv,qv]')throw Error('0.1.12 Shell child drift');let memo=shell.parent;while(memo&&memo!==owner&&!ts.isConditionalExpression(memo))memo=memo.parent;
 if(!memo||memo.condition.getText(sf)!=='t[711]!==Fd||t[712]!==zv.Shell||t[713]!==Wv||t[714]!==qv'||!memo.whenTrue.getText(sf).endsWith('t[715]=Jv)'))throw Error('0.1.12 memo boundary drift');
 // tc and rc are the SAME instance/model pair used by the native composer usage control.
 const dependencies=['q','xl','bl','fi?.activeRunId??null','tc','rc','hs','fs?.usageLimitSources??WG'];
 const component='(0,$.jsx)(__T3OriginalTelemetry,{projection:q,contextWindow:xl,isWorking:bl,activeRunId:fi?.activeRunId??null,providerInstanceId:tc,activeModel:rc,providers:hs,sources:fs?.usageLimitSources??WG})';
 const edits=[[cache.getStart(sf),cache.getEnd(),String(828+dependencies.length)],[children.getStart(sf),children.getEnd(),`[Wv,${component},qv]`],[memo.condition.getStart(sf),memo.condition.getEnd(),memo.condition.getText(sf)+dependencies.map((v,i)=>`||t[${828+i}]!==(${v})`).join('')],[memo.whenTrue.getEnd()-1,memo.whenTrue.getEnd()-1,dependencies.map((v,i)=>`,t[${828+i}]=(${v})`).join('')+',Jv']];
 let code=source;for(const [a,b,v]of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,a)+v+code.slice(b);code='import{NativeComposerTelemetry as __T3OriginalTelemetry}from"./t3-original-telemetry.js";'+code;if(parse(code).parseDiagnostics.length)throw Error('Invalid adapted composer');
 return {code,report:{nativeOwner:'eK',originalCacheSlots:828,adaptedCacheSlots:836,cacheDependencies:dependencies,modelIdentity:'native tc/rc instance-matched pair',projection:'q=Ts(me)?.projection',context:'xl=Cl(We,Ue,He)',runtime:'fi.activeRunId',position:'native Shell, after Host, before git context row',installed:false}};
}
export function adaptModelBadges012(source){
 let code=once(source,'var at=(0,Z.memo)(function(e){let t=(0,Ve.c)(105)','var at=(0,Z.memo)(function(e){let t=(0,Ve.c)(107)');
 code=once(code,'t[84]!==V||t[85]!==H?(U=(0,Q.jsxs)(`div`,{className:`flex shrink-0 items-center gap-1.5`,children:[V,H]}),t[84]=V,t[85]=H,t[86]=U):U=t[86]','t[84]!==V||t[85]!==H||t[105]!==e.quotaEntry||t[106]!==e.slug?(U=(0,Q.jsxs)(`div`,{className:`flex shrink-0 items-center gap-1.5`,children:[(0,Q.jsx)(__T3MpQuotaBadge,{entry:e.quotaEntry,modelSlug:e.slug}),V,H]}),t[84]=V,t[85]=H,t[105]=e.quotaEntry,t[106]=e.slug,t[86]=U):U=t[86]');
 if(!code.includes('modelOptionsByInstance:c,instanceEntries:l,getModelDisabledReason:u'))throw Error('0.1.12 entries drift');
 code=once(code,'(0,Q.jsx)(at,{index:r,slug:a.slug,name:a.name,subProvider:a.subProvider,instanceId:a.instanceId,','(0,Q.jsx)(at,{index:r,slug:a.slug,name:a.name,subProvider:a.subProvider,instanceId:a.instanceId,quotaEntry:l?.find(__x=>__x.instanceId===a.instanceId)??null,');
 code=once(code,'pn={badgedInstanceIds:fn,favoritesSet:q,modelJumpLabelByKey:un,activeModelKey:N,selectedModelKeySet:L}','pn={quotaEntries:l,badgedInstanceIds:fn,favoritesSet:q,modelJumpLabelByKey:un,activeModelKey:N,selectedModelKeySet:L}');
 code+='\n'+excludeCustomLanguage(readOriginalFunctionTemplate('__T3MpQuotaBadge',{reactNs:'Z',jsxNs:'Q'}).code)+'\n';if(parse(code).parseDiagnostics.length)throw Error('Invalid adapted picker');return {code,report:{nativeRow:'at',nativeList:'Wt',quotaEntry:'outer instanceEntries l, never shadowed renderItem e',originalCacheSlots:105,adaptedCacheSlots:107,layout:'unchanged'}};
}
export function attachLimitsNavigation012(source){for(const a of ['var pr=`t3code:usage-page-preferences:v1`','function gr(){','function _r(e){','(0,Z.useState)(gr)'])if(!source.includes(a))throw Error('0.1.12 preferences drift: '+a);return source+'\nexport function __t3SelectNativeLimits(){_r({...gr(),metric:"limits"});}\n';}
