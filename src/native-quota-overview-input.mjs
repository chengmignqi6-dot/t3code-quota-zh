// Native-only input boundary. Configured external quota sources are NOT agent installations.
// Reuse the official account collector for source identity/deduplication; no fetch or storage.
export function createNativeQuotaProviders(providers,sources,collectAccounts){
 const entries=Array.isArray(providers)?providers:[],configured=Array.isArray(sources)?sources:[];
 if(!configured.length)return entries;
 if(typeof collectAccounts!=='function')throw Error('Native quota account collector required');
 const environmentId='quota-overview-current',resolved=collectAccounts(new Map([[environmentId,{entry:{target:{label:'Current environment'}},serverConfig:{providers:entries,usageLimitSources:configured}}]]));
 const byKey=new Map(resolved.map(account=>[account.key,account]));
 const native=entries.map(entry=>{const account=byKey.get(`${environmentId}:${entry.instanceId}`);return account?{...entry,usageLimits:account.limits}:entry;});
 const external=resolved.filter(account=>account.environments.length===0).map(account=>({
  // These flags satisfy the presentation adapter's eligibility contract only;
  // the origin marks an explicitly configured source account, not an installed agent.
  origin:'configured_quota_source',instanceId:`source:${account.key}`,enabled:true,installed:true,
  displayName:account.displayName||`${String(account.driver)}${account.email?' · '+account.email:account.sourceLabel?' · '+account.sourceLabel:''}`,driver:account.driver,usageLimits:account.limits
 }));
 return [...native,...external];
}
