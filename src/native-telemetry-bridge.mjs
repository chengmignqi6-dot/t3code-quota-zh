// Read-only data adapter. All TTFT/cache/TPS math is injected from the pinned upstream module.
// No subscription, network, storage, UI, provider fallback, or authorization side effects.
export function createNativeTelemetryReader({deriveTurnTelemetryIndex,lookupTurnTelemetry,countThreadToolCalls}){
 for(const fn of [deriveTurnTelemetryIndex,lookupTurnTelemetry,countThreadToolCalls])if(typeof fn!=='function')throw Error('Missing original telemetry algorithm');
 return function readNativeTelemetry({projection,contextWindow=null,isWorking=false,activeRunId=null}){
  const ready=projection!=null&&['runs','attempts','providerTurns','turnItems'].every(k=>Array.isArray(projection[k]));
  const index=ready?deriveTurnTelemetryIndex(projection):null;
  // A last completed turn must never masquerade as the current run's live measurements.
  const liveTurn=isWorking&&index&&typeof activeRunId==='string'&&activeRunId.length>0?lookupTurnTelemetry(index,{runId:activeRunId}):null;
  return {
   ready,contextWindow,isWorking:Boolean(isWorking),liveTurn,
   latestTurn:index?.latest??null,latestCacheTurn:index?.latestWithCache??null,
   sessionCacheHitPercent:index?.sessionCacheHitPercent??null,
   sessionCacheTurnCount:index?.sessionCacheTurnCount??0,
   turnCount:ready?projection.providerTurns.length:null,
   toolCallCount:ready?countThreadToolCalls(projection):null,
   // No verified native binding yet: original component hides null, instead of inventing zero.
   skillCount:null,
  };
 };
}
