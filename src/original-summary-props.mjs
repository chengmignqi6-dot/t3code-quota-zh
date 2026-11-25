// Data compatibility only. Original UI/algorithms own every displayed value.
function originalTurn(turn){return turn?{...turn,outputTokensPerSecond:Number.isFinite(turn.generationTps)?turn.generationTps:null}:null;}
export function originalSummaryProps(data){
 // The original component defaults missing counts to zero: do not mount it until counts are known.
 if(!data?.ready||!Number.isFinite(data.turnCount)||!Number.isFinite(data.toolCallCount))return null;
 return {usage:data.contextWindow,liveTurn:originalTurn(data.liveTurn),latestTurn:originalTurn(data.latestCacheTurn),turnCount:data.turnCount,toolCallCount:data.toolCallCount,cacheHitPercent:data.sessionCacheHitPercent,isWorking:data.isWorking};
}
