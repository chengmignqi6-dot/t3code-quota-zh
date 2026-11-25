// Data-only boundary. Preserve original quota math; discard stale/unavailable native snapshots first.
export function usableQuotaEntry(entry,now=Date.now()){
 if(!entry||entry.enabled===false||entry.installed===false||entry.isAvailable===false||entry.status==='disabled'||entry.availability==='unavailable'||entry.snapshot?.availability==='unavailable'||entry.auth?.status==='unauthenticated'||entry.snapshot?.auth?.status==='unauthenticated')return null;
 const limits=entry.usageLimits??entry.snapshot?.usageLimits;if(!limits||limits.unavailable||!Array.isArray(limits.windows))return null;
 const windows=limits.windows.filter(window=>{if(!window||!Number.isFinite(window.usedPercent)||window.id==='custom_api')return false;if(window.resetsAt){const reset=Date.parse(window.resetsAt);if(!Number.isFinite(reset)||reset<=now)return false;}return true;});
 return windows.length?{...entry,usageLimits:{...limits,windows}}:null;
}
export function guardedQuotaFunctions(originalQuota,originalPills){return {
 getProviderQuota(entry,model,nowInput){const now=Number.isFinite(nowInput)?nowInput:Date.now(),safe=usableQuotaEntry(entry,now);return safe?originalQuota(safe,model,now):null;},
 buildTopbarPills(entries,nowInput){const now=Number.isFinite(nowInput)?nowInput:Date.now();return originalPills(Array.isArray(entries)?entries.map(entry=>usableQuotaEntry(entry,now)).filter(Boolean):[],now);}
};}
