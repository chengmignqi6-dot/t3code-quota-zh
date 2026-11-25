// Vector illustrations rebuilt from measured native UI geometry and sampled colors.
// Demo data only: no project names, accounts, paths, or conversation content.
export const C={bg:'#fcfcfc',panel:'#f9f9f9',card:'#ffffff',border:'#e4e4e7',borderStrong:'#d4d4d8',text:'#18181b',muted:'#71717b',faint:'#a1a1aa',blue:'#2b7fff',blueSoft:'#bfdbfe',orange:'#fe9a00',orangeSoft:'#fde0ad',amberText:'#b45309',amberBorder:'#fbd9a5',violet:'#d4ceec',violetDeep:'#8b5cf6',track:'#e9e9eb',hover:'#f4f4f5',ink:'#0b0b0c',stroke:'#d9d9de'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const FONT="'Segoe UI','Microsoft YaHei UI','PingFang SC',system-ui,sans-serif";
export const MONO="'Cascadia Mono',Consolas,'Courier New',monospace";
export const t=(x,y,s,{size=13,fill=C.text,weight=400,anchor='start',mono=false,spacing=0,opacity=1}={})=>`<text x="${x}" y="${y}" font-family="${mono?MONO:FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${spacing?` letter-spacing="${spacing}"`:''}${opacity!==1?` opacity="${opacity}"`:''}>${esc(s)}</text>`;
export const r=(x,y,w,h,{fill='none',stroke=null,rx=0,sw=1,opacity=1,dash=null}={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx?` rx="${rx}"`:''} fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw}"`:''}${dash?` stroke-dasharray="${dash}"`:''}${opacity!==1?` opacity="${opacity}"`:''}/>`;
export const line=(x1,y1,x2,y2,{stroke=C.border,sw=1,dash=null,cap='butt'}={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
export function svg(w,h,body,{title='',desc=''}={}){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc>${body}</svg>`;}
export function bar(x,y,w,h,{radius=null,segments=null,track=C.track}={}){
 const rr=radius??h/2;const parts=[r(x,y,w,h,{fill:track,rx:rr})];let cx=x;
 for(const s of segments){if(s.w<=0)continue;parts.push(`<path d="${capsule(cx,y,s.w,h,rr)}" fill="${s.fill}"/>`);cx+=s.w;}
 return parts.join('');
}
function capsule(x,y,w,h,r){r=Math.min(r,w/2,h/2);return `M${x+r},${y}h${w-2*r}a${r},${r} 0 0 1 ${r},${r}v${h-2*r}a${r},${r} 0 0 1 ${-r},${r}h${-(w-2*r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h-2*r)}a${r},${r} 0 0 1 ${r},${-r}z`;}
export function segmented(x,y,w,h,{count=20,filled=18,partial=0.8,striped=false}={}){
 const gap=2,cell=(w-gap*(count-1))/count;let out='';
 for(let i=0;i<count;i++){const cx=x+i*(cell+gap);const full=i<filled;const part=i===filled?partial:0;
  out+=r(cx,y,cell,h,{fill:full?C.orange:C.track,rx:1.5});
  if(part>0)out+=r(cx,y,cell*part,h,{fill:C.orange,rx:1.5});
  if(striped&&!full&&part===0)out+=`<path d="M${cx+cell-3} ${y+h-1}l3-3" stroke="#c9c9cf" stroke-width="1.4"/>`;}
 return out;}
// Circular quota gauge used by the quota popover cards.
export function ringGauge(cx,cy,radius,pct,{stroke=3.1,color=C.orange,track='#e6e6e9'}={}){
 const c=2*Math.PI*radius, filled=c*pct/100;
 return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${filled.toFixed(2)} ${(c-filled).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
}
export const antigravity=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M12 3 2.5 21h5.2l4.3-8.1 4.3 8.1h5.2z" fill="#4285f4"/><path d="M12 3 7.7 11.1h3.6l1.9-3.6 1.9 3.6h3.6z" fill="#34a853"/><path d="M7.7 11.1 2.5 21h5.2l1.4-2.7z" fill="#fbbc05"/><path d="M16.3 11.1 15 13.2l1.4 2.7h5.2z" fill="#ea4335"/></g>`;
export const openai=(x,y,s=1,color=C.ink)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.3l7.4 4.3v8.8L12 20.7 4.6 16.4V7.6z"/><path d="M12 7.4l4 2.3v4.6l-4 2.3-4-2.3V9.7z"/></g>`;
export const star=(x,y,s=1,fill=C.ink)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" fill="${fill}"/></g>`;
export const check=(x,y,s=1,color=C.text)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></g>`;
// Window chips used at the right end of the footer: e.g. 5小时 93% / 周额度 40%.
export function quotaChip(x,y,label,pct,ringPct){
 return [
  ringGauge(x,y-4,5.4,ringPct,{stroke:1.9,color:'#9a9aa2'}),
  t(x+13,y,label,{size:11,weight:500}),
  t(x+13+labelWidth(label),y,pct,{size:11.5,weight:600})
 ].join('');
}
export function labelWidth(text){let w=0;for(const ch of text)w+=/[\u4e00-\u9fff]/.test(ch)?11:6.2;return w+4;}
// Footer strip content in native coordinates; origin = left padding, y = text baseline.
export function footerNative(x,y){
 const S=[];
 S.push(t(x,y,'上下文',{size:11,fill:C.muted}));
 S.push(bar(x+48,y-8,52,8,{segments:[{w:24.5,fill:C.blue},{w:0.5,fill:C.orange}]}));
 S.push(t(x+108,y,'498k/1m',{size:11.5,weight:600}));
 S.push(t(x+168,y,'48%',{size:11,fill:C.muted}));
 S.push(dot(x+202,y-4,C.faint));
 S.push(t(x+212,y,'12轮 · 工具118次 · 192词元/秒',{size:11,fill:C.muted}));
 S.push(line(x+410,y-11,x+410,y+5,{stroke:C.border}));
 S.push(t(x+424,y,'498.4K词元 · 命中95%',{size:11,fill:C.muted}));
 S.push(quotaChip(x+542,y,'5小时','93%',93));
 S.push(quotaChip(x+624,y,'周额度','40%',40));
 return S.join('');
}
export const dot=(x,y,color)=>`<circle cx="${x}" cy="${y}" r="2.1" fill="${color}"/>`;
export const clock=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/></g>`;
export const search=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.6"/><path d="M15.4 15.4 21 21"/></g>`;
export const paperclip=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5l-7.6 7.6a4.5 4.5 0 0 1-6.4-6.4l7.8-7.8a3.2 3.2 0 0 1 4.5 4.5l-7.6 7.6a1.9 1.9 0 0 1-2.7-2.7l7-7"/></g>`;
export const chevron=(x,y,s=1,color=C.muted,dir='down')=>{const rot={down:0,up:180,right:-90,left:90}[dir];return `<g transform="translate(${x} ${y}) rotate(${rot} 8 8) scale(${s})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></g>`;};
export const callout=(n,x,y,{fill=C.ink}={})=>`<g><circle cx="${x}" cy="${y}" r="11" fill="${fill}"/><text x="${x}" y="${y+4.2}" font-family="${FONT}" font-size="12.5" font-weight="700" fill="#ffffff" text-anchor="middle">${n}</text></g>`;
export const shadowFilter=`<filter id="sh" x="-30%" y="-30%" width="160%" height="200%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0b0b0c" flood-opacity="0.13"/></filter>`;
export const heroFilter=`<filter id="hero" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#05060a" flood-opacity="0.55"/></filter>`;
// Dark presentation canvas for hero images: gradient, faint grid and two glows.
export function darkCanvas(w,h,{grid=56}={}){
 const S=[];
 S.push(`<defs>
  <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0d12"/><stop offset="0.55" stop-color="#0e1118"/><stop offset="1" stop-color="#141018"/></linearGradient>
  <radialGradient id="hblue" cx="0.2" cy="0.1" r="0.75"><stop offset="0" stop-color="#1d4ed8" stop-opacity="0.45"/><stop offset="1" stop-color="#1d4ed8" stop-opacity="0"/></radialGradient>
  <radialGradient id="hamber" cx="0.9" cy="0.85" r="0.7"><stop offset="0" stop-color="#b45309" stop-opacity="0.55"/><stop offset="1" stop-color="#b45309" stop-opacity="0"/></radialGradient>
 </defs>`);
 S.push(r(0,0,w,h,{fill:'url(#hbg)'}));
 S.push(r(0,0,w,h,{fill:'url(#hblue)'}));
 S.push(r(0,0,w,h,{fill:'url(#hamber)'}));
 let g='';
 for(let x=0;x<=w;x+=grid)g+=line(x,0,x,h,{stroke:'#ffffff',sw:1});
 for(let y=0;y<=h;y+=grid)g+=line(0,y,w,y,{stroke:'#ffffff',sw:1});
 S.push(`<g opacity="0.045">${g}</g>`);
 S.push(r(0,0,w,4,{fill:'#2b7fff'}));
 return S.join('');
}
