// Inert extraction of pinned upstream JS templates. No eval, patcher import, or runtime execution.
import fs from 'node:fs';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('../work/source-build-deps/node_modules/typescript');
export function readOriginalTemplate(name,substitutions={}){
 const data=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs'),pin=crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');if(pin!=='da89945cbd3cd023aebff23310fd4d27a39cbb1f')throw Error('Original template pin drift');
 const ast=ts.createSourceFile('patch.js',data.toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),matches=[];function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name)matches.push(node.initializer);ts.forEachChild(node,visit);}visit(ast);if(matches.length!==1)throw Error('Unique original template not found: '+name);
 const literal=matches[0];let code;if(ts.isNoSubstitutionTemplateLiteral(literal))code=literal.text;else if(ts.isTemplateExpression(literal)){code=literal.head.text;for(const span of literal.templateSpans){const key=span.expression.getText(ast);if(!Object.hasOwn(substitutions,key))throw Error('Unexpected template interpolation: '+key);code+=substitutions[key]+span.literal.text;}}else throw Error('Original template is not literal');
 const result=ts.createSourceFile(name+'.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);if(result.parseDiagnostics.length)throw Error('Extracted original template does not parse');return {code,pin};
}
// One upstream append-template can contain several original function declarations.
export function readOriginalFunctionTemplate(firstFunctionName,substitutions={}){
 const data=fs.readFileSync('vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs'),pin=crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');if(pin!=='da89945cbd3cd023aebff23310fd4d27a39cbb1f')throw Error('Original template pin drift');
 const ast=ts.createSourceFile('patch.js',data.toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),matches=[];function visit(node){if((ts.isTemplateExpression(node)?node.head.text:ts.isNoSubstitutionTemplateLiteral(node)?node.text:'').startsWith('\nfunction '+firstFunctionName+'('))matches.push(node);ts.forEachChild(node,visit);}visit(ast);if(matches.length!==1)throw Error('Original function template drift');
 const literal=matches[0];let code=ts.isTemplateExpression(literal)?literal.head.text:literal.text;for(const span of literal.templateSpans??[]){const key=span.expression.getText(ast);if(!Object.hasOwn(substitutions,key))throw Error('Unexpected template interpolation: '+key);code+=substitutions[key]+span.literal.text;}
 const parsed=ts.createSourceFile('original.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);if(parsed.parseDiagnostics.length||parsed.statements.some(node=>!ts.isFunctionDeclaration(node)))throw Error('Non-function escaped original template');return {code,pin};
}
export function excludeCustomLanguage(code){
 const ast=ts.createSourceFile('original.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='zh'&&node.initializer&&node.initializer.getText(ast).includes('__t3QuotaUi.isZh()'))edits.push({start:node.initializer.getStart(ast),end:node.initializer.getEnd()});ts.forEachChild(node,visit);}visit(ast);if(edits.length!==1)throw Error('Original language exclusion anchor drift');for(const edit of edits.reverse())code=code.slice(0,edit.start)+'false'+code.slice(edit.end);if(/\.isZh\(|localStorage|navigator\.language/.test(code))throw Error('Custom locale leaked');return code;
}
