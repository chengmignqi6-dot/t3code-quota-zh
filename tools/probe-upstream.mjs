// Audit only selected pure frontend string transforms; never import or execute the upstream patcher.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {adaptNativePoolSection,adaptNativeCurrencyFormatter} from './native-upstream-adapters.mjs';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
const source=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs','utf8');
const bytes=Buffer.from(source);
if(crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!=='da89945cbd3cd023aebff23310fd4d27a39cbb1f')throw Error('Pinned source mismatch');
const ast=ts.createSourceFile('patch-asar.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
export function selectPinnedFrontendTransform(name,stop){
 const nodes=ast.statements.filter(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name);
 if(nodes.length!==1)throw Error('Ambiguous upstream function '+name);
 const text=nodes[0].getText(ast),pos=text.indexOf(stop);
 if(pos<0||text.indexOf(stop,pos+1)>=0)throw Error('Ambiguous exclusion boundary '+name);
 const pure=text.slice(0,pos)+'return out;\n}';
 // Compile only this verified pure transform; filesystem/server/runtime functions cannot enter context.
 const context=vm.createContext(Object.create(null),{codeGeneration:{strings:false,wasm:false}});
 return new vm.Script('('+pure+')').runInContext(context,{timeout:1000});
}
const transforms=[
 {name:'patchUsageLimitsShared',stop:'if (out.includes("__t3LimSharedZh")) return out;',file:'usageLimits-i1WvFdCN.js',required:['splitAccount:','poolKey:','splitTotal:']},
 {name:'patchUsageLimitsView',stop:'if (out.includes("__t3LimViewZh")) return out;',file:'UsageLimits-SEld7yZt.js',required:['t3-quota-col-1','t3-quota-sections','t3-quota-grid','__T3BurnBadge']},
 {name:'patchUsageFormatBundle',stop:'// 2. Malformed records notice',file:'usageFormat-C8gd1nnt.js',required:['__t3CnyFmt']},
];
export function portNativeQuotaAssets(){
const files=new Map(),report={status:'probe-only-not-installable',transforms:[]};
for(const item of transforms){
 const original=fs.readFileSync(path.join('work/pristine/apps/server/dist/client/assets',item.file),'utf8');
 let output=selectPinnedFrontendTransform(item.name,item.stop)(original);
 const upstreamUnadaptedMissing=item.required.filter(x=>!output.includes(x));
 const compatibilityAdaptations=[];
 if(item.name==='patchUsageLimitsView'&&upstreamUnadaptedMissing.includes('t3-quota-col-1')){output=adaptNativePoolSection(output);compatibilityAdaptations.push('PoolSection: preserve original upstream layout; retain 0.1.11 locale hook; remove incompatible compiler memo indices');}
 if(item.name==='patchUsageFormatBundle'&&upstreamUnadaptedMissing.includes('__t3CnyFmt')){output=adaptNativeCurrencyFormatter(output);compatibilityAdaptations.push('Formatter: retain 0.1.11 official locale parameter; invalid amount is unavailable, not zero');}
 const parsed=ts.createSourceFile(item.file,output,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const missing=item.required.filter(x=>!output.includes(x));
 const forbidden=['__t3LimSharedZh','__t3LimViewZh','This account has no subscription limits.'].filter(x=>x.startsWith('__')&&output.includes(x));
 const syntaxErrors=parsed.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' '));
 const result={function:item.name,nativeBundle:item.file,upstreamUnadaptedMissing,compatibilityAdaptations,changed:output!==original,requiredMarkersMissing:missing,excludedFeaturesPresent:forbidden,syntaxErrors,applicable:missing.length===0&&forbidden.length===0&&syntaxErrors.length===0};
 files.set(item.file,output);
 report.transforms.push(result);
}
return {files,report};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {files,report}=portNativeQuotaAssets();fs.mkdirSync('work/source-port/probes',{recursive:true});
 for(const [name,code] of files)fs.writeFileSync(path.join('work/source-port/probes',name),code);
 fs.writeFileSync('work/source-port/probe-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
