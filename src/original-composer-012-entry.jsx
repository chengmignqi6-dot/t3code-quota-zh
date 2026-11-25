// 0.1.12 wrapper: same pinned telemetry UI, current native router, no backend mutations.
import {useMemo,useCallback} from 'react';
import {n as useNativeNavigate} from './useNavigate-C3WU9Yd7.js';
import {ComposerTelemetryStrip} from '@source/cards';
import {__T3TelemetryPill} from '@source/summary';
import {originalSummaryProps} from './original-summary-props.mjs';
import {deriveTurnTelemetryIndex,lookupTurnTelemetry,countThreadToolCalls} from '@source/metrics';
import {createNativeTelemetryReader} from './native-telemetry-bridge.mjs';
const readTelemetry=createNativeTelemetryReader({deriveTurnTelemetryIndex,lookupTurnTelemetry,countThreadToolCalls});
export function NativeComposerTelemetry({projection,contextWindow,isWorking,activeRunId,providerInstanceId,activeModel,providers,sources}){
 const data=useMemo(()=>readTelemetry({projection,contextWindow,isWorking,activeRunId}),[projection,contextWindow,isWorking,activeRunId]);
 const navigate=useNativeNavigate();
 const openLimits=useCallback(async()=>{const page=await import('./_chat.usage-B0MA-7bB.js');page.__t3SelectNativeLimits();void navigate({to:'/usage'});},[navigate]);
 const summary=originalSummaryProps(data);
 return <ComposerTelemetryStrip {...data} summary={summary?<__T3TelemetryPill {...summary}/>:null} providerInstanceId={providerInstanceId} activeModel={activeModel} providers={providers} sources={sources} onOpenUsageLimits={openLimits}/>;
}
