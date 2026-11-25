// Presentation only. Never infer a quota period, amount, account, or reset time.
const TEXT=new Map(Object.entries({'Google account':'Google账号','Other model pools':'其他额度','Full limits panel':'全部额度','Refresh quota':'刷新','Refreshing quota':'刷新中','routed':'路由','Quota unavailable':'额度暂不可用','Temporarily unavailable':'暂不可用','Unavailable':'暂不可用','Session':'本次额度','session':'本次额度'}));
export function quotaTextZh(text){return TEXT.get(text)??text;}
export function quotaShortLabelZh(label){
 if(typeof label!=='string')return label;
 if(label==='7d')return'周额度';
 const match=label.match(/^(\d+(?:\.\d+)?)([mhd])$/);
 return match?match[1]+({m:'分',h:'小时',d:'天'}[match[2]]):quotaTextZh(label);
}
export function quotaPoolLabelZh(label){
 if(typeof label!=='string')return label;
 return label.replace(/Claude\s*&\s*GPT\s*\(shared\)/gi,'Claude/GPT（共享）').replace(/\b(\d+)\s*(?:-hour|hours?)\b/gi,'$1小时').replace(/\bWeekly\b/gi,'周额度').replace(/\bMonthly\b/gi,'月额度').replace(/\bDaily\b/gi,'每日额度');
}
export function quotaPrimaryLabelZh(label,shortLabel){
 const short=quotaShortLabelZh(shortLabel);
 // A shared backend pool is not a separate Claude account. The header already names the active model.
 if(typeof label==='string'&&/\bClaude\b/i.test(label)&&/\bGPT\b/i.test(label)&&!(typeof short==='string'&&/^(?:\d+(?:\.\d+)?(?:分|小时|天)|周额度|本次额度)$/.test(short)))return'额度';
 return typeof short==='string'&&(/^(?:\d+(?:\.\d+)?(?:分|小时|天)|周额度|本次额度)$/.test(short))?short:quotaPoolLabelZh(label);
}
export function quotaResetZh(formatted){
 if(formatted==='0m'||formatted==='now')return'即将重置';
 if(formatted==='<1m'||formatted==='< 1m')return'不足1分钟后重置';
 if(typeof formatted!=='string'||!/^\d+[dhm](?:\s+\d+[dhm])*$/.test(formatted))return'重置时间未知';
 return formatted.replace(/(\d+)d/g,'$1天').replace(/(\d+)h/g,'$1小时').replace(/(\d+)m/g,'$1分').replace(/\s+/g,'')+'后重置';
}
