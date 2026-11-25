// The only UI deletion: the user explicitly declined the custom API/Claude presentation.
// Everything else remains original transpiled source, including official locale handling.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
export function omitUnmeteredUi(source){
 const ast=ts.createSourceFile('composer.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 function visit(n){
  if(ts.isIfStatement(n)&&ts.isBinaryExpression(n.expression)&&n.expression.left.getText(ast)==='quota.kind'&&n.expression.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken&&ts.isStringLiteral(n.expression.right)&&n.expression.right.text==='unmetered-model'){
   if(n.elseStatement)throw Error('Unexpected API branch else');edits.push([n.getStart(ast),n.end,'if (quota.kind === "unmetered-model") return null;']);
  }
  ts.forEachChild(n,visit);
 }
 visit(ast);if(edits.length!==2)throw Error('Expected exactly two original API UI branches');
 const content=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='hasComposerTelemetryContent');
 const anchor='.kind !== "none"';if(!content||content.getText(ast).split(anchor).length!==2)throw Error('Content visibility anchor drift');
 const pos=source.indexOf(anchor,content.getStart(ast));edits.push([pos,pos+anchor.length,'.kind === "subscription"']);
 for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+text+source.slice(end);
 return source;
}
