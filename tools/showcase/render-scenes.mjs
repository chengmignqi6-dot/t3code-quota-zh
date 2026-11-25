import fs from 'node:fs';import path from 'node:path';
const dir=process.argv[2]??'docs/showcase';
const pngDir=process.argv[3]??'.showcase-renders';
fs.mkdirSync(pngDir,{recursive:true});
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.svg')).sort();
const task=await taskSpace('render t3code-quota-zh showcase');
const page=task.page('p1');
const out=[];
for(const file of files){
 const svgText=fs.readFileSync(path.join(dir,file),'utf8');
 const m=svgText.match(/width="(\d+)" height="(\d+)"/);
 const w=Number(m[1]),h=Number(m[2]),scale=2;
 const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}svg{display:block;width:${w*scale}px;height:${h*scale}px}</style>${svgText}`;
 const htmlPath=path.join(pngDir,file+'.html');
 fs.writeFileSync(htmlPath,html);
 await page.goto('file:///'+htmlPath.replaceAll('\\','/'));
 await page.waitForFunction(()=>document.fonts.status==='loaded',undefined,{timeout:8000}).catch(()=>{});
 await new Promise(res=>setTimeout(res,350));
 const outPath=path.join(pngDir,file.replace('.svg','.png'));
 await page.screenshot({path:outPath,fullPage:true,clip:{x:0,y:0,width:w*scale,height:h*scale}});
 out.push({file,outPath,size:fs.statSync(outPath).size});
 console.log(JSON.stringify(out.at(-1)));
}
console.log(JSON.stringify({taskSpaceId:task.spaceId,rendered:out.length,dir:pngDir},null,2));
