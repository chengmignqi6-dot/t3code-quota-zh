// Vector illustrations rebuilt from measured native UI geometry and sampled colors.
// Demo data only: no project names, accounts, paths, or conversation content.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {C,FONT,MONO,t,r,line,svg,bar,segmented,antigravity,openai,star,check,clock,search,paperclip,chevron,callout,dot,shadowFilter,footerNative} from './showcase-lib.mjs';
const OUT=fileURLToPath(new URL('../../docs/showcase',import.meta.url));
fs.mkdirSync(OUT,{recursive:true});
const scenes=new Map();
const group=(x,y,k,body)=>`<g transform="translate(${x} ${y}) scale(${k})">${body}</g>`;
const DEFS=`<defs>${shadowFilter}</defs>`;

// ---------- native panels ----------
function contextPanel(){
 const S=[];const W=270,H=272;
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(14,30,'上下文',{size:13,fill:'#3f3f46'}));
 S.push(t(14,64,'已用45%',{size:18,weight:600}));
 S.push(t(256,63,'476k / 1m',{size:12.5,fill:C.muted,anchor:'end',mono:true}));
 S.push(bar(14,80,242,8,{segments:[{w:107,fill:C.blue},{w:7,fill:C.orange}]}));
 for(const [y,color,label,value,pct,fill] of [[120,'#2b7fff','已缓存','467k','45%',C.text],[152,'#fe9a00','未缓存','8.9k','0.8%',C.text]]){
  S.push(r(16,y-9,10,10,{fill:color,rx:2.5}));
  S.push(t(36,y,label,{size:13,fill}));
  S.push(t(200,y,value,{size:12.5,anchor:'end',mono:true}));
  S.push(t(256,y,pct,{size:12,fill:C.muted,anchor:'end'}));
 }
 S.push(line(14,170,256,170,{stroke:'#ededef'}));
 S.push(r(16,187,10,10,{stroke:C.faint,sw:1.2,rx:2.5,fill:'none'}));
 S.push(t(36,197,'剩余空间',{size:13,fill:C.muted}));
 S.push(t(200,197,'572k',{size:12.5,fill:C.muted,anchor:'end',mono:true}));
 S.push(t(256,197,'55%',{size:12,fill:C.muted,anchor:'end'}));
 S.push(line(14,214,256,214,{stroke:'#ededef'}));
 S.push(t(14,240,'缓存命中',{size:12.5,fill:C.muted}));
 S.push(t(256,240,'会话95%',{size:11,fill:C.faint,anchor:'end'}));
 S.push(t(157,240,'最近98%',{size:12,fill:C.blue,weight:600,anchor:'end'}));
 S.push(t(196,240,'·',{size:11,fill:C.faint}));
 S.push(line(14,252,256,252,{stroke:'#f4f4f5'}));
 S.push(t(14,266,'10轮 · 工具114次',{size:11,fill:C.muted}));
 return {body:S.join(''),w:W,h:H};
}
function quotaPanel(){
 const S=[];const W=315,H=214;
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(16,32,'Antigravity · gemini-4-neon',{size:13,weight:600}));
 S.push(t(299,32,'Google账号',{size:12.5,fill:C.muted,anchor:'end'}));
 S.push(r(16,46,283,112,{fill:'#ffffff',rx:10,stroke:'#ececee'}));
 S.push(`<circle cx="40" cy="76" r="9.5" fill="none" stroke="${C.orange}" stroke-width="3.2" stroke-dasharray="45 15"/><circle cx="40" cy="76" r="3.4" fill="${C.orange}"/>`);
 S.push(t(60,81,'周额度',{size:13,weight:600}));
 S.push(t(287,82,'94%',{size:15,weight:600,anchor:'end'}));
 S.push(segmented(30,98,256,12,{count:20,filled:18,partial:0.8}));
 S.push(line(30,126,286,126,{stroke:'#dcdce0'}));
 S.push(r(283,120,2,13,{fill:'#3f3f46',rx:1}));
 S.push(t(30,146,'6天22小时后重置',{size:12,fill:C.muted}));
 S.push(line(16,172,299,172,{stroke:'#ededef'}));
 S.push(t(299,198,'全部额度',{size:12.5,weight:500,anchor:'end'}));
 return {body:S.join(''),w:W,h:H};
}
function pickerPanel(){
 const S=[];const W=424,H=236;
 S.push(r(0,0,W,H,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(line(42,8,42,H-8,{stroke:'#ededef'}));
 S.push(star(14,18,0.8));
 S.push(openai(14,56,0.78));
 S.push(antigravity(13,94,0.9));
 S.push(r(42,88,2.5,30,{fill:'#3b82f6',rx:1.5}));
 S.push(search(56,16,0.62));
 S.push(t(76,26,'搜索模型...',{size:12.5,fill:C.faint}));
 S.push(line(52,40,300,40,{stroke:'#2b7fff',sw:1.6}));
 const rows=[['Gemini 4 Hydro',true],['Gemini 3.8 Flash',false],['Claude Sonnet 4.6',false],['Claude Opus 4.6',false],['GPT-OSS 120B',false]];
 rows.forEach(([name,active],i)=>{
  const y=64+i*30;
  S.push(antigravity(56,y-13,0.72));
  S.push(t(82,y,name,{size:13}));
  if(active)S.push(check(188,y-11,0.55));
  S.push(r(210,y-11,38,17,{fill:'#ffffff',rx:5,stroke:'#e2e2e6'}));
  S.push(t(229,y+1,'94%',{size:10.5,fill:C.muted,anchor:'middle'}));
  S.push(r(258,y-11,40,17,{fill:C.hover,rx:5}));
  S.push(t(278,y+1,'Ctrl+'+(i+1),{size:10,fill:C.muted,anchor:'middle'}));
 });
 S.push(line(302,8,302,H-8,{stroke:'#ededef'}));
 S.push(t(314,26,'Thinking',{size:12,fill:C.muted}));
 S.push(t(314,40,'Level',{size:12,fill:C.muted}));
 for(const [i,label] of ['Low','Medium','High','Extra'].entries()){
  const y=78+i*30;S.push(t(314,y,label,{size:13}));
  if(label==='High')S.push(check(392,y-11,0.55));
 }
 return {body:S.join(''),w:W,h:H};
}
// ---------- legend with dashed leader lines ----------
function legendRows(items,x,panelRight){
 const S=[];
 for(const [n,title,desc,ly] of items){
  if(panelRight!=null)S.push(line(panelRight+6,ly-4,x-16,ly-4,{stroke:'#d8d8de',sw:1,dash:'2 3'}),dot(panelRight+6,ly-4,'#c7c7cd'));
  S.push(callout(n,x,ly-4));
  S.push(t(x+20,ly,title,{size:13.5,weight:600}));
  S.push(t(x+20,ly+19,desc,{size:11.5,fill:C.muted}));
 }
 return S.join('');
}
// ---------- Scene 1: placement ----------
function scenePlacement(){
 const W=1936,H=1056,S=[];
 S.push(r(0,0,W,H,{fill:'#000000'}));
 S.push(r(8,8,1920,1040,{fill:C.bg}));
 S.push(r(8,8,1920,32,{fill:C.bg}));
 S.push(r(20,14,20,20,{fill:'#18181b',rx:5})+t(30,28,'T3',{size:9,weight:700,fill:'#fff',anchor:'middle'}));
 S.push(t(48,28,'T3 Code',{size:12.5,weight:600}));
 S.push(`<path d="M118 18l-7 7 7 7" fill="none" stroke="${C.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
 S.push(`<path d="M146 18l7 7-7 7" fill="none" stroke="${C.faint}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
 S.push(r(330,20,14,14,{fill:'#f59e0b',rx:3})+t(337,30.5,'D',{size:9,weight:700,fill:'#fff',anchor:'middle'}));
 S.push(t(352,31,'demo-workspace',{size:13}));
 S.push(t(462,31,'/',{size:13,fill:C.faint}));
 S.push(t(476,31,'新建会话',{size:13,fill:C.muted}));
 S.push(`<rect x="1622" y="17" width="14" height="15" rx="2" fill="none" stroke="${C.muted}" stroke-width="1.4"/>`);
 S.push(`<rect x="1658" y="19" width="15" height="13" rx="2" fill="none" stroke="${C.muted}" stroke-width="1.4"/>`);
 S.push(`<rect x="1694" y="17" width="15" height="15" rx="2" fill="none" stroke="${C.muted}" stroke-width="1.4"/><path d="M1698 21h7M1698 25h7" stroke="${C.muted}" stroke-width="1.4"/>`);
 S.push(`<rect x="1730" y="17" width="15" height="15" rx="2" fill="none" stroke="${C.muted}" stroke-width="1.4"/>`);
 S.push(line(1780,14,1780,34,{stroke:C.border}));
 S.push(line(1812,25,1826,25,{stroke:'#5b5b60',sw:1.6}));
 S.push(r(1848,18,12,12,{stroke:'#5b5b60',sw:1.4}));
 S.push(line(1884,18,1898,32,{stroke:'#5b5b60',sw:1.6})+line(1898,18,1884,32,{stroke:'#5b5b60',sw:1.6}));
 S.push(line(8,40,1928,40,{stroke:'#e9e9eb'}));
 S.push(r(8,40,306,1008,{fill:C.panel}));
 S.push(line(314,40,314,1048,{stroke:C.border}));
 S.push(search(22,64,1.05));
 S.push(t(46,76,'搜索',{size:13,fill:C.muted}));
 S.push(`<path d="M250 62v12M244 68h12" stroke="${C.muted}" stroke-width="1.5" stroke-linecap="round"/>`);
 S.push(`<path d="M278 62h11v10h-11z" fill="none" stroke="${C.muted}" stroke-width="1.4"/><path d="M281 62v-3h6v3" fill="none" stroke="${C.muted}" stroke-width="1.2"/>`);
 S.push(r(18,96,18,18,{fill:'#f59e0b',rx:4})+t(27,109,'D',{size:10.5,weight:700,fill:'#fff',anchor:'middle'}));
 S.push(t(44,109,'demo-workspace',{size:12.5,weight:500}));
 S.push(t(302,109,'刚刚',{size:11,fill:C.faint,anchor:'end'}));
 S.push(r(10,120,292,76,{fill:'#f0f0f1',rx:8}));
 S.push(t(22,144,'整理示例页面的说明',{size:13}));
 S.push(`<rect x="22" y="156" width="9" height="9" rx="2" fill="none" stroke="${C.faint}" stroke-width="1.2"/>`);
 S.push(t(36,165,'本地副本',{size:11,fill:C.muted}));
 S.push(t(36,181,'DESKTOP-DEMO',{size:10.5,fill:C.faint}));
 S.push(`<path d="M288 150l0 16" stroke="${C.borderStrong}" stroke-width="2" stroke-linecap="round"/>`);
 S.push(r(8,1000,306,48,{fill:C.panel}));
 S.push(line(8,1000,314,1000,{stroke:'#ececee'}));
 S.push(t(16,1012,'已收尾',{size:12,fill:C.muted}));
 S.push(t(302,1012,'2',{size:12,fill:C.muted,anchor:'end'}));
 S.push(search(22,1030,0.55));
 for(const x of [52,78,104])S.push(r(x,1024,12,12,{stroke:C.faint,sw:1.2,rx:2}));
 S.push(`<path d="M286 1036a5 5 0 1 1 2 4" fill="none" stroke="${C.faint}" stroke-width="1.3"/><path d="M284 1032l4 0 0 4" fill="none" stroke="${C.faint}" stroke-width="1.3"/>`);
 S.push(`<g filter="url(#sh)">${r(1630,58,279,264,{fill:'#ffffff',rx:12,stroke:'#ececee'})}</g>`);
 S.push(`<path d="M1650 84h10v9h-10z" fill="none" stroke="${C.muted}" stroke-width="1.4"/><path d="M1660 81v9" stroke="${C.muted}" stroke-width="1.2"/>`);
 S.push(t(1670,91,'DESKTOP-DEMO',{size:12.5,weight:500}));
 S.push(chevron(1870,83,0.9));
 S.push(line(1646,104,1893,104,{stroke:'#f0f0f1'}));
 S.push(r(1650,116,12,10,{fill:'#f59e0b',rx:2}));
 S.push(t(1670,126,'在文件资源管理器中打开',{size:12.5}));
 S.push(chevron(1870,119,0.9));
 S.push(t(1650,152,'+  添加项目脚本',{size:12.5,fill:'#3f3f46'}));
 S.push(line(1646,168,1893,168,{stroke:'#f0f0f1'}));
 S.push(`<path d="M1652 182l4 3 4-3M1656 185v7" stroke="${C.muted}" stroke-width="1.3" fill="none"/><circle cx="1652" cy="196" r="2.5" fill="none" stroke="${C.muted}" stroke-width="1.2"/>`);
 S.push(t(1672,192,'master',{size:12.5}));
 S.push(chevron(1870,185,0.9));
 S.push(`<path d="M1652 214l5-4 5 4M1657 210v9" stroke="${C.muted}" stroke-width="1.3" fill="none"/>`);
 S.push(t(1672,220,'提交',{size:12.5}));
 S.push(chevron(1870,213,0.9));
 S.push(t(1650,250,'改动 · 未提交',{size:12,fill:'#3f3f46'}));
 S.push(t(1893,250,'+5,696 −464',{size:11.5,fill:'#16a34a',anchor:'end'}));
 S.push(t(1650,286,'+  其他仓库…',{size:12.5,fill:'#3f3f46'}));
 S.push(r(751,96,735,22,{fill:'#f6f6f7',rx:5}));
 S.push(t(762,111,'示例对话 · 演示数据（已脱敏）',{size:11,fill:C.muted}));
 S.push(t(751,152,'你',{size:11.5,fill:C.faint}));
 S.push(t(751,176,'帮我把这个页面的按钮改成圆角',{size:13.5}));
 S.push(t(751,216,'示例助手',{size:11.5,fill:C.faint}));
 S.push(t(751,240,'好的，已经调整按钮圆角与间距；底部状态栏保持紧凑显示。',{size:13.5}));
 S.push(t(751,264,'如需更圆的效果，我可以把半径再调大一档。',{size:13.5}));
 S.push(`<g filter="url(#sh)">${r(751,826,735,202,{fill:'#ffffff',rx:12,stroke:'#ececee'})}</g>`);
 S.push(t(768,900,'帮我把示例页面的按钮改成圆角',{size:13}));
 S.push(paperclip(766,952,1.05));
 S.push(`<path d="M1236 958h126a14 14 0 0 1 0 28h-126a14 14 0 0 1 0-28z" fill="${C.hover}"/>`);
 S.push(antigravity(1246,963,0.62));
 S.push(t(1270,977,'4 Neon High',{size:12.5,weight:500}));
 S.push(chevron(1342,967,0.85));
 S.push(`<path d="M1386 968a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0z" fill="none" stroke="${C.muted}" stroke-width="1.5"/><path d="M1382 974a8 8 0 0 0 16 0M1390 984v4" fill="none" stroke="${C.muted}" stroke-width="1.5" stroke-linecap="round"/>`);
 S.push(`<circle cx="1462" cy="972" r="16" fill="${C.blue}"/><path d="M1462 979v-13M1456 972l6-6 6 6" fill="none" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`);
 S.push(line(763,995,1474,995,{stroke:'#ededef'}));
 S.push(group(768,1013,1,footerNative(0,0)));
 S.push(r(736,982,752,54,{stroke:C.blue,sw:1.4,rx:8,dash:'6 5'}));
 S.push(`<path d="M1512 1004H1494" stroke="${C.blue}" stroke-width="1.2" stroke-dasharray="3 3"/>`);
 S.push(callout('1',1512,1004));
 S.push(t(1530,999,'精简底栏（新增）',{size:12.5,weight:600}));
 S.push(t(1530,1016,'上下文 / 额度 / 缓存集中一行',{size:11,fill:C.muted}));
 S.push(r(1226,948,142,44,{stroke:'#c7c7cd',sw:1.1,rx:10,dash:'4 4'}));
 S.push(t(1216,964,'原生选择器',{size:10.5,fill:C.muted,anchor:'end'}));
 S.push(r(140,60,124,22,{fill:'#ffffff',rx:11,stroke:'#e2e2e6'}));
 S.push(t(202,75,'原生侧栏 · 未改动',{size:10.5,fill:C.muted,anchor:'middle'}));
 S.push(r(736,88,766,190,{stroke:'#c7c7cd',sw:1.1,rx:10,dash:'4 4'}));
 S.push(r(750,64,148,22,{fill:'#ffffff',rx:11,stroke:'#e2e2e6'}));
 S.push(t(824,79,'演示对话，非真实记录',{size:10.5,fill:C.muted,anchor:'middle'}));
 return svg(W,H,DEFS+S.join(''),{title:'T3 Code 0.1.12 中的精简额度栏位置',desc:'真实窗口示意：底栏状态行位于输入框底部，右侧为额度入口；模型选择器与侧栏保持原生。演示数据。'});
}
// ---------- Scene 2: footer ----------
function sceneFooter(){
 const W=1560,H=400,S=[];const k=1.5;
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${r(40,26,1480,150,{fill:'#ffffff',rx:14,stroke:'#ececee'})}</g>`);
 S.push(line(40,116,1520,116,{stroke:'#ededef'}));
 S.push(group(64,166,k,footerNative(0,0)));
 const items=[
  ['1','上下文入口','点击展开上下文面板：已用 / 已缓存 / 未缓存 / 剩余空间 / 缓存命中',64],
  ['2','轮次与工具','本轮统计：轮数、工具调用次数、输出速度（词元/秒）',64],
  ['3','词元与缓存','会话累计词元与缓存命中率，竖线左侧为本轮，右侧为累计',812],
  ['4','额度入口','点击展开所选模型的额度详情，与上下文入口互不混排',1150]
 ];
 items.forEach(([n,title,desc,x],i)=>{const cy=262+i*30;S.push(callout(n,x+11,cy-4));S.push(t(x+30,cy,title,{size:12.5,weight:600}));S.push(t(x+118,cy,desc,{size:11,fill:C.muted}));});
 S.push(t(64,392,'示意数据；实际数值随会话变化，缺失时不补造。',{size:10.5,fill:C.faint}));
 return svg(W,H,DEFS+S.join(''),{title:'底栏状态行放大',desc:'底栏四个区域：上下文入口、轮次与工具、词元与缓存、额度入口。'});
}
// ---------- Scene 3: context ----------
function sceneContext(){
 const {body,w,h}=contextPanel();const k=1.5;const W=1180,H=560,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${group(56,44,k,body)}</g>`);
 const panelRight=56+w*k;
 S.push(group(56,44+h*k+10,1.15,`${t(0,0,'上下文',{size:11,fill:C.muted})}${bar(48,-8,52,8,{segments:[{w:23,fill:C.blue},{w:3,fill:C.orange}]})}${t(108,0,'476k/1m',{size:11.5,weight:600})}${t(168,0,'45%',{size:11,fill:C.muted})}`));
 S.push(line(56+w*k/2,44+h*k+8,56+w*k/2,44+h*k+10,{stroke:'#dcdce0'}));
 S.push(legendRows([
  ['1','面板标题','“上下文”固定标题；数值缺失时不补造。',96],
  ['2','已用与容量','已用百分比 + 当前已用 / 上下文上限。',150],
  ['3','分段条','蓝＝已缓存，橙＝未缓存，灰＝剩余空间。',196],
  ['4','图例与数值','每类词元的绝对量与占比，口径与上游一致。',272],
  ['5','剩余与压缩','剩余空间；达到压缩阈值时显示压缩预留。',346],
  ['6','缓存命中与轮次','最近一轮与会话命中率，底部为轮次与工具次数。',458]
 ],620,panelRight));
 return svg(W,H,DEFS+S.join(''),{title:'上下文面板（点击底栏“上下文”展开）',desc:'六处说明：标题、已用与容量、分段条、图例数值、剩余与压缩、缓存命中与轮次。'});
}
// ---------- Scene 4: quota ----------
function sceneQuota(){
 const {body,w,h}=quotaPanel();const k=1.5;const W=1180,H=470,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${group(56,36,k,body)}</g>`);
 const panelRight=56+w*k;
 S.push(group(56,36+h*k+12,1.15,`${clock(0,-13,0.8,C.muted)}${t(20,0,'周额度',{size:11.5,weight:500})}${t(103,0,'94%',{size:11.5,weight:600,anchor:'end'})}`));
 S.push(line(56+w*k/2,36+h*k+8,56+w*k/2,36+h*k+10,{stroke:'#dcdce0'}));
 S.push(legendRows([
  ['1','提供方 · 模型','当前选中的提供商实例与模型，二者始终成对。',84],
  ['2','账号归属','额度所属账号，不与其他提供商的额度混排。',122],
  ['3','额度窗口','周额度 / 5 小时窗口等原生窗口名称。',167],
  ['4','分段额度条','每格 5%，右侧刻度标记当前剩余比例。',210],
  ['5','重置时间','按原生时区显示的下次重置倒计时。',262],
  ['6','全部额度入口','进入用量页“限制”标签，查看全部提供商与共享池。',340]
 ],636,panelRight));
 return svg(W,H,DEFS+S.join(''),{title:'额度面板（点击底栏“周额度”展开）',desc:'六处说明：提供方与模型、账号归属、额度窗口、分段条、重置时间、全部额度入口。'});
}
// ---------- Scene 5: picker ----------
function scenePicker(){
 const {body,w,h}=pickerPanel();const k=1.45;const W=1180,H=470,S=[];
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${group(34,30,k,body)}</g>`);
 const panelRight=34+w*k;
 S.push(legendRows([
  ['1','搜索模型','按名称过滤，保留原生键盘导航。',76],
  ['2','提供商栏','收藏 / 各提供商图标；选中项有指示条，GPT 与 Claude 不混排。',160],
  ['3','每模型额度','新增：直接显示该模型所属池的剩余额度。',250],
  ['4','快捷键','原生 Ctrl+1…5 快速切换。',330],
  ['5','思考强度','原生 Thinking Level 子菜单，未被替换。',386]
 ],742,panelRight));
 return svg(1180,470,DEFS+S.join(''),{title:'模型选择器（原生，新增每模型额度）',desc:'五处说明：搜索、提供商栏、每模型额度、快捷键、思考强度。'});
}
scenes.set('01-placement',scenePlacement());
scenes.set('02-footer',sceneFooter());
scenes.set('03-context',sceneContext());
scenes.set('04-quota',sceneQuota());
scenes.set('05-picker',scenePicker());
function usageModal(active,body){
 const S=[];const W=1600,H=880;
 S.push(r(0,0,W,H,{fill:'#ffffff'}));
 S.push(`<g filter="url(#sh)">${r(30,20,1540,840,{fill:'#ffffff',rx:14,stroke:'#ececee'})}</g>`);
 S.push(t(56,60,'用量',{size:13,weight:500}));
 S.push(t(94,60,'/',{size:13,fill:C.faint}));
 S.push(t(110,60,'所有环境',{size:13,fill:'#3f3f46'}));
 S.push(chevron(174,52,0.8,C.muted));
 S.push(t(196,60,'/',{size:13,fill:C.faint}));
 S.push(t(212,60,'2 个提供方',{size:13,fill:'#3f3f46'}));
 S.push(chevron(296,52,0.8,C.muted));
 // period segmented group
 S.push(r(876,42,306,32,{fill:'#f4f4f5',rx:9}));
 S.push(r(879,45,102,26,{fill:'#ffffff',rx:7}));
 S.push(t(930,63,'过去 24 小时',{size:12.5,anchor:'middle'}));
 S.push(t(1016,63,'7 天',{size:12.5,fill:C.muted,anchor:'middle'}));
 S.push(t(1072,63,'30 天',{size:12.5,fill:C.muted,anchor:'middle'}));
 S.push(t(1136,63,'90 天',{size:12.5,fill:C.muted,anchor:'middle'}));
 // tabs
 S.push(r(1196,42,186,32,{fill:'#f4f4f5',rx:9}));
 const tabs=['费用','token','限制'];
 tabs.forEach((label,i)=>{
  const x=1199+i*61,w=57;
  if(label===active){S.push(r(x,45,w,26,{fill:'#ffffff',rx:7}));S.push(t(x+w/2,63,label,{size:12.5,anchor:'middle'}));}
  else S.push(t(x+w/2,63,label,{size:12.5,fill:C.muted,anchor:'middle'}));
 });
 // currency
 S.push(r(1396,42,112,32,{fill:'#f4f4f5',rx:9}));
 S.push(r(1399,45,52,26,{fill:'#ffffff',rx:7}));
 S.push(t(1425,63,'¥ CNY',{size:12.5,anchor:'middle'}));
 S.push(t(1479,63,'$ USD',{size:12.5,fill:C.muted,anchor:'middle'}));
 S.push(`<path d="M1528 52a9 9 0 1 1 3 7" fill="none" stroke="${C.muted}" stroke-width="1.5"/><path d="M1526 48l5 1-1 5" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`);
 S.push(`<path d="M1556 52l12 12M1568 52l-12 12" stroke="#5b5b60" stroke-width="1.6" stroke-linecap="round"/>`);
 S.push(line(30,96,1570,96,{stroke:'#ededef'}));
 return {head:S.join(''),W,H};
}
function quotaCard(x,y,w,{title,pct,extra,barFill,rowRight,bottom,striped=false}){
 const S=[];
 S.push(r(x,y,w,152,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(x+20,y+30,title,{size:13.5,weight:500}));
 S.push(t(x+20,y+64,pct,{size:22,weight:600}));
 const pw=pct==='100%'?65:51;
 S.push(t(x+20+pw,y+63,'剩余',{size:12.5,fill:C.muted}));
 if(extra)S.push(`<path d="M${x+24+pw+34} ${y+54}l4-4 4 4M${x+24+pw+34} ${y+58}l6-5 6 5" fill="none" stroke="${C.faint}" stroke-width="1.3"/>`);
 S.push(r(x+20,y+78,w-40,14,{fill:barFill,rx:7}));
 if(striped)S.push(`<path d="M${x+w-42} ${y+78}l22 14M${x+w-34} ${y+78}l14 14M${x+w-26} ${y+78}l8 14" stroke="#ffffff" stroke-width="2" opacity="0.9"/>`);
 S.push(t(x+w/2,y+89,'1',{size:10.5,fill:'#3f3f46',anchor:'middle'}));
 S.push(r(x+w-32,y+72,2,26,{fill:'#3f3f46',rx:1}));
 S.push(r(x+20,y+102,13,13,{fill:'#e6e2f4',rx:3}));
 S.push(t(x+26.5,y+112,'1',{size:9,fill:'#5b4f8a',anchor:'middle'}));
 S.push(t(x+40,y+113,'Antigravity '+(pct==='100%'?'100%':pct),{size:12.5}));
 if(rowRight)S.push(clock(x+w-104,y+102,0.72,C.faint)+t(x+w-20,y+113,rowRight[0],{size:12,fill:C.muted,anchor:'end'}));
 S.push(t(x+20,y+140,bottom,{size:12.5}));
 return S.join('');
}
// ---------- Scene 6: limits ----------
function sceneLimits(){
 const {head,W,H}=usageModal('限制');const S=[head];
 S.push(antigravity(56,112,0.86));
 S.push(t(84,127,'Antigravity',{size:13.5,weight:600}));
 S.push(quotaCard(56,142,660,{title:'Gemini · Weekly',pct:'94%',extra:true,barFill:'#d4ceec',rowRight:['6天22小时',86],bottom:'⚡ Fast · ~16h 53m to cap',striped:true}));
 S.push(quotaCard(736,142,660,{title:'Claude & GPT (shared) · 5-hour',pct:'100%',barFill:'#d4ceec',bottom:'✨ Full capacity'}));
 S.push(quotaCard(56,310,660,{title:'Claude & GPT (shared) · Weekly',pct:'100%',barFill:'#d4ceec',bottom:'✨ Full capacity'}));
 // chatgpt usage banner
 S.push(r(56,646,1340,116,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(openai(76,680,0.95));
 S.push(t(116,684,'ChatGPT usage',{size:13.5,weight:500}));
 S.push(t(116,708,'DESKTOP-DEMO 上的 Codex',{size:12.5,fill:C.muted}));
 S.push(t(116,730,'用已连接的账户在 ChatGPT 中查看用量。',{size:12,fill:C.muted}));
 S.push(t(1376,708,'管理用量 ↗',{size:12.5,fill:'#3f3f46',anchor:'end'}));
 S.push(legendRows([
  ['1','期限筛选','今日 / 7 天 / 30 天 / 90 天，切换统计区间。',356],
  ['2','标签页','费用 / token / 限制，三者共用同一套筛选。',406],
  ['3','货币切换','¥ CNY / $ USD 只改变显示货币，不改上游数据。',456],
  ['4','额度卡片','按提供商与窗口展示剩余额度；共享池显示 shared。',512],
  ['5','账号与重置','卡片内标注账号与实际重置时间。',560]
 ],800,null));
 return svg(W,H,DEFS+S.join(''),{title:'用量页 · 限制标签（点“全部额度”进入）',desc:'期限、标签页、货币切换、额度卡片、账号与重置时间。'});
}
// ---------- Scene 7: cost ----------
function sceneCost(){
 const {head,W,H}=usageModal('费用');const S=[head];
 S.push(t(56,196,'¥86.42',{size:44,weight:600}));
 S.push(t(56,222,'6 个会话 · API 估算',{size:12,fill:C.muted}));
 S.push(t(56,272,'ChatGPT 共享用量',{size:12.5,fill:C.muted}));
 S.push(t(696,272,'管理用量 ↗',{size:12,fill:'#3f3f46',anchor:'end'}));
 S.push(dot(64,300,'#8b5cf6'));
 S.push(antigravity(74,288,0.66));
 S.push(t(96,304,'Antigravity  6 个会话',{size:12.5}));
 S.push(t(696,304,'¥86.42',{size:12.5,anchor:'end'}));
 S.push(t(96,324,'占费用的 100.0% · 3.2M token',{size:11,fill:C.muted}));
 // chart
 S.push(t(760,160,'每小时费用',{size:12.5,fill:'#3f3f46'}));
 const cx=800,cy=180,cw=600,ch=180;
 for(const [i,label] of ['¥120.00','¥80.00','¥40.00','0'].entries()){
  const y=cy+i*ch/3;S.push(t(cx-12,y+4,label,{size:10.5,fill:C.faint,anchor:'end'}));
  S.push(line(cx,y,cx+cw,y,{stroke:'#f1f1f3'}));
 }
 const pts=[0,26,18,30,22,20,14,34,28,96,54,72,26,8,12];
 const step=cw/(pts.length-1);
 const path=pts.map((v,i)=>`${i?'L':'M'}${(cx+i*step).toFixed(1)} ${(cy+ch-v).toFixed(1)}`).join(' ');
 S.push(`<path d="${path} L${cx+cw} ${cy+ch} L${cx} ${cy+ch} Z" fill="#a78bfa" opacity="0.18"/>`);
 S.push(`<path d="${path}" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linejoin="round"/>`);
 S.push(t(cx,cy+ch+22,'06:00时',{size:10.5,fill:C.faint}));
 S.push(t(cx+cw/2,cy+ch+22,'18:00时',{size:10.5,fill:C.faint,anchor:'middle'}));
 S.push(t(cx+cw,cy+ch+22,'05:00时',{size:10.5,fill:C.faint,anchor:'end'}));
 // totals
 const totals=[['处理的 token','3.2M'],['缓存的输入','2.9M'],['未缓存的输入','214K'],['输出','96K'],['缓存节省','¥512.30']];
 totals.forEach(([label,value],i)=>{const x=56+i*136;S.push(t(x,400,label,{size:11.5,fill:C.muted}));S.push(t(x,424,value,{size:14,weight:500}));});
 // breakdown bar
 S.push(t(56,470,'按类型统计的费用',{size:12.5,fill:'#3f3f46'}));
 S.push(r(56,486,684,12,{fill:'#e9e9eb',rx:4}));
 S.push(r(56,486,253,12,{fill:'#a1a1aa',rx:0}));
 S.push(r(309,486,313,12,{fill:'#c9c9d1',rx:0}));
 S.push(r(622,486,118,12,{fill:'#3f3f46',rx:0}));
 S.push(dot(60,520,'#a1a1aa')+t(70,524,'输入框 ¥31.80',{size:11.5,fill:C.muted}));
 S.push(dot(196,520,'#c9c9d1')+t(206,524,'缓存读取 ¥38.40',{size:11.5,fill:C.muted}));
 S.push(dot(352,520,'#3f3f46')+t(362,524,'输出 ¥16.22',{size:11.5,fill:C.muted}));
 // table
 S.push(t(56,566,'明细',{size:12.5,weight:500}));
 S.push(r(620,546,124,28,{fill:'#f4f4f5',rx:8}));
 S.push(r(623,549,58,22,{fill:'#ffffff',rx:6}));
 S.push(t(652,564,'模型',{size:11.5,anchor:'middle'}));
 S.push(t(710,564,'小时',{size:11.5,fill:C.muted,anchor:'middle'}));
 S.push(t(56,606,'#',{size:11,fill:C.muted})+t(84,606,'模型',{size:11,fill:C.muted}));
 S.push(t(596,606,'费用',{size:11,fill:C.muted,anchor:'end'})+t(664,606,'占比',{size:11,fill:C.muted,anchor:'end'})+t(744,606,'token',{size:11,fill:C.muted,anchor:'end'}));
 S.push(line(56,616,744,616,{stroke:'#ededef'}));
 S.push(t(56,644,'1',{size:12,fill:C.muted})+antigravity(78,632,0.62)+t(102,646,'demo-model-a',{size:12.5}));
 S.push(t(596,644,'¥86.42',{size:12.5,anchor:'end'})+t(664,644,'100.0%',{size:12.5,anchor:'end'})+t(744,644,'3.1M',{size:12.5,anchor:'end'}));
 S.push(t(56,680,'2',{size:12,fill:C.muted})+antigravity(78,668,0.62)+t(102,682,'demo-model-b',{size:12.5}));
 S.push(t(596,680,'未定价',{size:12.5,fill:C.muted,anchor:'end'})+t(744,680,'78K',{size:12.5,anchor:'end'}));
 S.push(legendRows([
  ['1','费用 / 货币','人民币与美元切换只改变显示，不修改统计数据。',520],
  ['2','图表刻度','纵轴随货币格式化，横轴保留原生时间。',584],
  ['3','统计口径','处理的 token、缓存输入、未缓存输入、输出与节省分列。',648],
  ['4','类型占比','输入 / 缓存读取 / 输出三段比例，来自原生统计。',712],
  ['5','明细表','模型 / 小时两种视图；未定价模型保留原文。',776]
 ],800,null));
 return svg(W,H,DEFS+S.join(''),{title:'用量页 · 费用标签（原生费用页 + 货币切换）',desc:'货币切换、图表、统计口径、类型占比与明细表。'});
}
// ---------- Scene 8: click flow ----------
function sceneFlow(){
 const W=1600,H=860,S=[];const k=0.62;
 S.push(r(0,0,W,H,{fill:'#fcfcfc'}));
 S.push(t(56,64,'点击路径：从底栏到完整用量',{size:22,weight:600}));
 S.push(t(56,92,'每一处入口都可返回；展开的面板与原生长度一致，不新增页面层级。',{size:12.5,fill:C.muted}));
 const card=(x,y,w,h,n,title,body)=>{
  const out=[`<g filter="url(#sh)">${r(x,y,w,h,{fill:'#ffffff',rx:14,stroke:'#ececee'})}</g>`];
  out.push(callout(n,x+26,y+26));
  out.push(t(x+44,y+30,title,{size:12.5,weight:600}));
  out.push(body);
  return out.join('');
 };
 const ctx=contextPanel(),quo=quotaPanel(),pick=pickerPanel();
 const composerMini=(x,y)=>{
  const S2=[];
  S2.push(r(x,y,330,96,{fill:'#ffffff',rx:10,stroke:'#ececee'}));
  S2.push(t(x+14,y+30,'继续',{size:12}));
  S2.push(line(x+10,y+52,x+320,y+52,{stroke:'#ededef'}));
  S2.push(group(x+14,y+58,0.46,footerNative(0,0)));
  return S2.join('');
 };
 S.push(card(56,130,420,190,'1','底栏（输入框底部）',composerMini(96,180)));
 S.push(card(560,130,470,300,'2','点“上下文” → 上下文面板',group(590,196,k,ctx.body)));
 S.push(card(560,470,470,320,'3','点“周额度” → 额度面板',group(590,520,k,quo.body)));
 S.push(card(1104,470,440,320,'4','点“全部额度” → 用量页 · 限制',`${r(1124,520,400,250,{fill:'#ffffff',rx:10,stroke:'#ececee'})}${t(1140,548,'用量  /  所有环境  /  2 个提供方',{size:9.5,fill:C.muted})}${line(1124,562,1524,562,{stroke:'#ededef'})}${t(1140,584,'Gemini · Weekly',{size:10,weight:500})}${t(1140,610,'94%',{size:16,weight:600})}${r(1140,622,368,10,{fill:'#d4ceec',rx:5})}${t(1140,652,'Antigravity 94%',{size:9.5})}${t(1140,676,'Claude & GPT (shared) · 5-hour',{size:10,weight:500})}${t(1140,700,'100%',{size:14,weight:600})}${r(1140,712,368,10,{fill:'#d4ceec',rx:5})}${t(1140,742,'全部额度入口与用量页共用同一份数据',{size:9,fill:C.muted})}`));
 S.push(card(1104,130,440,300,'5','点“费用” → 费用页（货币切换）',`${r(1124,186,400,214,{fill:'#ffffff',rx:10,stroke:'#ececee'})}${t(1140,214,'费用   token   限制',{size:9.5,fill:C.muted})}${t(1140,248,'¥86.42',{size:22,weight:600})}${t(1140,268,'6 个会话 · API 估算',{size:8.5,fill:C.muted})}${line(1140,282,1508,282,{stroke:'#f1f1f3'})}${t(1140,304,'¥ CNY   $ USD',{size:9,fill:C.muted})}${t(1140,330,'处理的 token      缓存的输入      输出',{size:8.5,fill:C.muted})}${t(1140,346,'3.2M              2.9M           96K',{size:9.5})}${r(1140,362,360,8,{fill:'#e9e9eb',rx:4})}${r(1140,362,140,8,{fill:'#a1a1aa',rx:0})}${t(1140,390,'模型明细：demo-model-a ¥86.42 · 100.0%',{size:8.5,fill:C.muted})}`));
 const arrow=(x1,y1,x2,y2,label,lx,ly)=>{const S2=[`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#b9b9c2" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>`,`<path d="M${x2} ${y2}l-7-3 1 7z" fill="#b9b9c2"/>`];if(label)S2.push(t(lx,ly,label,{size:11,fill:C.muted,anchor:'middle'}));return S2.join('');};
 S.push(arrow(478,232,554,232,'点“上下文”',516,214));
 S.push(arrow(1032,232,1100,232,'点“费用”',1066,214));
 S.push(arrow(795,432,795,464,'',795,0));
 S.push(t(808,452,'点“周额度”',{size:11,fill:C.muted}));
 S.push(arrow(1032,620,1100,620,'点“全部额度”',1066,602));
 S.push(t(56,828,'示意图：演示数据；原生控件、原生页面，新增的只是入口与标签。',{size:10.5,fill:C.faint}));
 return svg(W,H,DEFS+S.join(''),{title:'点击路径总览',desc:'底栏 → 上下文面板 / 额度面板 → 全部额度 → 用量页限制与费用标签。'});
}
// ---------- Cover ----------
function sceneCover(){
 const W=1600,H=900,S=[];const ctx=contextPanel(),quo=quotaPanel(),pick=pickerPanel();
 S.push(r(0,0,W,H,{fill:'#fcfcfc'}));
 S.push(r(0,0,W,6,{fill:'#18181b'}));
 S.push(t(72,132,'T3 Code 精简额度栏',{size:46,weight:700}));
 S.push(t(72,180,'中文上下文 · 费用货币 · 0.1.12 适配',{size:22,fill:'#3f3f46'}));
 S.push(t(72,222,'底部一行展示上下文、轮次、工具、速度、缓存与额度；所有面板保持原生控件与原生算法。',{size:13,fill:C.muted}));
 const bullets=['原生模型选择器 + 每模型额度','上下文 / 额度 / 费用全中文','共享池语义与提供商分离','只改前端 10 个文件'];
 bullets.forEach((text,i)=>{const y=272+i*40;S.push(r(72,y-16,16,16,{fill:'#18181b',rx:4})+check(75,y-12,0.35,'#ffffff'));S.push(t(100,y,text,{size:13.5}));});
 S.push(r(72,452,470,150,{fill:'#ffffff',rx:12,stroke:'#ececee'}));
 S.push(t(92,482,'0.1.12 固定构建 · 10 个前端文件',{size:12.5,weight:600}));
 S.push(t(92,506,'server.asar 后端字节与元数据不变',{size:11.5,fill:C.muted}));
 S.push(t(92,528,'未验证即拒绝安装：版本 / 提交 / 哈希三重校验',{size:11.5,fill:C.muted}));
 S.push(t(92,550,'原版备份可一键恢复',{size:11.5,fill:C.muted}));
 S.push(`<g filter="url(#sh)">${group(640,84,1.28,ctx.body)}</g>`);
 S.push(`<g filter="url(#sh)">${group(1058,300,1.0,quo.body)}</g>`);
 S.push(`<g filter="url(#sh)">${group(600,470,0.9,pick.body)}</g>`);
 S.push(r(560,64,996,690,{stroke:'#e6e6ea',sw:1.2,rx:18,dash:'6 6'}));
 S.push(t(640,784,'示意图：演示数据，非真实项目 / 账号 / 会话',{size:10.5,fill:C.faint}));
 return svg(W,H,DEFS+S.join(''),{title:'T3 Code 精简额度栏 · 中文上下文',desc:'封面：底栏入口、上下文面板、额度面板与模型选择器。演示数据。'});
}
scenes.set('06-limits',sceneLimits());
scenes.set('07-cost',sceneCost());
scenes.set('08-flow',sceneFlow());
scenes.set('cover',sceneCover());
for(const [name,markup] of scenes)fs.writeFileSync(path.join(OUT,name+'.svg'),markup+'\n');
console.log(JSON.stringify({written:[...scenes.keys()]},null,2));
