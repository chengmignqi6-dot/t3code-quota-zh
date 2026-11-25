// Vector illustrations rebuilt from measured native UI geometry and sampled colors.
// All numbers are demo values shaped like the real Pro-account UI; no private data.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {C,t,r,line,svg,bar,segmented,ringGauge,quotaChip,labelWidth,footerNative,antigravity,openai,star,check,clock,search,paperclip,chevron,callout,dot,shadowFilter,heroFilter,darkCanvas} from './showcase-lib.mjs';
const OUT=fileURLToPath(new URL('../../docs/showcase',import.meta.url));
fs.mkdirSync(OUT,{recursive:true});
const DEFS=`<defs>${shadowFilter}${heroFilter}</defs>`;
const group=(x,y,k,body)=>`<g transform="translate(${x} ${y}) scale(${k})">${body}</g>`;
const D={
 ctx:{pct:48,used:'498k',max:'1m',cached:'494k',cachedPct:'47%',uncached:'4.2k',uncachedPct:'0.4%',free:'550k',freePct:'52%',lastHit:'99%',sessionHit:'95%',turns:'12轮',tools:'工具118次'},
 foot:{tokens:'498.4K词元',hit:'95%'},
 quota:{five:93,week:40},
 model:'Gemini 4 Neon',
 limits:[
  {title:'Gemini · 5-hour',pct:93,reset:'4小时56分钟',note:'⚡ Fast · ~51m to cap'},
  {title:'Gemini · Weekly',pct:40,reset:'4天23小时',note:'⚡ Fast · ~1d 8h to cap',striped:true},
  {title:'Claude & GPT (shared) · 5-hour',pct:100,note:'✨ Full capacity'},
  {title:'Claude & GPT (shared) · Weekly',pct:100,note:'✨ Full capacity'}
 ],
 cost:{total:'¥318.20',sessions:'9 个会话',chart:'每小时费用',y:['¥240.00','¥160.00','¥80.00','0'],
  totals:[['处理的 token','96M'],['缓存的输入','88M'],['未缓存的输入','6.4M'],['输出','620K'],['缓存节省','¥1,845.70']],
  parts:[['输入框','¥112.40',0.35],['缓存读取','¥142.30',0.45],['输出','¥63.50',0.20]],
  rows:[['gemini-4-neon','¥318.20','98.7%','94M'],['antigravity-model-0','未定价','1.3%','1.2M']]},
 token:{total:'96M',sessions:'9 个会话',chart:'每小时处理的 token',y:['24M','16M','8M','0'],
  totals:[['处理的 token','96M'],['缓存的输入','88M'],['未缓存的输入','6.4M'],['输出','620K'],['缓存节省','¥1,845.70']],
  parts:[['输入框','6.4M',0.15],['缓存读取','88M',0.72],['输出','620K',0.13]],
  rows:[['gemini-4-neon','¥318.20','98.7%','94M'],['antigravity-model-0','未定价','1.3%','1.2M']]}
};

// ---------------- native panels (native pixel coordinates) ----------------
function composerNative(){
 const S=[];const W=735,H=202;
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(17,74,'想询问什么都可以。@ 引用文件，$ 使用技能，/ 输入命令',{size:13,fill:C.faint}));
 S.push(paperclip(15,126,1.05));
 S.push(r(485,132,126,28,{fill:C.hover,rx:14}));
 S.push(antigravity(495,137,0.62));
 S.push(t(519,151,'4 Neon High',{size:12.5,weight:500}));
 S.push(chevron(591,141,0.85));
 S.push(`<path d="M632 142a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0z" fill="none" stroke="${C.muted}" stroke-width="1.5"/><path d="M628 148a8 8 0 0 0 16 0M636 158v4" fill="none" stroke="${C.muted}" stroke-width="1.5" stroke-linecap="round"/>`);
 S.push(`<circle cx="697" cy="146" r="16" fill="${C.blue}"/><path d="M697 153v-13M691 146l6-6 6 6" fill="none" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`);
 S.push(line(12,169,723,169,{stroke:'#ededef'}));
 S.push(group(17,187,1,footerNative(0,0)));
 return {body:S.join(''),w:W,h:H};
}
function windowNative(){
 const W=1920,H=1040,S=[];
 S.push(r(0,0,W,H,{fill:C.bg}));
 S.push(r(0,0,W,32,{fill:C.bg}));
 S.push(r(12,6,20,20,{fill:'#18181b',rx:5})+t(22,20,'T3',{size:9,weight:700,fill:'#fff',anchor:'middle'}));
 S.push(t(40,20,'T3 Code',{size:12.5,weight:600}));
 S.push(`<path d="M110 10l-7 7 7 7" fill="none" stroke="${C.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
 S.push(`<path d="M138 10l7 7-7 7" fill="none" stroke="${C.faint}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
 S.push(r(322,12,14,14,{fill:'#f59e0b',rx:3})+t(329,22.5,'D',{size:9,weight:700,fill:'#fff',anchor:'middle'}));
 S.push(t(344,23,'demo-workspace',{size:13}));
 S.push(t(454,23,'/',{size:13,fill:C.faint}));
 S.push(t(468,23,'新会话',{size:13,fill:C.muted}));
 for(const x of[1614,1650,1686,1722])S.push(r(x,8,26,18,{stroke:'#e6e6ea',sw:1,rx:3,fill:'none'}));
 S.push(line(1772,6,1772,26,{stroke:C.border}));
 S.push(line(1804,17,1818,17,{stroke:'#5b5b60',sw:1.6}));
 S.push(r(1840,10,12,12,{stroke:'#5b5b60',sw:1.4}));
 S.push(line(1876,10,1890,24,{stroke:'#5b5b60',sw:1.6})+line(1890,10,1876,24,{stroke:'#5b5b60',sw:1.6}));
 S.push(line(0,32,W,32,{stroke:'#e9e9eb'}));
 S.push(r(0,32,306,1008,{fill:C.panel}));
 S.push(line(306,32,306,1040,{stroke:C.border}));
 S.push(search(14,56,1.05));
 S.push(t(38,68,'搜索',{size:13,fill:C.muted}));
 S.push(`<path d="M242 54v12M236 60h12" stroke="${C.muted}" stroke-width="1.5" stroke-linecap="round"/>`);
 S.push(`<path d="M270 54h11v10h-11z" fill="none" stroke="${C.muted}" stroke-width="1.4"/><path d="M273 54v-3h6v3" fill="none" stroke="${C.muted}" stroke-width="1.2"/>`);
 S.push(r(10,88,18,18,{fill:'#f59e0b',rx:4})+t(19,101,'D',{size:10.5,weight:700,fill:'#fff',anchor:'middle'}));
 S.push(t(36,101,'demo-workspace',{size:12.5,weight:500}));
 S.push(t(294,101,'刚刚',{size:11,fill:C.faint,anchor:'end'}));
 S.push(r(2,112,292,76,{fill:'#f0f0f1',rx:8}));
 S.push(t(14,136,'整理示例页面的说明',{size:13}));
 S.push(`<rect x="14" y="148" width="9" height="9" rx="2" fill="none" stroke="${C.faint}" stroke-width="1.2"/>`);
 S.push(t(28,157,'本地副本',{size:11,fill:C.muted}));
 S.push(t(28,173,'DESKTOP-DEMO',{size:10.5,fill:C.faint}));
 S.push(r(0,992,306,48,{fill:C.panel}));
 S.push(line(0,992,306,992,{stroke:'#ececee'}));
 S.push(t(8,1010,'已收尾',{size:12,fill:C.muted}));
 S.push(t(294,1010,'2',{size:12,fill:C.muted,anchor:'end'}));
 for(const x of[44,70,96])S.push(r(x,1020,12,12,{stroke:C.faint,sw:1.2,rx:2}));
 S.push(`<g filter="url(#sh)">${r(1622,50,279,264,{fill:'#ffffff',rx:12,stroke:'#ececee'})}</g>`);
 S.push(`<path d="M1642 76h10v9h-10z" fill="none" stroke="${C.muted}" stroke-width="1.4"/><path d="M1652 73v9" stroke="${C.muted}" stroke-width="1.2"/>`);
 S.push(t(1662,83,'DESKTOP-DEMO',{size:12.5,weight:500}));
 S.push(chevron(1862,75,0.9));
 S.push(line(1638,96,1885,96,{stroke:'#f0f0f1'}));
 S.push(r(1642,108,12,10,{fill:'#f59e0b',rx:2}));
 S.push(t(1662,118,'在文件资源管理器中打开',{size:12.5}));
 S.push(chevron(1862,111,0.9));
 S.push(t(1642,144,'+  添加项目脚本',{size:12.5,fill:'#3f3f46'}));
 S.push(line(1638,160,1885,160,{stroke:'#f0f0f1'}));
 S.push(t(1664,184,'master',{size:12.5}));
 S.push(t(1644,206,'提交',{size:12.5}));
 S.push(t(1642,242,'改动 · 未提交',{size:12,fill:'#3f3f46'}));
 S.push(t(1885,242,'+5,696 −464',{size:11.5,fill:'#16a34a',anchor:'end'}));
 S.push(t(1642,278,'+  其他仓库…',{size:12.5,fill:'#3f3f46'}));
 S.push(r(743,88,735,22,{fill:'#f6f6f7',rx:5}));
 S.push(t(754,103,'示例对话 · 演示数据（已脱敏）',{size:11,fill:C.muted}));
 S.push(t(743,144,'你',{size:11.5,fill:C.faint}));
 S.push(t(743,168,'帮我把这个页面的按钮改成圆角',{size:13.5}));
 S.push(t(743,208,'示例助手',{size:11.5,fill:C.faint}));
 S.push(t(743,232,'好的，已经调整按钮圆角与间距；底部状态栏保持紧凑显示。',{size:13.5}));
 S.push(t(743,256,'如需更圆的效果，我可以把半径再调大一档。',{size:13.5}));
 S.push(group(743,818,1,composerNative().body));
 return {body:S.join(''),w:W,h:H};
}
function contextPanel(){
 const S=[];const W=270,H=286;
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(14,30,'上下文',{size:13,fill:'#3f3f46'}));
 S.push(t(14,64,'已用48%',{size:18,weight:600}));
 S.push(t(256,63,'498k / 1m',{size:12.5,fill:C.muted,anchor:'end',mono:true}));
 S.push(bar(14,80,242,8,{segments:[{w:108,fill:C.blue},{w:3,fill:C.orange}]}));
 for(const [y,color,label,value,pct] of [[120,'#2b7fff','已缓存',D.ctx.cached,D.ctx.cachedPct],[152,'#fe9a00','未缓存',D.ctx.uncached,D.ctx.uncachedPct]]){
  S.push(r(16,y-9,10,10,{fill:color,rx:2.5}));
  S.push(t(36,y,label,{size:13}));
  S.push(t(200,y,value,{size:12.5,anchor:'end',mono:true}));
  S.push(t(256,y,pct,{size:12,fill:C.muted,anchor:'end'}));
 }
 S.push(line(14,170,256,170,{stroke:'#ededef'}));
 S.push(r(16,187,10,10,{stroke:C.faint,sw:1.2,rx:2.5,fill:'none'}));
 S.push(t(36,197,'剩余空间',{size:13,fill:C.muted}));
 S.push(t(200,197,D.ctx.free,{size:12.5,fill:C.muted,anchor:'end',mono:true}));
 S.push(t(256,197,D.ctx.freePct,{size:12,fill:C.muted,anchor:'end'}));
 S.push(line(14,214,256,214,{stroke:'#ededef'}));
 S.push(t(14,240,'缓存命中',{size:12.5,fill:C.muted}));
 S.push(t(256,240,'会话95%',{size:11,fill:C.faint,anchor:'end'}));
 S.push(t(157,240,'最近99%',{size:12,fill:C.blue,weight:600,anchor:'end'}));
 S.push(t(196,240,'·',{size:11,fill:C.faint}));
 S.push(line(14,254,256,254,{stroke:'#f4f4f5'}));
 S.push(t(14,276,'12轮 · 工具118次',{size:11,fill:C.muted}));
 return {body:S.join(''),w:W,h:H};
}
function quotaCardNative(y,label,pct,reset){
 const S=[];
 S.push(r(16,y,283,96,{fill:'#ffffff',rx:10,stroke:'#ececee'}));
 S.push(ringGauge(40,y+26,9.5,pct));
 S.push(t(60,y+31,label,{size:13,weight:600}));
 S.push(t(287,y+32,pct+'%',{size:15,weight:600,anchor:'end'}));
 S.push(segmented(30,y+48,256,12,{count:20,filled:Math.floor(pct/5),partial:(pct%5)/5}));
 S.push(line(30,y+76,286,y+76,{stroke:'#dcdce0'}));
 S.push(r(283,y+70,2,13,{fill:'#3f3f46',rx:1}));
 S.push(t(30,y+90,reset,{size:12,fill:C.muted}));
 return S.join('');
}
function quotaPanel(){
 const W=315,H=300,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(16,32,'Antigravity · gemini-4-neon',{size:13,weight:600}));
 S.push(t(299,32,'Google账号',{size:12.5,fill:C.muted,anchor:'end'}));
 S.push(quotaCardNative(46,'5小时',D.quota.five,'4小时56分后重置'));
 S.push(quotaCardNative(154,'周额度',D.quota.week,'4天23小时后重置'));
 S.push(line(16,262,299,262,{stroke:'#ededef'}));
 S.push(t(299,288,'全部额度',{size:12.5,weight:500,anchor:'end'}));
 return {body:S.join(''),w:W,h:H};
}
const PICKERS={
 antigravity:{heading:'4 Neon',rows:[
  {name:'Gemini 4 Neon',badge:'40%',fav:true},{name:'Gemini 4 Carbon',badge:'40%'},{name:'Gemini 4 Argon',badge:'40%'},
  {name:'Gemini 4 Hydrogen',badge:'40%'},{name:'Orchestrator (Neon)',badge:'40%'},{name:'Orchestrator (Carbon)',badge:'40%'},
  {name:'Orchestrator (Argon)',badge:'40%'},{name:'Gemini 3.8 Flash',badge:'40%'},{name:'Claude Opus 5.5',badge:'40%'}]},
 codex:{heading:'GPT-6.2-Sol',rows:[
  {name:'GPT-6.2-Sol'},{name:'GPT-6.2-Astra'},{name:'GPT-6.1 Terra'},{name:'GPT-6.1-Sol'},{name:'GPT-6-Astra'},
  {name:'GPT-6-Sol'},{name:'GPT-6-Luna'},{name:'GPT-5.6-Sol'},{name:'GPT-5.6-Terra'}]}
};
function pickerPanel(provider='antigravity'){
 const data=PICKERS[provider],rows=data.rows;
 const W=500,H=392,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(line(42,8,42,H-8,{stroke:'#ededef'}));
 S.push(star(14,18,0.8));
 S.push(openai(13,54,0.82));
 S.push(antigravity(13,92,0.9));
 S.push(r(42,provider==='antigravity'?88:50,2.5,30,{fill:'#3b82f6',rx:1.5}));
 S.push(search(56,16,0.62));
 S.push(t(76,26,'搜索模型...',{size:12.5,fill:C.faint}));
 S.push(line(52,40,340,40,{stroke:'#2b7fff',sw:1.6}));
 rows.forEach((row,i)=>{
  const y=64+i*30;
  if(provider==='codex')S.push(openai(56,y-13,0.62));
  else S.push(antigravity(56,y-13,0.72));
  S.push(t(82,y,row.name,{size:13}));
  if(i===0)S.push(`<g transform="translate(226 ${y-9})"><path d="M2 7l3.4 3.4L11 3" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  if(row.badge){S.push(r(248,y-11,38,17,{fill:'#fffdf7',rx:5,stroke:C.amberBorder}));S.push(t(267,y+1,row.badge,{size:10.5,fill:C.amberText,weight:600,anchor:'middle'}));}
  if(row.fav)S.push(star(312,y-8,0.55,'#f59e0b'));
  else S.push(`<g transform="translate(304 ${y-8}) scale(0.55)"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" fill="none" stroke="#c3c3ca" stroke-width="1.6"/></g>`);
  S.push(r(334,y-11,42,17,{fill:C.hover,rx:5}));
  S.push(t(355,y+1,'Ctrl+'+(i+1),{size:10,fill:C.muted,anchor:'middle'}));
 });
 S.push(line(392,8,392,H-8,{stroke:'#ededef'}));
 S.push(t(404,26,'Thinking',{size:12,fill:C.muted}));
 S.push(t(404,40,'Level',{size:12,fill:C.muted}));
 for(const [i,label] of ['Low','Medium','High','Extra'].entries()){
  const y=76+i*28;S.push(t(404,y,label,{size:13}));
  if(label==='High')S.push(check(474,y-11,0.55));
 }
 S.push(r(384,60,3,H-72,{fill:'#f1f1f3',rx:1.5}));
 S.push(r(384,60,3,230,{fill:'#d9d9de',rx:1.5}));
 return {body:S.join(''),w:W,h:H};
}
// ---------------- usage pages ----------------
function usageShell(active){
 const W=1600,H=880,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${r(30,20,1540,840,{fill:'#ffffff',rx:14,stroke:'#ececee'})}</g>`);
 S.push(t(56,60,'用量',{size:13,weight:500}));
 S.push(t(94,60,'/',{size:13,fill:C.faint}));
 S.push(t(110,60,'所有环境',{size:13,fill:'#3f3f46'}));
 S.push(chevron(174,52,0.8,C.muted));
 S.push(t(196,60,'/',{size:13,fill:C.faint}));
 S.push(t(212,60,'2 个提供方',{size:13,fill:'#3f3f46'}));
 S.push(chevron(296,52,0.8,C.muted));
 if(active!=='限制'){
  S.push(r(876,42,306,32,{fill:'#f4f4f5',rx:9}));
  S.push(r(879,45,102,26,{fill:'#ffffff',rx:7}));
  S.push(t(930,63,'过去 24 小时',{size:12.5,anchor:'middle'}));
  S.push(t(1016,63,'7 天',{size:12.5,fill:C.muted,anchor:'middle'}));
  S.push(t(1072,63,'30 天',{size:12.5,fill:C.muted,anchor:'middle'}));
  S.push(t(1136,63,'90 天',{size:12.5,fill:C.muted,anchor:'middle'}));
 }
 S.push(r(1196,42,186,32,{fill:'#f4f4f5',rx:9}));
 ['费用','token','限制'].forEach((label,i)=>{
  const x=1199+i*61,w=57;
  if(label===active){S.push(r(x,45,w,26,{fill:'#ffffff',rx:7}));S.push(t(x+w/2,63,label,{size:12.5,anchor:'middle'}));}
  else S.push(t(x+w/2,63,label,{size:12.5,fill:C.muted,anchor:'middle'}));
 });
 S.push(r(1396,42,112,32,{fill:'#f4f4f5',rx:9}));
 S.push(r(1399,45,52,26,{fill:'#ffffff',rx:7}));
 S.push(t(1425,63,'¥ CNY',{size:12.5,anchor:'middle'}));
 S.push(t(1479,63,'$ USD',{size:12.5,fill:C.muted,anchor:'middle'}));
 S.push(`<path d="M1528 52a9 9 0 1 1 3 7" fill="none" stroke="${C.muted}" stroke-width="1.5"/><path d="M1526 48l5 1-1 5" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`);
 S.push(`<path d="M1556 52l12 12M1568 52l-12 12" stroke="#5b5b60" stroke-width="1.6" stroke-linecap="round"/>`);
 S.push(line(30,96,1570,96,{stroke:'#ededef'}));
 return {head:S.join(''),W,H};
}
function quotaCardPage(x,y,w,c){
 const S=[];
 S.push(r(x,y,w,150,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(x+20,y+30,c.title,{size:13.5,weight:500}));
 S.push(t(x+20,y+64,c.pct+'%',{size:22,weight:600}));
 S.push(t(x+20+(c.pct===100?65:51),y+63,'剩余',{size:12.5,fill:C.muted}));
 if(c.pct<100)S.push(`<path d="M${x+122} ${y+54}l4-4 4 4M${x+122} ${y+58}l6-5 6 5" fill="none" stroke="${C.faint}" stroke-width="1.3"/>`);
 S.push(r(x+20,y+78,w-40,14,{fill:'#d4ceec',rx:7}));
 S.push(r(x+20+40,y+78,Math.max(4,(w-80)*c.pct/100-40),14,{fill:'#d4ceec'}));
 S.push(r(x+20,y+78,(w-40)*c.pct/100,14,{fill:'#d4ceec',rx:7}));
 if(c.striped)S.push(`<path d="M${x+26+(w-40)*c.pct/100} ${y+91}l16-13M${x+38+(w-40)*c.pct/100} ${y+91}l13-10M${x+52+(w-40)*c.pct/100} ${y+91}l10-8M${x+64+(w-40)*c.pct/100} ${y+91}l7-6" stroke="#ffffff" stroke-width="2.4"/>`);
 S.push(t(x+w/2,y+89,'1',{size:10.5,fill:'#3f3f46',anchor:'middle'}));
 S.push(r(x+w-32,y+72,2,26,{fill:'#3f3f46',rx:1}));
 S.push(r(x+20,y+102,13,13,{fill:'#e6e2f4',rx:3}));
 S.push(t(x+26.5,y+112,'1',{size:9,fill:'#5b4f8a',anchor:'middle'}));
 S.push(t(x+40,y+113,'Antigravity '+c.pct+'%',{size:12.5}));
 if(c.reset)S.push(clock(x+w-104,y+102,0.72,C.faint)+t(x+w-20,y+113,c.reset,{size:12,fill:C.muted,anchor:'end'}));
 S.push(t(x+20,y+140,c.note,{size:12.5}));
 return S.join('');
}
function chartBlock(x,y,w,h,labels,color='#8b5cf6'){
 const S=[];const pts=[0.12,0.42,0.2,0.5,0.3,0.62,0.24,0.72,0.34,0.9,0.52,0.44,0.2,0.08,0.14];
 for(const [i,label] of labels.entries()){
  const ly=y+i*h/(labels.length-1);S.push(t(x-12,ly+4,label,{size:10.5,fill:C.faint,anchor:'end'}));S.push(line(x,ly,x+w,ly,{stroke:'#f1f1f3'}));
 }
 const step=w/(pts.length-1),path=pts.map((v,i)=>`${i?'L':'M'}${(x+i*step).toFixed(1)} ${(y+h-v*h).toFixed(1)}`).join(' ');
 S.push(`<path d="${path} L${x+w} ${y+h} L${x} ${y+h} Z" fill="${color}" opacity="0.16"/>`);
 S.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`);
 S.push(t(x,y+h+22,'07:00时',{size:10.5,fill:C.faint}));
 S.push(t(x+w/2,y+h+22,'19:00时',{size:10.5,fill:C.faint,anchor:'middle'}));
 S.push(t(x+w,y+h+22,'06:00时',{size:10.5,fill:C.faint,anchor:'end'}));
 return S.join('');
}
function usageBody(kind){
 const d=kind==='费用'?D.cost:D.token;const S=[];
 S.push(t(56,196,d.total,{size:44,weight:600}));
 S.push(t(56,222,d.sessions+' · API 估算',{size:12,fill:C.muted}));
 S.push(t(56,272,'ChatGPT 共享用量',{size:12.5,fill:C.muted}));
 S.push(t(736,272,'管理用量 ↗',{size:12,fill:'#3f3f46',anchor:'end'}));
 S.push(dot(64,300,'#8b5cf6')+antigravity(74,288,0.66));
 S.push(t(96,304,'Antigravity  '+d.sessions,{size:12.5}));
 S.push(t(736,304,d.total,{size:12.5,anchor:'end'}));
 S.push(t(96,324,'占'+(kind==='费用'?'费用':'token')+'的 100.0% · '+(kind==='费用'?'96M token':'¥318.20'),{size:11,fill:C.muted}));
 S.push(t(800,160,d.chart,{size:12.5,fill:'#3f3f46'}));
 S.push(chartBlock(840,180,560,180,d.y));
 for(const [i,[label,value]] of d.totals.entries()){const x=56+i*136;S.push(t(x,400,label,{size:11.5,fill:C.muted}));S.push(t(x,424,value,{size:14,weight:500}));}
 S.push(t(56,470,'按类型统计的'+(kind==='费用'?'费用':' token'),{size:12.5,fill:'#3f3f46'}));
 S.push(r(56,486,684,12,{fill:'#e9e9eb',rx:4}));
 let cx=56;for(const [,label,ratio] of d.parts){S.push(r(cx,486,684*ratio-2,12,{fill:cx===56?'#a1a1aa':(cx<300?'#c9c9d1':'#3f3f46')}));cx+=684*ratio;}
 let lx=56;for(const [label,value] of d.parts){S.push(dot(lx+4,520,lx===56?'#a1a1aa':'#b9b9c2')+t(lx+14,524,label+' '+value,{size:11.5,fill:C.muted}));lx+=180;}
 S.push(t(56,566,'明细',{size:12.5,weight:500}));
 S.push(r(620,546,124,28,{fill:'#f4f4f5',rx:8}));
 S.push(r(623,549,58,22,{fill:'#ffffff',rx:6}));
 S.push(t(652,564,'模型',{size:11.5,anchor:'middle'}));
 S.push(t(710,564,'小时',{size:11.5,fill:C.muted,anchor:'middle'}));
 S.push(t(56,606,'#',{size:11,fill:C.muted})+t(84,606,'模型',{size:11,fill:C.muted}));
 S.push(t(596,606,'费用',{size:11,fill:C.muted,anchor:'end'})+t(664,606,'占比',{size:11,fill:C.muted,anchor:'end'})+t(744,606,'token',{size:11,fill:C.muted,anchor:'end'}));
 S.push(line(56,616,744,616,{stroke:'#ededef'}));
 d.rows.forEach(([name,cost,share,tokens],i)=>{
  const y=644+i*36;
  S.push(t(56,y,String(i+1),{size:12,fill:C.muted})+antigravity(78,y-12,0.62)+t(102,y,name,{size:12.5}));
  S.push(t(596,y,cost,{size:12.5,anchor:'end',fill:cost==='未定价'?C.muted:C.text})+t(664,y,share,{size:12.5,anchor:'end'})+t(744,y,tokens,{size:12.5,anchor:'end'}));
 });
 return S.join('');
}
function limitsBody(){
 const S=[];const cards=D.limits;
 S.push(antigravity(56,112,0.86));
 S.push(t(84,127,'Antigravity',{size:13.5,weight:600}));
 S.push(quotaCardPage(56,142,660,cards[0]));
 S.push(quotaCardPage(736,142,660,cards[1]));
 S.push(quotaCardPage(56,310,660,cards[2]));
 S.push(quotaCardPage(736,310,660,cards[3]));
 S.push(r(56,478,1340,116,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(openai(76,512,0.95));
 S.push(t(116,516,'ChatGPT usage',{size:13.5,weight:500}));
 S.push(t(116,540,'DESKTOP-DEMO 上的 Codex',{size:12.5,fill:C.muted}));
 S.push(t(116,562,'用已连接的账户在 ChatGPT 中查看用量。',{size:12,fill:C.muted}));
 S.push(t(1376,540,'管理用量 ↗',{size:12.5,fill:'#3f3f46',anchor:'end'}));
 return S.join('');
}
// ---------------- legend helpers ----------------
function legendRows(items,x,panelRight){
 const S=[];
 for(const [n,title,desc,y] of items){
  if(panelRight!=null)S.push(line(panelRight+6,y-4,x-16,y-4,{stroke:'#d8d8de',sw:1,dash:'2 3'}),dot(panelRight+6,y-4,'#c7c7cd'));
  S.push(callout(n,x,y-4));
  S.push(t(x+20,y,title,{size:13.5,weight:600}));
  S.push(t(x+20,y+19,desc,{size:11.5,fill:C.muted}));
 }
 return S.join('');
}
// ---------------- hero scenes ----------------
function heroOverview(){
 const W=1600,H=900,S=[darkCanvas(W,H)];
 const win=windowNative();
 S.push(`<g filter="url(#hero)">${r(560,96,1000,540,{fill:'#ffffff',rx:12})}</g>`);
 S.push(`<g clip-path="url(#winclip)">${group(560,96,0.52,win.body)}</g>`);
 S.push(`<defs><clipPath id="winclip"><rect x="560" y="96" width="1000" height="540" rx="12"/></clipPath></defs>`);
 S.push(r(72,150,60,4,{fill:'#2b7fff',rx:2}));
 S.push(t(72,222,'T3 Code',{size:16,fill:'#93c5fd',weight:600,spacing:2}));
 S.push(t(72,300,'精简额度栏',{size:64,weight:700,fill:'#ffffff'}));
 S.push(t(72,368,'中文上下文 · 费用货币',{size:34,weight:600,fill:'#e4e4e7'}));
 S.push(t(72,418,'T3 Code 0.1.12 固定构建 · 只改 10 个前端文件',{size:16,fill:'#8b8b98'}));
 const chips=[['一行底栏','上下文 / 轮次 / 缓存 / 额度'],['原生控件','模型选择器与用量页'],['可逆安装','哈希门禁 + 原版备份']];
 chips.forEach(([title,desc],i)=>{
  const y=470+i*78;
  S.push(r(72,y,420,60,{fill:'#ffffff',rx:10,opacity:0.06}));
  S.push(r(72,y,3,60,{fill:i===0?'#2b7fff':i===1?'#fe9a00':'#8b5cf6',rx:1.5}));
  S.push(t(96,y+26,title,{size:16,weight:600,fill:'#ffffff'}));
  S.push(t(96,y+46,desc,{size:12,fill:'#9a9aa8'}));
 });
 S.push(t(72,860,'演示数据 · 非真实项目 / 账号 / 会话',{size:11.5,fill:'#6b6b78'}));
 return svg(W,H,DEFS+S.join(''),{title:'T3 Code 精简额度栏 · 总览主图',desc:'深色主图：真实窗口中的精简底栏与原生控件。演示数据。'});
}
function heroStrip(){
 const W=1600,H=900,S=[darkCanvas(W,H)];
 const composer=composerNative(),ctx=contextPanel(),quo=quotaPanel();
 S.push(t(72,110,'一行看完',{size:52,weight:700,fill:'#ffffff'}));
 S.push(t(72,156,'上下文 · 轮次 · 工具 · 速度 · 缓存 · 5 小时与周额度',{size:19,fill:'#a1a1aa'}));
 // composer first (bottom), popovers above it
 S.push(`<g filter="url(#hero)">${r(416,676,768,232,{fill:'#ffffff',rx:14})}</g>`);
 S.push(`<g clip-path="url(#cclip)">${group(416,676,1.04,composer.body)}</g>`);
 S.push(`<defs><clipPath id="cclip"><rect x="416" y="676" width="768" height="232" rx="14"/></clipPath></defs>`);
 S.push(`<g filter="url(#hero)">${group(212,286,1.2,ctx.body)}</g>`);
 S.push(`<g filter="url(#hero)">${group(824,214,1.2,quo.body)}</g>`);
 S.push(line(336,630,470,676,{stroke:'#2b7fff',sw:1.5,dash:'5 4'}));
 S.push(line(1000,574,1010,676,{stroke:'#fe9a00',sw:1.5,dash:'5 4'}));
 S.push(r(212,650,150,28,{fill:'#ffffff',rx:14,opacity:0.09}));
 S.push(t(287,669,'点“上下文”',{size:12,fill:'#d4d4d8',anchor:'middle'}));
 S.push(r(1176,650,150,28,{fill:'#ffffff',rx:14,opacity:0.09}));
 S.push(t(1251,669,'点“周额度”',{size:12,fill:'#d4d4d8',anchor:'middle'}));
 S.push(t(72,860,'演示数据 · 非真实项目 / 账号 / 会话',{size:11.5,fill:'#6b6b78'}));
 return svg(W,H,DEFS+S.join(''),{title:'底栏与两个面板 · 主图',desc:'深色主图：底栏一行与上下文、额度两个弹层。演示数据。'});
}
function heroUsage(){
 const W=1600,H=900,S=[darkCanvas(W,H)];
 const limits=usageShell('限制'),cost=usageShell('费用');
 S.push(t(72,104,'用量：限制 / 费用',{size:44,weight:700,fill:'#ffffff'}));
 S.push(t(72,142,'同一份原生数据，三个标签页，货币可切换',{size:17,fill:'#9a9aa8'}));
 S.push(`<g filter="url(#hero)">${r(56,190,724,470,{fill:'#ffffff',rx:12})}</g>`);
 S.push(`<g clip-path="url(#lclip)">${group(56,190,0.47,limits.head+'<g>'+limitsBody()+'</g>')}</g>`);
 S.push(`<defs><clipPath id="lclip"><rect x="56" y="190" width="724" height="470" rx="12"/></clipPath></defs>`);
 S.push(`<g filter="url(#hero)">${r(816,190,728,470,{fill:'#ffffff',rx:12})}</g>`);
 S.push(`<g clip-path="url(#cclip)">${group(816,190,0.474,cost.head+'<g>'+usageBody('费用')+'</g>')}</g>`);
 S.push(`<defs><clipPath id="cclip"><rect x="816" y="190" width="728" height="470" rx="12"/></clipPath></defs>`);
 S.push(r(56,700,120,28,{fill:'#ffffff',rx:14,opacity:0.09}));
 S.push(t(116,719,'限制',{size:12,fill:'#d4d4d8',anchor:'middle'}));
 S.push(r(816,700,120,28,{fill:'#ffffff',rx:14,opacity:0.09}));
 S.push(t(876,719,'费用',{size:12,fill:'#d4d4d8',anchor:'middle'}));
 S.push(r(72,772,232,34,{fill:'#ffffff',rx:17,opacity:0.08}));
 S.push(t(188,794,'共享池原样保留',{size:12.5,fill:'#d4d4d8',anchor:'middle'}));
 S.push(r(320,772,232,34,{fill:'#ffffff',rx:17,opacity:0.08}));
 S.push(t(436,794,'未定价模型保留原文',{size:12.5,fill:'#d4d4d8',anchor:'middle'}));
 S.push(r(568,772,232,34,{fill:'#ffffff',rx:17,opacity:0.08}));
 S.push(t(684,794,'¥ CNY / $ USD',{size:12.5,fill:'#d4d4d8',anchor:'middle'}));
 S.push(t(72,860,'演示数据 · 非真实项目 / 账号 / 会话',{size:11.5,fill:'#6b6b78'}));
 return svg(W,H,DEFS+S.join(''),{title:'用量页 · 主图',desc:'深色主图：限制页与费用页并排。演示数据。'});
}
// ---------------- overview map ----------------
function overviewMap(){
 const W=1600,H=1020,S=[];const ctx=contextPanel(),quo=quotaPanel(),pick=pickerPanel(),comp=composerNative();
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(t(56,64,'五处入口，一张图看完',{size:26,weight:700}));
 S.push(t(56,94,'底栏在输入框最下方一行；点两侧的入口分别展开面板，点“全部额度”进入用量页。',{size:13,fill:C.muted}));
 const tile=(x,y,w,h,n,title,caption,body)=>{
  const out=[`<g filter="url(#sh)">${r(x,y,w,h,{fill:'#ffffff',rx:16,stroke:'#ececee'})}</g>`];
  out.push(callout(n,x+28,y+28));
  out.push(t(x+48,y+32,title,{size:13.5,weight:600}));
  out.push(t(x+48,y+h-16,caption,{size:10.5,fill:C.faint}));
  out.push(body);
  return out.join('');
 };
 S.push(tile(56,130,470,320,'1','底栏（输入框底部）','点“上下文”或右侧额度',group(74,200,0.6,comp.body)));
 S.push(tile(566,130,460,470,'2','点“上下文”','展开在输入框上方，Esc 关闭',group(590,196,0.95,ctx.body)));
 S.push(tile(1066,130,478,470,'3','点模型按钮','原生选择器；每行显示所属池剩余',group(1086,196,0.86,pick.body)));
 S.push(tile(566,640,460,320,'4','点“周额度”','两个窗口各一张卡片',group(600,706,0.82,quo.body)));
 const mini=[];
 mini.push(r(1086,700,438,220,{fill:'#ffffff',rx:10,stroke:'#ececee'}));
 mini.push(t(1102,728,'用量  /  所有环境  /  2 个提供方',{size:10,fill:C.muted}));
 mini.push(line(1086,742,1524,742,{stroke:'#ededef'}));
 mini.push(t(1102,766,'Gemini · 5-hour',{size:11,weight:500}));
 mini.push(t(1102,792,'93%',{size:17,weight:600}));
 mini.push(r(1102,804,380,9,{fill:'#d4ceec',rx:4.5}));
 mini.push(t(1102,834,'Gemini · Weekly',{size:11,weight:500}));
 mini.push(t(1102,860,'40%',{size:17,weight:600}));
 mini.push(r(1102,872,380,9,{fill:'#d4ceec',rx:4.5}));
 mini.push(t(1102,900,'费用 / token / 限制 · ¥ CNY / $ USD',{size:10,fill:C.muted}));
 S.push(tile(1066,640,478,320,'5','点“全部额度” → 用量页','限制 / 费用 / token 共用同一份数据',mini.join('')));
 S.push(r(56,470,470,490,{fill:'#f9f9fb',rx:16,stroke:'#ececee'}));
 S.push(t(84,514,'阅读顺序',{size:13.5,weight:600}));
 const steps=['底栏一行：上下文 / 轮次 / 缓存 / 额度','点“上下文” → 上下文面板','点“周额度” → 额度面板（两个窗口）','点模型按钮 → 原生模型选择器','点“全部额度” → 用量页；点“费用”切货币'];
 steps.forEach((step,i)=>{S.push(callout(String(i+1),96,556+i*74));S.push(t(120,560+i*74,step,{size:11.5,fill:'#3f3f46'}));});
 S.push(t(56,986,'示意图：演示数据；原生控件与原生页面，新增的只是入口与中文标签。',{size:10.5,fill:C.faint}));
 return svg(W,H,DEFS+S.join(''),{title:'全部入口总览',desc:'底栏、上下文、额度、模型选择器与用量页的总览图。'});
}
// ---------------- detail scenes ----------------
function detailComposer(){
 const W=1500,H=720,S=[];const comp=composerNative();
 const k=1.3,x0=70,y0=64;
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${r(40,30,1030,300,{fill:'#ffffff',rx:16,stroke:'#ececee'})}</g>`);
 S.push(group(x0,y0,k,comp.body));
 const tick=(n,x)=>{const from=y0+202*k+6,to=y0+202*k+20;S.push(line(x,from,x,to,{stroke:'#c7c7cd',sw:1,dash:'3 3'}),callout(n,x,to+16));};
 tick('1',x0+24*k);tick('2',x0+300*k);tick('3',x0+470*k);tick('4',x0+640*k);
 const items=[
  ['1','上下文入口','点开上下文面板：已用 / 已缓存 / 未缓存 / 剩余空间 / 缓存命中。',60,470],
  ['2','轮次 · 工具 · 速度','本轮轮数、工具调用次数与输出速度（词元/秒）。',60,556],
  ['3','词元与缓存','会话累计词元与缓存命中率，与轮次统计用竖线分隔。',760,470],
  ['4','5 小时 / 周额度','两个窗口各一个入口；点开额度面板可看分段条与重置时间。',760,556]
 ];
 for(const [n,title,desc,x,y] of items){S.push(callout(n,x+11,y-4));S.push(t(x+30,y,title,{size:13,weight:600}));S.push(t(x+30,y+19,desc,{size:11.5,fill:C.muted}));}
 S.push(t(40,H-16,'示意数据；实际数值随会话变化，缺失时不补造。',{size:10.5,fill:C.faint}));
 return svg(W,H,DEFS+S.join(''),{title:'底栏放大（四个区域）',desc:'底栏一行内的四个区域与点击结果。'});
}
function detailContext(){
 const {body,w,h}=contextPanel();const k=1.55;const W=1240,H=560,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${group(56,44,k,body)}</g>`);
 const right=56+w*k;
 S.push(legendRows([
  ['1','标题与已用','“上下文”固定标题；已用百分比与 已用/上限。',96],
  ['2','分段条','蓝＝已缓存，橙＝未缓存，灰＝剩余空间。',150],
  ['3','图例与数值','每类词元绝对量与占比，口径与上游一致。',250],
  ['4','剩余与压缩','剩余空间；达到阈值时显示压缩预留。',332],
  ['5','缓存命中与轮次','最近一轮与会话命中率，底部为轮次与工具。',432]
 ],648,right));
 return svg(W,H,DEFS+S.join(''),{title:'上下文面板',desc:'上下文面板的五个区域说明。'});
}
function detailQuota(){
 const {body,w,h}=quotaPanel();const k=1.42;const W=1240,H=640,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${group(56,36,k,body)}</g>`);
 const right=56+w*k;
 S.push(legendRows([
  ['1','提供方 · 模型','实例与模型始终成对；换模型立刻换额度来源。',88],
  ['2','账号归属','额度所属账号，不与其他提供商混排。',126],
  ['3','5 小时窗口','原生 5 小时窗口与重置倒计时。',210],
  ['4','分段条与刻度','每格 5%，右侧刻度标记当前剩余。',300],
  ['5','周额度窗口','同一账号的周额度与重置倒计时。',360],
  ['6','全部额度','进入用量页“限制”，查看全部提供商与共享池。',520]
 ],636,right));
 return svg(W,H,DEFS+S.join(''),{title:'额度面板（5 小时 + 周额度）',desc:'额度面板的六个区域说明。'});
}
function detailPicker(){
 const a=pickerPanel('antigravity'),c=pickerPanel('codex');const W=1600,H=620,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(t(40,64,'同一个选择器，两个提供方',{size:20,weight:700}));
 S.push(t(40,92,'提供商之间不会混排：切到哪个提供方，就只显示该提供方的模型。',{size:12.5,fill:C.muted}));
 S.push(t(40,128,'Antigravity · 每行显示所属池剩余额度',{size:12,weight:600,fill:'#3f3f46'}));
 S.push(`<g filter="url(#sh)">${group(40,142,1,a.body)}</g>`);
 S.push(t(560,128,'Codex · 上游未返回额度，不做标记',{size:12,weight:600,fill:'#3f3f46'}));
 S.push(`<g filter="url(#sh)">${group(560,142,1,c.body)}</g>`);
 S.push(legendRows([
  ['1','收藏与搜索','顶部固定收藏位；搜索框按名称过滤。',156],
  ['2','提供商栏','收藏 / Codex / Antigravity，选中项有蓝色指示条。',214],
  ['3','每模型额度','Antigravity 行显示所属池剩余；偏低时转为琥珀色。',272],
  ['4','不一致不补造','Codex 没有额度数据时不显示任何百分比。',330],
  ['5','快捷键与强度','Ctrl+1…9 直接切换，右侧保留原生 Thinking Level。',388]
 ],1080,null));
 return svg(W,H,DEFS+S.join(''),{title:'模型选择器（两个提供方对照）',desc:'Antigravity 有每模型额度，Codex 没有；两边不混排。'});
}
function detailLimits(){
 const {head,W,H}=usageShell('限制');const S=[head,limitsBody()];
 S.push(legendRows([
  ['1','提供商分组','按提供商分组；共享池以 shared 原样标注。',664],
  ['2','双窗口','5 小时与周额度各自一张卡片。',708],
  ['3','刻度与估算','右侧刻度标记剩余；下方是原生速度估算。',752]
 ],60,null));
 S.push(legendRows([
  ['4','账号与时间','卡片内标注账号名与实际重置时间。',664],
  ['5','用量页入口','页头保留标签页与货币切换。',708]
 ],800,null));
 return svg(W,H,DEFS+S.join(''),{title:'用量页 · 限制',desc:'限制页的五个区域说明。'});
}
function detailUsage(kind,file,title,notes){
 const {head,W,H}=usageShell(kind);const S=[head,usageBody(kind)];
 S.push(legendRows(notes,800,null));
 return svg(W,H,DEFS+S.join(''),{title,desc:title+' 的区域说明。'});
}
function detailFlow(){
 const W=1600,H=1000,S=[];const comp=composerNative(),ctx=contextPanel(),quo=quotaPanel(),pick=pickerPanel();
 S.push(r(0,0,W,H,{fill:'#fcfcfc'}));
 S.push(t(56,64,'点击路径：每一处都能打开、关闭并返回',{size:24,weight:600}));
 S.push(t(56,92,'弹层在输入框上方展开，Esc 或点击空白关闭；用量页是原生路由，可返回原会话。',{size:12.5,fill:C.muted}));
 const tile=(x,y,w,h,n,title,body)=>{
  const out=[`<g filter="url(#sh)">${r(x,y,w,h,{fill:'#ffffff',rx:14,stroke:'#ececee'})}</g>`];
  out.push(callout(n,x+26,y+26));out.push(t(x+44,y+30,title,{size:12.5,weight:600}));
  out.push(body);return out.join('');
 };
 S.push(tile(56,140,420,220,'1','底栏',group(96,206,0.42,comp.body)));
 S.push(tile(560,140,470,330,'2','点“上下文”',group(600,160,0.95,ctx.body)));
 S.push(tile(1104,140,440,330,'3','点模型按钮',group(1124,150,0.8,pick.body)));
 S.push(tile(560,510,470,430,'4','点“周额度”',group(600,560,1,quo.body)));
 const mini=[];
 mini.push(r(1124,560,398,330,{fill:'#ffffff',rx:10,stroke:'#ececee'}));
 mini.push(t(1140,590,'用量  /  所有环境  /  2 个提供方',{size:9.5,fill:C.muted}));
 mini.push(line(1124,604,1522,604,{stroke:'#ededef'}));
 mini.push(t(1140,630,'Gemini · 5-hour',{size:10.5,weight:500}));
 mini.push(t(1140,660,'93%',{size:18,weight:600}));
 mini.push(r(1140,674,368,10,{fill:'#d4ceec',rx:5}));
 mini.push(t(1140,706,'Gemini · Weekly',{size:10.5,weight:500}));
 mini.push(t(1140,736,'40%',{size:18,weight:600}));
 mini.push(r(1140,750,368,10,{fill:'#d4ceec',rx:5}));
 mini.push(t(1140,782,'Claude & GPT (shared) · 5-hour',{size:10.5,weight:500}));
 mini.push(t(1140,812,'100%',{size:18,weight:600}));
 mini.push(r(1140,826,368,10,{fill:'#d4ceec',rx:5}));
 mini.push(t(1140,862,'费用 / token / 限制 · ¥ CNY / $ USD',{size:9,fill:C.muted}));
 S.push(tile(1104,510,440,430,'5','点“全部额度” → 用量页',mini.join('')));
 const arrow=(x1,y1,x2,y2,label,lx,ly)=>{const S2=[`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#b9b9c2" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>`,`<path d="M${x2} ${y2}l-7-3 1 7z" fill="#b9b9c2"/>`];if(label)S2.push(t(lx,ly,label,{size:11,fill:C.muted,anchor:'middle'}));return S2.join('');};
 S.push(arrow(478,250,554,250,'点“上下文”',516,232));
 S.push(arrow(1032,250,1100,250,'点模型',1066,232));
 S.push(arrow(795,472,795,506,'点“周额度”',795,492));
 S.push(arrow(1032,700,1100,700,'点“全部额度”',1066,682));
 S.push(t(56,966,'示意图：演示数据；原生控件、原生页面，新增的只是入口与中文标签。',{size:10.5,fill:C.faint}));
 return svg(W,H,DEFS+S.join(''),{title:'点击路径总览',desc:'底栏、两个弹层、模型选择器与用量页的点击路径。'});
}

const scenes=new Map([
 ['hero-overview',heroOverview()],
 ['hero-strip',heroStrip()],
 ['hero-usage',heroUsage()],
 ['overview-map',overviewMap()],
 ['detail-composer',detailComposer()],
 ['detail-context',detailContext()],
 ['detail-quota',detailQuota()],
 ['detail-picker',detailPicker()],
 ['detail-limits',detailLimits()],
 ['detail-cost',detailUsage('费用','detail-cost','用量页 · 费用',[
   ['1','费用与货币','¥ CNY / $ USD 只改显示，不改统计。',520],
   ['2','图表刻度','纵轴随货币格式化，横轴保留原生时间。',584],
   ['3','统计口径','处理的 token、缓存输入、未缓存输入、输出与节省。',648],
   ['4','类型占比','输入 / 缓存读取 / 输出三段比例。',712],
   ['5','明细表','模型 / 小时两种视图；未定价模型保留原文。',776]
 ])],
 ['detail-token',detailUsage('token','detail-token','用量页 · token',[
   ['1','token 总量','同一周期的 token 总量与会话数。',520],
   ['2','图表','每小时处理的 token 曲线。',584],
   ['3','统计口径','缓存输入通常占大头，未缓存与输出分开。',648],
   ['4','类型占比','按输入 / 缓存读取 / 输出拆分。',712],
   ['5','明细表','按模型或小时查看，未定价模型保留原文。',776]
 ])],
 ['detail-flow',detailFlow()]
]);
for(const [name,markup] of scenes)fs.writeFileSync(path.join(OUT,name+'.svg'),markup+'\n');
console.log(JSON.stringify({written:[...scenes.keys()]},null,2));
