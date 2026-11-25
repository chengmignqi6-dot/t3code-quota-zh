// Read-only, symbol-resolved slicing of pinned transpiled source / native runtime.
// Retains complete original declarations verbatim. Does not evaluate source.
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
export function selectDeclarations(source,roots,{fileName='selected.js'}={}){
 const file=path.resolve(fileName),options={allowJs:true,noLib:true,noResolve:true,target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext};
 const sf=ts.createSourceFile(file,source,ts.ScriptTarget.ESNext,true,ts.ScriptKind.JS);
 const host=ts.createCompilerHost(options);
 host.getSourceFile=name=>path.resolve(name)===file?sf:undefined;
 host.writeFile=()=>{};
 const program=ts.createProgram([file],options,host),checker=program.getTypeChecker();
 const top=node=>{while(node.parent&&node.parent!==sf){if(ts.isVariableDeclaration(node)&&ts.isVariableDeclarationList(node.parent)&&ts.isVariableStatement(node.parent.parent)&&node.parent.parent.parent===sf)return node;node=node.parent;}return node.parent===sf?node:undefined;};
 const declarations=new Map();
 for(const st of sf.statements){
  if(ts.isFunctionDeclaration(st)&&st.name)declarations.set(st.name.text,st);
  if(ts.isClassDeclaration(st)&&st.name)declarations.set(st.name.text,st);
  if(ts.isVariableStatement(st))for(const d of st.declarationList.declarations){
    // Binding elements resolve to the owning declaration just like simple names.
    // Keep the complete destructuring initializer: selecting only the use would leave free globals.
    const bind=name=>{if(ts.isIdentifier(name))declarations.set(name.text,d);else if(ts.isObjectBindingPattern(name)||ts.isArrayBindingPattern(name))for(const element of name.elements)if(ts.isBindingElement(element))bind(element.name);};bind(d.name);
   }
 }
 const selected=new Set(),importSymbols=new Set(),unresolved=new Set();
 function visitStatement(st){
  if(selected.has(st))return;selected.add(st);
  function visit(node){
   if(ts.isIdentifier(node)){
    // Object shorthand identifiers bind a property symbol AND a lexical value symbol.
     // Follow the value (e.g. ComposerSurface={Shell}), not the property itself.
     const symbol=ts.isShorthandPropertyAssignment(node.parent)&&node.parent.name===node
      ? checker.getShorthandAssignmentValueSymbol(node.parent)??checker.getSymbolAtLocation(node)
      : checker.getSymbolAtLocation(node);
    if(symbol?.declarations)for(const decl of symbol.declarations){const owner=top(decl);if(owner&&owner!==st){if(ts.isImportDeclaration(owner)){selected.add(owner);importSymbols.add(symbol);}else if(declarationsHas(owner))visitStatement(owner);}}
    else if(!isNonReference(node))unresolved.add(node.text);
   }
   ts.forEachChild(node,visit);
  }
  visit(st);
 }
 const knownStatements=new Set(declarations.values());
 function declarationsHas(node){return knownStatements.has(node);}
 function isNonReference(n){return (ts.isPropertyAccessExpression(n.parent)&&n.parent.name===n)||(ts.isPropertyAssignment(n.parent)&&n.parent.name===n)||ts.isExportSpecifier(n.parent);}
 for(const name of roots){const node=declarations.get(name);if(!node)throw Error('Declaration not found: '+name);visitStatement(node);}
 const imports=[],chunks=[],printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
 for(const st of sf.statements){
  if(ts.isVariableStatement(st)){
   const kept=st.declarationList.declarations.filter(d=>selected.has(d));
   if(kept.length){const kind=st.declarationList.flags&ts.NodeFlags.Const?'const':st.declarationList.flags&ts.NodeFlags.Let?'let':'var';chunks.push((st.modifiers??[]).map(m=>m.getText(sf)+' ').join('')+kind+' '+kept.map(d=>d.getText(sf)).join(',')+';');}
   continue;
  }
  if(!selected.has(st))continue;
  if(ts.isImportDeclaration(st)){
   const clause=st.importClause;if(!clause)throw Error('Unexpected side-effect import');
   const used=n=>n&&importSymbols.has(checker.getSymbolAtLocation(n));
   let binding=clause.namedBindings;
   if(binding&&ts.isNamedImports(binding))binding=ts.factory.updateNamedImports(binding,binding.elements.filter(e=>used(e.name)));
   if(binding&&ts.isNamedImports(binding)&&binding.elements.length===0)binding=undefined;
   const name=used(clause.name)?clause.name:undefined;
   if(!name&&!binding)continue;
   const updated=ts.factory.updateImportDeclaration(st,st.modifiers,ts.factory.updateImportClause(clause,false,name,binding),st.moduleSpecifier,st.attributes);
   chunks.push(printer.printNode(ts.EmitHint.Unspecified,updated,sf));
   imports.push({module:st.moduleSpecifier.text,names:[...(name?[name.text]:[]),...(binding?(ts.isNamedImports(binding)?binding.elements.map(x=>({imported:(x.propertyName??x.name).text,local:x.name.text})):[binding.name.text]):[])]});
  }else chunks.push(st.getText(sf));
 }
 // Root declarations may already have export modifiers; no duplicate export statements are emitted.
 const needExport=roots.filter(name=>{const node=declarations.get(name),statement=ts.isVariableDeclaration(node)?node.parent.parent:node;return !(statement.modifiers??[]).some(m=>m.kind===ts.SyntaxKind.ExportKeyword);});
 if(needExport.length)chunks.push('export { '+needExport.join(', ')+' };');
 return{code:chunks.join('\n')+'\n',imports,selectedStatements:selected.size,totalStatements:sf.statements.length,unresolvedIdentifiers:[...unresolved].sort()};
}
