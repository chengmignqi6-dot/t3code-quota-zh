// Add only absent original telemetry utilities; retain native theme/preflight and existing utilities.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(path.resolve('work/source-build-deps/package.json')),{transform}=require('lightningcss'),{compile}=require('@tailwindcss/node'),ts=require('typescript');
const blob=data=>crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
const parse=(code,visitor)=>transform({filename:'source.css',code:Buffer.from(code),minify:false,visitor});
// Preserve exact original CSS bytes instead of serializing Lightning CSS's lossy visitor AST.
export function cssBlocks(source){const out=[];let start=0,depth=0,open=-1,quote='',comment=false;
 for(let i=0;i<source.length;i++){const c=source[i],next=source[i+1];if(comment){if(c==='*'&&next==='/'){comment=false;i++;}continue;}if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}if(c==='/'&&next==='*'){comment=true;i++;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='\\'){i++;continue;}
  if(c==='{'){if(depth++===0)open=i;}else if(c==='}'){if(--depth<0)throw Error('Unbalanced CSS');if(depth===0){out.push({header:source.slice(start,open).replace(/\/\*[\s\S]*?\*\//g,'').trim(),body:source.slice(open+1,i),text:source.slice(start,i+1)});start=i+1;}}else if(c===';'&&depth===0){out.push({header:source.slice(start,i).replace(/\/\*[\s\S]*?\*\//g,'').trim(),body:null,text:source.slice(start,i+1)});start=i+1;}
 }if(depth||quote||comment||source.slice(start).replace(/\/\*[\s\S]*?\*\//g,'').trim())throw Error('Incomplete CSS');return out;}
// A synchronous addon link runs before the native JS-loaded CSS. Register the exact
// native top-level layer order first, or its base reset would outrank utilities.
export function nativeLayerPrelude(native){
 const layers=[];
 for(const block of cssBlocks(native)){
  if(block.header==='@layer')throw Error('Native top-level layer syntax drift');
  if(!block.header.startsWith('@layer '))continue;
  const names=block.header.slice(7).split(',').map(s=>s.trim());
  if(names.some(n=>!/^[a-z][\w-]*$/.test(n)))throw Error('Native top-level layer syntax drift');
  for(const name of names)if(!layers.includes(name))layers.push(name);
 }
 if(JSON.stringify(layers)!==JSON.stringify(['properties','theme','base','clerk','components','utilities']))throw Error('Native top-level layer order drift: '+layers.join(','));
 return {css:'@layer '+layers.join(',')+';',layers};
}
// Replace the exact native effort renderer, never conceal its siblings or native footer.
// These two upstream rules assume an older DOM: omit only their exact pinned bytes.
export function guardOriginalEffortCss(css){
 const unsafe=[
  '[data-model-picker-effort] > div:not(:has([data-cosmic-effort-slider])):not([data-cosmic-effort-slider]),\n[data-model-picker-effort] > div > div:not(:has([data-cosmic-effort-slider])):not([data-cosmic-effort-slider]) {\n  display: none !important;\n}',
  'div:has(> [data-model-picker-effort]):has([data-v9-perm-row]) + div {\n  height: 0 !important;\n  min-height: 0 !important;\n  padding: 0 !important;\n  margin: 0 !important;\n  border: 0 !important;\n  overflow: hidden !important;\n  opacity: 0 !important;\n  pointer-events: none !important;\n}'
 ];
 for(const rule of unsafe){if(css.split(rule).length!==2)throw Error('Original effort visibility selector drift');css=css.replace(rule,'');}
 return css;
}
export async function buildNativeSourceCss({quietQuota=false}={}){
 const native=fs.readFileSync('work/pristine/apps/server/dist/client/assets/main-C7LLcwbG.css','utf8'),selectors=new Set(),properties=new Set(),keyframes=new Set();
 parse(native,{Rule(rule){if(rule.type==='style')for(const selector of rule.value.selectors)selectors.add(JSON.stringify(selector));if(rule.type==='property')properties.add(rule.value.name);if(rule.type==='keyframes')keyframes.add(rule.value.name.value);}});
 const themePath='vendor/nanami-telemetry-d1bb533/apps/web/src/index.css',theme=fs.readFileSync(themePath),tree=JSON.parse(fs.readFileSync('work/upstream-telemetry-tree.json','utf8'));if(blob(theme)!==tree.tree.find(x=>x.path==='apps/web/src/index.css').sha)throw Error('Theme pin drift');
 const compiler=await compile(theme.toString(),{base:path.resolve('work/source-build-deps'),onDependency:()=>{}});
 const manifest=JSON.parse(fs.readFileSync('work/source-port/manifest.json','utf8')),content=manifest.modules.map(m=>fs.readFileSync(path.join('work/source-port',m.output),'utf8')).join('\n');
 const compiled=compiler.build([...new Set(content.split(/[\s"'`]+/))]),blocks=cssBlocks(compiled),utilityLayer=blocks.filter(b=>b.header==='@layer utilities');if(utilityLayer.length!==1)throw Error('Utility layer drift');let kept=0,removed=0;
 const utilityRules=cssBlocks(utilityLayer[0].body).filter(block=>{if(block.header.startsWith('@'))throw Error('Unexpected non-style utility');const keys=[];parse(block.header+'{}',{Rule(rule){if(rule.type==='style')keys.push(...rule.value.selectors.map(s=>JSON.stringify(s)));}});if(!keys.length)throw Error('Missing utility selector');const existing=keys.filter(key=>selectors.has(key)).length;if(existing&&existing!==keys.length)throw Error('Mixed native/new selector group');if(existing){removed+=keys.length;return false;}kept+=keys.length;return true;});
 const utilities='@layer utilities {\n'+utilityRules.map(b=>b.text).join('\n')+'\n}';
 const extras=blocks.filter(b=>{const property=b.header.match(/^@property\s+(\S+)$/),animation=b.header.match(/^@keyframes\s+(\S+)$/);return property?!properties.has(property[1])&&utilities.includes(property[1]):animation?!keyframes.has(animation[1])&&utilities.includes(animation[1]):false;}).map(b=>b.text).join('\n');
 if(quietQuota){
  const quietRules=utilityRules.filter(b=>!/\banimation\s*:/.test(b.text)),quietUtilities='@layer utilities {\n'+quietRules.map(b=>b.text).join('\n')+'\n}',quietExtras=blocks.filter(b=>{const property=b.header.match(/^@property\s+(\S+)$/);return property&&!properties.has(property[1])&&quietUtilities.includes(property[1]);}).map(b=>b.text).join('\n');
  const overview=fs.readFileSync('src/quota-overview.css','utf8'),badge='.t3-mp-quota-badge{display:inline-flex;align-items:center;border:1px solid var(--border,#ddd);border-radius:4px;padding:1px 5px;font-size:10px;line-height:1.4;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}.t3-mp-quota-ok{color:var(--muted-foreground,#6b6b70)}.t3-mp-quota-warn{color:var(--color-amber-600,#a16207)}.t3-mp-quota-danger{color:var(--color-red-600,#dc2626)}';
  const stats='[data-v9-stats-cluster]{display:inline-flex;align-items:center;gap:2px;min-width:0;flex-wrap:wrap}[data-v9-stats-trig]{display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:0 6px;border:0;background:transparent;color:var(--muted-foreground,#6b6b70);font-size:11px;line-height:1.4;font-variant-numeric:tabular-nums;white-space:nowrap;cursor:pointer}[data-v9-stats-trig]:hover{color:var(--foreground,#202024)}[data-v9-stats-trig]:focus-visible{outline:2px solid var(--ring,#888);outline-offset:2px;border-radius:4px}[data-v9-stats-dock-pill]{display:none}[data-v9-stats-dot]{width:5px;height:5px;flex-shrink:0;border-radius:50%;background:currentColor}[data-v9-stats-sep]{width:1px;height:11px;flex-shrink:0;background:var(--border,#ddd)}';
   const layerOrder=nativeLayerPrelude(native),css=layerOrder.css+'\n'+quietUtilities+'\n'+quietExtras+'\n'+overview+'\n'+badge+'\n'+stats+'\n';parse(css,{});
  return {css,report:{nativeCssSha256:crypto.createHash('sha256').update(native).digest('hex'),quietQuota:true,nativeLayerOrder:layerOrder.layers,earlyAddonLayerPolicy:'register pinned native layer order before utilities; base remains below utilities even when addon loads before JS',quotaOverviewCssSha256:crypto.createHash('sha256').update(overview).digest('hex'),addedUtilitySelectors:kept,reusedNativeSelectors:removed,omittedAnimationUtilities:utilityRules.length-quietRules.length,themeBlob:blob(theme),policy:'native theme/preflight/utilities unchanged; missing non-animated source utilities and restrained quota overview/model badge plus essential existing stats layout; stats magnetic dock hidden; no legacy quota/scene stylesheet or effort/permission overrides'}};
 }
 const patch=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs');if(blob(patch)!=='da89945cbd3cd023aebff23310fd4d27a39cbb1f')throw Error('Quota CSS source drift');
 const ast=ts.createSourceFile('patch.js',patch.toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),styles=[];function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='styleBlock')styles.push(n.initializer);ts.forEachChild(n,visit);}visit(ast);
 if(styles.length!==1||!ts.isTemplateExpression(styles[0])||styles[0].templateSpans.length!==1||styles[0].templateSpans[0].expression.getText(ast)!=='__STARDUST_V9_CSS')throw Error('Original styles template drift');const quota=(styles[0].head.text+styles[0].templateSpans[0].literal.text).replace(/^<style[^>]*>\s*/,'').replace(/\s*<\/style>$/,'');
 const stardust=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/stardust/v9-stardust.css');if(blob(stardust)!=='ccbb0d204f390c89ce03615749dbe85041e53ad9')throw Error('Stardust source drift');
 const stars=stardust.toString(),start=stars.indexOf('/* ==================== Preview Pin Annotation Overlay'),end=stars.indexOf('/* ==================== Topbar Pill Per-Provider Quota Popover');if(start<0||end<=start)throw Error('Styles exclusion drift');
 const css=utilities+'\n'+extras+'\n'+quota+'\n'+guardOriginalEffortCss(stars.slice(0,start))+stars.slice(end);parse(css,{});
 return {css,report:{nativeCssSha256:crypto.createHash('sha256').update(native).digest('hex'),addedUtilitySelectors:kept,reusedNativeSelectors:removed,policy:'native theme/preflight/utilities unchanged; only missing original utilities, original quota stylesheet, original Stardust excluding preview-pin/cache-cleaner sections; exactly two unsafe original effort/adjacent-footer hide rules omitted; native controls and footer remain visible even with mounted slider',themeBlob:blob(theme),quotaBlob:blob(patch),stardustBlob:blob(stardust)}};
}
