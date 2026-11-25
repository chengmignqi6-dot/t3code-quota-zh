// Pinned upstream UI, with only 0.1.11 header/navigation and listener-lifecycle compatibility.
import {createRequire} from 'node:module';
import {readOriginalTemplate,excludeCustomLanguage} from './source-template-port.mjs';
import {originalRuntimeBody} from './source-runtime-parts.mjs';
import {selectDeclarations} from './select-source.mjs';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
const parse=s=>ts.createSourceFile('topbar.js',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function once(source,from,to){if(source.split(from).length!==2)throw Error('Topbar compatibility anchor drift: '+from.slice(0,60));return source.replace(from,to);}
export function originalTopbarFunction(){
 let code=excludeCustomLanguage(readOriginalTemplate('newTopbarComp',{reactNs:'Z',jsxNs:'$'}).code);
 code=once(code,'showTopbarQuotaPopover(p,ev.currentTarget)','showTopbarQuotaPopover(p,ev.currentTarget,onOpenUsageLimits)');
 code=once(code,'clearInterval(id);if(typeof unsub==="function")unsub()','clearInterval(id);if(typeof unsub==="function")unsub();globalThis.__t3QuotaUi?.closeTopbarQuotaPopover?.()');
 return code;
}
export function originalTopbarPopover(){
 const original=selectDeclarations(originalRuntimeBody(),['showTopbarQuotaPopover','closeTopbarQuotaPopover']);
 if(original.imports.length)throw Error('Unexpected popover imports');
 let code=once(original.code,'function showTopbarQuotaPopover(pill, anchorEl)','function showTopbarQuotaPopover(pill, anchorEl, onOpenUsageLimits)');
 const ast=parse(code),handlers=[];function scan(n){if(ts.isBinaryExpression(n)&&n.left.getText(ast)==='openAll.onclick'&&ts.isArrowFunction(n.right))handlers.push(n.right.body);ts.forEachChild(n,scan);}scan(ast);
 if(handlers.length!==1||!handlers[0].getText(ast).includes('usage-page-preferences:v1')||!handlers[0].getText(ast).includes('pushState'))throw Error('Original dashboard navigation drift');
 code=code.slice(0,handlers[0].getStart(ast))+'{closeTopbarQuotaPopover();onOpenUsageLimits?.();}'+code.slice(handlers[0].getEnd());
 // Closing/unmounting before the deferred handler registration must not leak listeners.
 code=once(code,'setTimeout(() => {','const addListenersTimer = setTimeout(() => {');
 code=once(code,'cleanup: () => {','cleanup: () => {\n        clearTimeout(addListenersTimer);');
 if(/localStorage|querySelector|pushState|PopStateEvent|MutationObserver|fetch\(|WebSocket/.test(code))throw Error('Unrelated runtime escaped topbar extraction');
 if(parse(code).parseDiagnostics.length)throw Error('Original popover syntax drift');return code;
}
export function attachNativeLimitsPreferenceExport(source){
 for(const anchor of ['var mr=`t3code:usage-page-preferences:v1`','function _r(){','function vr(e){','(0,Z.useState)(_r)'])if(!source.includes(anchor))throw Error('Native limits preferences drift');
 if(source.includes('__t3SelectNativeLimits'))throw Error('Native limits preference export already present');
 return source+'\nexport function __t3SelectNativeLimits(){vr({..._r(),metric:"limits"});}\n';
}
export function adaptNativeTopbar(source){
 const ast=parse(source),owner=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='oG');if(!owner)throw Error('Native header owner drift');
 const headers=[];function scan(n){if(n!==owner&&(ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n)||ts.isArrowFunction(n)))return;if(ts.isCallExpression(n)&&n.arguments[0]?.getText(ast)==='`header`'&&n.arguments[1]?.properties?.some(p=>p.name?.getText(ast)==='"data-chat-header"'))headers.push(n);ts.forEachChild(n,scan);}scan(owner);
 if(headers.length!==1)throw Error('Native header count drift');const header=headers[0],children=header.arguments[1].properties.find(p=>p.name?.getText(ast)==='children')?.initializer;
 if(!children||!ts.isArrayLiteralExpression(children)||children.elements.length!==4||!children.elements[3].getText(ast).startsWith('(0,$.jsx)(_V,{activeThreadEnvironmentId:Wr.environmentId'))throw Error('Native header placement drift');
 // This header is built directly on every owner render, not inside a compiler memo branch.
 let node=header.parent;while(node&&node!==owner){if(ts.isConditionalExpression(node)&&node.condition.getText(ast)!=='g')throw Error('Native header unexpectedly memoized');node=node.parent;}
 if(!owner.getText(ast).includes('Ko=jS((Ho===void 0?void 0:ne.get(Ho))??JW,Wo)')||!source.includes('from"./useNavigate-2eWU8JWM.js"'))throw Error('Native header provider/navigation drift');
 const at=children.getEnd()-1,element='(0,$.jsx)(__T3NativeTopbarQuotaPills,{providers:Ko,rightPanelOpen:Ua})';
 let code=source.slice(0,at)+','+element+source.slice(at)+'\n'+originalTopbarFunction()+`\nfunction __T3NativeTopbarQuotaPills({providers,rightPanelOpen}){const navigate=$f();return (0,$.jsx)(__T3TopbarQuotaPills,{providers,rightPanelOpen,onOpenUsageLimits:async()=>{try{const page=await import("./_chat.usage-Cuvca1lh.js");page.__t3SelectNativeLimits();}catch{}void navigate({to:"/usage"});}});}\n`;
 if(parse(code).parseDiagnostics.length)throw Error('Adapted topbar syntax drift');
 return {code,report:{status:'staged-not-installed-not-render-verified',nativeOwner:'oG > header[data-chat-header]',providers:'Ko=jS(presentation entries for Ho, Wo): current native environment/workspace accounts',rightPanelOpen:'Ua: same native header panel state',memo:'header is not compiler-memoized; existing caches and unrelated functions unchanged',component:'pinned newTopbarComp; custom language disabled; native router callback; popover cleanup on unmount',popover:'pinned runtime show/close functions; native dashboard callback replaces obsolete storage key/DOM link/history fallback; deferred event timer cancelled on cleanup',navigation:'official useNavigate and original native usage preference reader/writer; metric=limits; other preferences preserved',pending:['actual native header geometry/titlebar overlap','browser keyboard/popover/account validation']}};
}
