// Stage actual upstream telemetry for the native frontend. No dist/install/archive writes.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
import {buildNativeSourceCss} from './source-native-css.mjs';
import {originalSummaryModule,attachOriginalSummary} from './source-summary-port.mjs';
import {originalTopbarPopover} from './source-topbar-port.mjs';
import {adaptComposer012 as adaptNativeComposer,adaptModelBadges012 as adaptNativeModelBadges,attachLimitsNavigation012 as attachNativeLimitsPreferenceExport} from './source-0.1.12-port.mjs';

// Footer-only: do not mount the separate quota overview or its provider bridge.
import {adaptQuotaWindowLabel} from './source-quota-window-label.mjs';
import {adaptConciseQuotaChinese} from './source-quota-locale-port.mjs';
import {adaptContextChinese,adaptContextSummaryChinese} from './source-context-locale-port.mjs';
import {portNativeCost012 as portNativeCost} from './source-cost-012-port.mjs';import {portNativeQuotaAssets012} from './native-quota-012-port.mjs';import {originalBurnModule,originalQuotaModule} from './source-runtime-parts.mjs';
import {selectDeclarations} from './select-source.mjs';import {omitUnmeteredUi} from './source-ui-exclusions.mjs';
const require=createRequire(path.resolve('work/source-build-deps/package.json')),esbuild=require('esbuild');
const root=path.resolve('work/source-port'),dir=path.join(root,'native-modules-0.1.12'),out=path.join(root,'native-stage-0.1.12/assets');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
for(const m of manifest.modules)if(sha(fs.readFileSync(path.join(root,m.output)))!==m.sha256)throw Error('Compiled original source mismatch: '+m.output);
for(const input of JSON.parse(fs.readFileSync('tools/native-012-input-pins.json','utf8'))){const bytes=fs.readFileSync(path.join('work/pristine-0.1.12/apps/server/dist/client',input.path));if(bytes.length!==input.size||sha(bytes)!==input.sha256)throw Error('Native 0.1.12 input drift: '+input.path);}
const preview=JSON.parse(fs.readFileSync(path.join(root,'preview/provenance.json'),'utf8'));
for(const s of preview.selections){let code=fs.readFileSync(path.join(root,s.source),'utf8');if(s.name==='cards')code=attachOriginalSummary(omitUnmeteredUi(adaptContextChinese(adaptConciseQuotaChinese(code).code).code));if(s.name==='metrics')code=adaptQuotaWindowLabel(code).code;fs.writeFileSync(path.join(dir,s.name+'.js'),selectDeclarations(code,s.roots,{fileName:s.source}).code);}
fs.writeFileSync(path.join(dir,'cn.js'),selectDeclarations(fs.readFileSync(path.join(root,'upstream-utils.js'),'utf8'),['cn']).code+'\nexport {isMacPlatform} from "./keybinding-matching.js";\n');
fs.writeFileSync(path.join(dir,'keybinding-matching.js'),selectDeclarations(fs.readFileSync(path.join(root,'upstream-keybinding-matching.js'),'utf8'),['isMacPlatform']).code);
fs.writeFileSync(path.join(dir,'utils.js'),'export {isMacPlatform} from "./keybinding-matching.js";\n');
fs.writeFileSync(path.join(dir,'window-controls.js'),selectDeclarations(fs.readFileSync(path.join(root,'upstream-window-controls.js'),'utf8'),['useNativeTitlebarHeight']).code);
fs.writeFileSync(path.join(dir,'env.js'),'export const isElectron=typeof document!=="undefined"&&document.documentElement.classList.contains("electron");\n');
for(const name of ['react','react-dom','jsx-runtime']){let bridge=fs.readFileSync(path.join(root,'preview-modules',name+'.js'),'utf8').replaceAll('../runtime/','./');if(name==='react-dom')bridge=bridge.replace('t as factory','r as factory').replace('react-dom-BEKrT875.js','with-selector-ehz1dnGQ.js');if(name==='jsx-runtime')bridge=bridge.replace('t as factory','i as factory').replace('jsx-runtime-BQExFN_X.js','with-selector-ehz1dnGQ.js');fs.writeFileSync(path.join(dir,name+'.js'),bridge);}
// Use the real native DateTime exports rather than a separate framework or altered timestamps.
const datetime=selectDeclarations(fs.readFileSync('work/pristine-0.1.12/apps/server/dist/client/assets/network-IO1fFe6J.js','utf8'),['Kv']);
if(datetime.imports.length||!datetime.code.includes('e.epochMilliseconds')||!datetime.code.includes('.toISOString()'))throw Error('Native DateTime signature drift');
fs.writeFileSync(path.join(dir,'date-time.js'),'import {Xf as nativeFormatIso} from "./network-IO1fFe6J.js";export const formatIso=nativeFormatIso;export function toEpochMillis(value){return Date.parse(nativeFormatIso(value));}export function makeUnsafe(epochMilliseconds){if(typeof epochMilliseconds!=="number"||!Number.isFinite(epochMilliseconds))throw Error("Invalid epoch milliseconds");return {epochMilliseconds};}\n');
fs.writeFileSync(path.join(dir,'burn.js'),originalBurnModule());
fs.writeFileSync(path.join(dir,'summary.js'),adaptContextSummaryChinese(originalSummaryModule()).code);
fs.writeFileSync(path.join(dir,'quota-math.js'),originalQuotaModule());
fs.writeFileSync(path.join(dir,'topbar-popover.js'),originalTopbarPopover());
fs.writeFileSync(path.join(dir,'quota-locale.js'),fs.readFileSync('src/quota-locale-zh.mjs','utf8'));
fs.writeFileSync(path.join(dir,'context-locale.js'),fs.readFileSync('src/context-locale-zh.mjs','utf8'));
const aliases=new Map(Object.entries({'@source/context-locale':'context-locale','@source/quota-locale':'quota-locale','@source/topbar-popover':'topbar-popover','@source/quota-math':'quota-math','@source/summary':'summary','@source/burn':'burn','react':'react','react/jsx-runtime':'jsx-runtime','react-dom':'react-dom','@source/cards':'cards','@source/metrics':'metrics','@t3tools/shared/usageLimits':'shared','../../lib/contextWindow':'context-format','../../lib/utils':'cn','~/lib/utils':'cn','../ui/button':'button','../ui/tooltip':'tooltip','./compaction.logic':'compaction','./turnTelemetry':'metrics','~/lib/windowControlsOverlay':'window-controls','~/env':'env','../ui/popover':'popover','./closing-positioner':'closing-positioner','./ComposerSurface':'composer-surface','../../hooks/useNowMinute':'now-minute','effect/DateTime':'date-time','@t3tools/contracts':'provider-availability','@t3tools/client-runtime/clock':'clock'}));
const externals=new Set(['./react-BP46yLMB.js','./with-selector-ehz1dnGQ.js','./network-IO1fFe6J.js','./useNavigate-C3WU9Yd7.js','./_chat.usage-B0MA-7bB.js']);
const options={entryPoints:[path.resolve('src/original-composer-012-entry.jsx')],bundle:true,write:false,format:'esm',target:'chrome130',jsx:'automatic',nodePaths:[path.resolve('work/source-build-deps/node_modules')],define:{'process.env.NODE_ENV':'"production"'},metafile:true,plugins:[{name:'native-source-bridges',setup(build){build.onResolve({filter:/.*/},args=>externals.has(args.path)?{path:args.path,external:true}:aliases.has(args.path)?{path:path.join(dir,aliases.get(args.path)+'.js')}:undefined);}}]};
const result=await esbuild.build(options),runtime=await esbuild.build({...options,entryPoints:[path.resolve('src/original-runtime-entry.mjs')]});
if(runtime.warnings.length||Object.keys(runtime.metafile.inputs).some(x=>x.includes('node_modules/')))throw Error('Original display runtime unexpectedly depends on packages');
if(result.warnings.length)throw Error('Native source build warnings');const inputs=Object.keys(result.metafile.inputs);if(inputs.some(x=>/node_modules\/(react|react-dom)\//.test(x)))throw Error('Duplicate React runtime');
const imports=result.metafile.outputs[Object.keys(result.metafile.outputs)[0]].imports;if(imports.some(x=>!externals.has(x.path)))throw Error('Unexpected native import');
const chat=fs.readFileSync('work/pristine-0.1.12/apps/server/dist/client/assets/ThreadRouteView-jIIdWstE.js','utf8'),patched=adaptNativeComposer(chat),quotaOverview={code:patched.code,report:{enabled:false,mount:'none',reason:'user requested footer quota summary only; separate header overview and source bridge not mounted'}};
const quota=portNativeQuotaAssets012({assetsDirectory:'work/pristine-0.1.12/apps/server/dist/client/assets'});if(quota.report.transforms.some(x=>!x.applicable))throw Error('Native quota port incomplete');
const modelPicker=adaptNativeModelBadges(fs.readFileSync('work/pristine-0.1.12/apps/server/dist/client/assets/ProviderModelPicker-Tx_dd0AL.js','utf8'));
const staged=new Map([['t3-original-telemetry.js',result.outputFiles[0].contents],['t3-original-runtime.js',runtime.outputFiles[0].contents],['ThreadRouteView-jIIdWstE.js','import "./t3-original-runtime.js";'+quotaOverview.code],['_chat.usage-B0MA-7bB.js','import "./t3-original-runtime.js";'+attachNativeLimitsPreferenceExport(portNativeCost(fs.readFileSync('work/pristine-0.1.12/apps/server/dist/client/assets/_chat.usage-B0MA-7bB.js','utf8')))]]);
staged.set('ProviderModelPicker-Tx_dd0AL.js','import "./t3-original-runtime.js";'+modelPicker.code);
for(const [name,code] of quota.files)staged.set(name,'import "./t3-original-runtime.js";'+code);
const stylesheet=await buildNativeSourceCss({quietQuota:true,nativeCssPath:'work/pristine-0.1.12/apps/server/dist/client/assets/main-DYJdcEdq.css'});staged.set('t3-original-source.css',stylesheet.css);
const originalIndex=fs.readFileSync('work/pristine-0.1.12/apps/server/dist/client/index.html','utf8');if(originalIndex.split('</head>').length!==2)throw Error('Native stylesheet entry drift');
const index=originalIndex.replace('</head>','<link rel="stylesheet" href="/assets/t3-original-source.css" data-t3-original-source>\n</head>');
fs.writeFileSync(path.join(root,'native-stage-0.1.12/index.html'),index);
for(const [name,code] of staged)fs.writeFileSync(path.join(out,name),code);
fs.writeFileSync(path.join(root,'native-stage-0.1.12/provenance.json'),JSON.stringify({nativeVersion:'0.1.12',nativeCommit:'ca81b7b97a1c',patchCommit:manifest.patchCommit,telemetryCommit:manifest.telemetryCommit,files:[...staged].map(([name,data])=>({name,sha256:sha(Buffer.from(data))})),index:{path:'index.html',sha256:sha(Buffer.from(index))}},null,2)+'\n');
console.log('Staged original-source telemetry in real native composer Shell; native React/DateTime imports only. No installation touched.');
