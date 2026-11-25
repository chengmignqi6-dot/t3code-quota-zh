// Extract inert, symbol-selected math only. Never run the upstream runtime/patcher.
import fs from 'node:fs';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {selectDeclarations} from './select-source.mjs';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
export function originalBurnModule(){return originalRuntimeMath(['computeBurnForecast']);}
export function originalQuotaModule(){return originalRuntimeMath(['getProviderQuota','buildTopbarPills']);}
function originalRuntimeMath(roots){
 const selected=selectDeclarations(originalRuntimeBody(),roots);if(selected.imports.length||/localStorage|querySelector|MutationObserver|addEventListener|setTimeout|setInterval/.test(selected.code))throw Error('Unrelated runtime escaped extraction');return selected.code;
}
export function originalRuntimeBody(){
 const data=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs');if(crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex')!=='da89945cbd3cd023aebff23310fd4d27a39cbb1f')throw Error('Source pin mismatch');
 const parse=s=>ts.createSourceFile('runtime.js',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),sf=parse(data.toString());const matches=[];function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='runtimeScript')matches.push(n.initializer);ts.forEachChild(n,visit);}visit(sf);
 if(matches.length!==1||!ts.isTemplateExpression(matches[0])||matches[0].templateSpans.length!==1||matches[0].templateSpans[0].expression.getText(sf)!=='safeDefaultLang')throw Error('Runtime template drift');
 const literal=matches[0],script=literal.head.text+'en'+literal.templateSpans[0].literal.text,inner=script.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, ''),scriptAst=parse(inner);
 const call=scriptAst.statements[0]?.expression,fn=call&&ts.isCallExpression(call)&&ts.isParenthesizedExpression(call.expression)?call.expression.expression:null;if(!fn||!ts.isFunctionExpression(fn))throw Error('Original runtime wrapper drift');
 let body=fn.body.getText(scriptAst).slice(1,-1);const bodyAst=parse(body),lang=bodyAst.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name.text==='getLang');if(lang.length!==1)throw Error('Language exclusion anchor drift');
 // The custom locale preference/observer is intentionally absent; keep original English branch.
 body=body.slice(0,lang[0].getStart(bodyAst))+'function getLang(){return "en";}'+body.slice(lang[0].getEnd());
 return body;
}
