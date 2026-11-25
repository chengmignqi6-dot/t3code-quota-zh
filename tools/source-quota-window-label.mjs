// Narrow non-fabrication adaptation. Preserve the pinned formatter except its unsupported session=>5h guess.
import{createRequire}from'node:module';const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
export function adaptQuotaWindowLabel(source){
 const ast=ts.createSourceFile('metrics.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),functions=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='formatShortWindowLabel');
 if(functions.length!==1)throw Error('Quota label formatter missing/ambiguous');
 const branches=functions[0].body.statements.filter(n=>ts.isIfStatement(n)&&/^if\s*\(window\.kind\s*===\s*"session"\)\s*return\s*"5h";$/.test(n.getText(ast)));
 if(branches.length!==1)throw Error('Guessed session label anchor drift');
 const branch=branches[0],code=source.slice(0,branch.getStart(ast))+source.slice(branch.getEnd());
 return{code,report:{function:'formatShortWindowLabel',removed:'session kind alone => 5h',retained:'explicit duration/label formatting, other cadence branches, original label fallback and all other source bytes',driverRulesAdded:false,markupChanged:false}};
}
