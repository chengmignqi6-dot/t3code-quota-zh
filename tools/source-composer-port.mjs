// 0.1.11 compatibility only: insert the original source strip inside the real composer Shell.
// No native UI function is reimplemented; React Compiler caches gain explicit dependencies.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
export function adaptNativeComposer(source){
 const sf=ts.createSourceFile('native-chat.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const owners=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='oG');if(owners.length!==1)throw Error('Composer owner drift');const owner=owners[0];
 for(const anchor of ['Mm=(qo?Ct:null)??Wr?.modelSelection','vs=hs?.instanceId??null'])if(!owner.getText(sf).includes(anchor))throw Error('Composer model/provider identity drift');
 let cache;const shells=[];
 function scan(n){if(n!==owner&&(ts.isFunctionDeclaration(n)||ts.isArrowFunction(n)||ts.isFunctionExpression(n)))return;
  if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='t'&&n.initializer?.getText(sf)==='(0,Q.c)(777)')cache=n.initializer.arguments[0];
  if(ts.isCallExpression(n)&&n.arguments[0]?.getText(sf)==='V_.Shell')shells.push(n);ts.forEachChild(n,scan);
 }scan(owner);if(!cache||shells.length!==1)throw Error('Composer compiler/Shell shape drift');
 const shell=shells[0],props=shell.arguments[1],children=props.properties?.find(n=>n.name?.getText(sf)==='children')?.initializer;
 if(!children||children.getText(sf)!=='[q_,X_]')throw Error('Composer insertion is not the native Shell children');
 let memo=shell.parent;while(memo&&memo!==owner&&!ts.isConditionalExpression(memo))memo=memo.parent;
 if(!memo||memo===owner||memo.condition.getText(sf)!=='t[664]!==Iu||t[665]!==V_.Shell||t[666]!==q_||t[667]!==X_')throw Error('Composer Shell memo drift');
 // hs/vs may be locked to the running thread while Mm is an explicit draft override.
 // Never pair another provider instance's model with this provider's quota.
 const dependencies=['Y','Dc','Ec','ai?.activeRunId??null','vs','Mm?.model??null','Ko','Vo?.usageLimitSources??XW','Mm?.instanceId??null'];
 const component='(0,$.jsx)(__T3OriginalTelemetry,{projection:Y,contextWindow:Dc,isWorking:Ec,activeRunId:ai?.activeRunId??null,providerInstanceId:vs,activeModel:Mm?.instanceId===vs?Mm?.model??null:null,providers:Ko,sources:Vo?.usageLimitSources??XW})';
 const changes=[
  [cache.getStart(sf),cache.getEnd(),String(777+dependencies.length)],
  [children.getStart(sf),children.getEnd(),`[q_,${component},X_]`],
  [memo.condition.getStart(sf),memo.condition.getEnd(),memo.condition.getText(sf)+dependencies.map((v,i)=>`||t[${777+i}]!==(${v})`).join('')],
  [memo.whenTrue.getEnd()-1,memo.whenTrue.getEnd()-1,dependencies.map((v,i)=>`,t[${777+i}]=(${v})`).join('')+',Z_'],
 ];
 if(source[memo.whenTrue.getEnd()-1]!==')'||!memo.whenTrue.getText(sf).endsWith('t[668]=Z_)'))throw Error('Composer memo write boundary drift');
 let output=source;for(const [start,end,replacement] of changes.sort((a,b)=>b[0]-a[0]))output=output.slice(0,start)+replacement+output.slice(end);
 output='import{NativeComposerTelemetry as __T3OriginalTelemetry}from"./t3-original-telemetry.js";'+output;
 const parsed=ts.createSourceFile('native-chat.js',output,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);if(parsed.parseDiagnostics.length)throw Error('Patched composer syntax invalid');
 return {code:output,report:{status:'staged-not-installed',nativeOwner:'oG',position:'V_.Shell children: after native Host, before native git context row',originalCacheSlots:777,adaptedCacheSlots:786,cacheDependencies:dependencies,activeRunIdentity:'runtime.activeRunId (never latest completed run)',modelIdentity:'Mm.model only when Mm.instanceId === vs; otherwise unknown (never another instance model)',projection:'Y: Ul(fe).projection',context:'Dc: original native context resolver',providerScope:'Ko and Vo.usageLimitSources from this native environment'}};
}
