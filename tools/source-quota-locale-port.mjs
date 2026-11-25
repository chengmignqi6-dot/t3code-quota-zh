// Fixed-source display-only adaptation. Unknown anchors fail closed; quota math/data stay upstream.
import{createRequire}from'node:module';const ts=createRequire(import.meta.url)('../work/source-build-deps/node_modules/typescript');
export function adaptConciseQuotaChinese(source){
 const ast=ts.createSourceFile('cards.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),changes=[],report=[];
 const owner=name=>{const matches=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);if(matches.length!==1)throw Error('Quota locale owner drift: '+name);return matches[0];};
 function replace(code,from,to,count=1){if(code.split(from).length-1!==count)throw Error('Quota locale anchor drift: '+from);return code.split(from).join(to);}
 function adapt(name,transform){const node=owner(name),before=node.getText(ast),after=transform(before,node);if(before===after)throw Error('Quota locale did not change '+name);changes.push({start:node.getStart(ast),end:node.getEnd(),text:after});report.push(name);}
 adapt('QuotaFuelInstrument',s=>{
  s=replace(s,'children: window.label','children: quotaPrimaryLabelZh(window.label, formatShortWindowLabel(window))');
  s=replace(s,'`Resets in ${formatDuration(metrics.resetsInMs)}`','quotaResetZh(formatDuration(metrics.resetsInMs))');
  return replace(s,'`${metrics.used}% used`','`已用${metrics.used}%`');
 });
 adapt('ModelQuotaDetailCard',(s,node)=>{
  const remove=[];function visit(n){if(ts.isConditionalExpression(n)&&['quota.siblingWindows.length > 0','quota.otherSubscriptions.length > 0'].includes(n.condition.getText(ast))){remove.push({start:n.getStart(ast)-node.getStart(ast),end:n.getEnd()-node.getStart(ast)});return;}ts.forEachChild(n,visit);}visit(node);
  if(remove.length!==2)throw Error('Other-model display anchors drift');
  for(const r of remove.sort((a,b)=>b.start-a.start))s=s.slice(0,r.start)+'null'+s.slice(r.end);
  s=replace(s,'children: [quota.label,','children: [quotaTextZh(quota.label),');
  s=replace(s,'children: quota.plan','children: quotaTextZh(quota.plan)');
  s=replace(s,'children: quota.sourceLabel ?? "routed"','children: quotaTextZh(quota.sourceLabel ?? "routed")');
  s=replace(s,'children: quota.unavailableNotice','children: quotaTextZh(quota.unavailableNotice)');
  return replace(s,'"Full limits panel"','"全部额度"');
 });
 adapt('SubscriptionQuotaControl',s=>{
  s=replace(s,'quota.primaryWindows.length + quota.siblingWindows.length - inlineWindows.length','quota.primaryWindows.length - inlineWindows.length');
  s=replace(s,'children: formatShortWindowLabel(window)','children: quotaShortLabelZh(formatShortWindowLabel(window))');
  s=replace(s,'`${window.label} ${remainingPercent(window)}% left`','`${quotaPrimaryLabelZh(window.label, formatShortWindowLabel(window))} 剩余${remainingPercent(window)}%`');
  s=replace(s,'`${quota.label} quota unavailable`','`${quotaTextZh(quota.label)}额度暂不可用`');
  s=replace(s,'`Model quota: ${badgeText}`','`额度：${badgeText}`');
  return replace(s,'children: [quota.label, " \\u00B7 offline"]','children: [quotaTextZh(quota.label), " · 暂不可用"]');
 });
 adapt('QuotaRefreshButton',s=>replace(s,'"Refresh quota"','"刷新"',2));
 let code=source;for(const c of changes.sort((a,b)=>b.start-a.start))code=code.slice(0,c.start)+c.text+code.slice(c.end);
 code='import {quotaTextZh,quotaShortLabelZh,quotaPoolLabelZh,quotaPrimaryLabelZh,quotaResetZh} from "@source/quota-locale";\n'+code;
 return{code,report:{locale:'zh-CN',owners:report,scope:'quota presentation only',otherModelPoolsShown:false,otherSubscriptionsShown:false,underlyingQuotaMathChanged:false}};
}
