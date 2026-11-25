// Vector illustrations rebuilt from measured native UI geometry and sampled colors.
// Demo data only: no project names, accounts, paths, or conversation content.
export const C={bg:'#fcfcfc',panel:'#f9f9f9',card:'#ffffff',border:'#e4e4e7',borderStrong:'#d4d4d8',text:'#18181b',muted:'#71717b',faint:'#a1a1aa',blue:'#2b7fff',blueSoft:'#bfdbfe',orange:'#fe9a00',orangeSoft:'#fde0ad',violet:'#d4ceec',violetDeep:'#a78bfa',track:'#e9e9eb',hover:'#f4f4f5',ink:'#0b0b0c',stroke:'#d9d9de'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const FONT="'Segoe UI','Microsoft YaHei UI','PingFang SC',system-ui,sans-serif";
export const MONO="'Cascadia Mono',Consolas,'Courier New',monospace";
export const t=(x,y,s,{size=13,fill=C.text,weight=400,anchor='start',mono=false,spacing=0,opacity=1}={})=>`<text x="${x}" y="${y}" font-family="${mono?MONO:FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${spacing?` letter-spacing="${spacing}"`:''}${opacity!==1?` opacity="${opacity}"`:''}>${esc(s)}</text>`;
export const r=(x,y,w,h,{fill='none',stroke=null,rx=0,sw=1,opacity=1,dash=null}={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx?` rx="${rx}"`:''} fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw}"`:''}${dash?` stroke-dasharray="${dash}"`:''}${opacity!==1?` opacity="${opacity}"`:''}/>`;
export const line=(x1,y1,x2,y2,{stroke=C.border,sw=1,dash=null,cap='butt'}={})=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
export function svg(w,h,body,{title='',desc=''}={}){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc>${body}</svg>`;}
// Rounded progress bar used by the footer chip and context panel.
export function bar(x,y,w,h,{radius=null,segments=null}={}){
 const rr=radius??h/2;const parts=[r(x,y,w,h,{fill:C.track,rx:rr})];let cx=x;
 for(const s of segments){if(s.w<=0)continue;parts.push(`<path d="${capsule(cx,y,s.w,h,rr)}" fill="${s.fill}"/>`);cx+=s.w;}
 return parts.join('');
}
function capsule(x,y,w,h,r){r=Math.min(r,w/2,h/2);return `M${x+r},${y}h${w-2*r}a${r},${r} 0 0 1 ${r},${r}v${h-2*r}a${r},${r} 0 0 1 ${-r},${r}h${-(w-2*r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h-2*r)}a${r},${r} 0 0 1 ${r},${-r}z`;}
// Segmented quota meter: 20 equal cells with 2px gaps, exactly like the native popover.
export function segmented(x,y,w,h,{count=20,filled=18,partial=0.8}={}){
 const gap=2,cell=(w-gap*(count-1))/count;let out='';
 for(let i=0;i<count;i++){const cx=x+i*(cell+gap);const full=i<filled;const part=i===filled?partial:0;
  out+=r(cx,y,cell,h,{fill:full?C.orange:C.track,rx:1.5});
  if(part>0)out+=r(cx,y,cell*part,h,{fill:C.orange,rx:1.5});}
 return out;}
export const antigravity=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M12 3 2.5 21h5.2l4.3-8.1 4.3 8.1h5.2z" fill="#4285f4"/><path d="M12 3 7.7 11.1h3.6l1.9-3.6 1.9 3.6h3.6z" fill="#34a853"/><path d="M7.7 11.1 2.5 21h5.2l1.4-2.7z" fill="#fbbc05"/><path d="M16.3 11.1 15 13.2l1.4 2.7h5.2z" fill="#ea4335"/></g>`;
export const openai=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.7"><circle cx="12" cy="12" r="4.2"/><path d="M12 3.4v4.4M12 16.2v4.4M4.6 7.7l3.8 2.2M15.6 14.1l3.8 2.2M4.6 16.3l3.8-2.2M15.6 9.9l3.8-2.2"/></g>`;
export const star=(x,y,s=1,fill=C.ink)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" fill="${fill}"/></g>`;
export const check=(x,y,s=1,color=C.text)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></g>`;
// Footer strip content in native coordinates; origin = left padding, y = text baseline.
export function footerNative(x,y,{compact=false}={}){
 const S=[];
 S.push(t(x,y,'上下文',{size:11,fill:C.muted}));
 S.push(bar(x+48,y-8,52,8,{segments:[{w:23,fill:C.blue},{w:3,fill:C.orange}]}));
 S.push(t(x+108,y,'476k/1m',{size:11.5,weight:600}));
 S.push(t(x+168,y,'45%',{size:11,fill:C.muted}));
 S.push(dot(x+203,y-4,C.faint));
 S.push(t(x+213,y,'10轮 · 工具114次 · 155词元/秒',{size:11,fill:C.muted}));
 S.push(line(x+414,y-11,x+414,y+5,{stroke:C.border}));
 S.push(t(x+428,y,'476.3K词元 · 命中95%',{size:11,fill:C.muted}));
 S.push(clock(x+600,y-13,0.8,C.muted));
 S.push(t(x+620,y,'周额度',{size:11.5,weight:500}));
 S.push(t(x+703,y,'94%',{size:11.5,weight:600,anchor:'end'}));
 return S.join('');
}
export function renderFooter(x,y,k=1){
 return `<g transform="translate(${x} ${y}) scale(${k})">${footerNative(0,0)}</g>`;
}
export const clock=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/></g>`;
export const search=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.6"/><path d="M15.4 15.4 21 21"/></g>`;
export const paperclip=(x,y,s=1,color=C.muted)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5l-7.6 7.6a4.5 4.5 0 0 1-6.4-6.4l7.8-7.8a3.2 3.2 0 0 1 4.5 4.5l-7.6 7.6a1.9 1.9 0 0 1-2.7-2.7l7-7"/></g>`;
export const chevron=(x,y,s=1,color=C.muted,dir='down')=>{const rot={down:0,up:180,right:-90,left:90}[dir];return `<g transform="translate(${x} ${y}) rotate(${rot} 8 8) scale(${s})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform-origin="8 8"><path d="M4 6l4 4 4-4"/></g>`;};
export const callout=(n,x,y,{fill=C.ink}={})=>`<g><circle cx="${x}" cy="${y}" r="11" fill="${fill}"/><text x="${x}" y="${y+4.2}" font-family="${FONT}" font-size="12.5" font-weight="700" fill="#ffffff" text-anchor="middle">${n}</text></g>`;
export const dot=(x,y,color)=>`<circle cx="${x}" cy="${y}" r="2.1" fill="${color}"/>`;
export const shadowFilter=`<filter id="sh" x="-30%" y="-30%" width="160%" height="200%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0b0b0c" flood-opacity="0.13"/></filter>`;
