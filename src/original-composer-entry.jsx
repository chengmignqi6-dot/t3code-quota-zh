// Existing composer remains pinned upstream. The separately exported quota overview
// intentionally uses the latest restrained information-first design, not source-exact markup.
export {NativeQuotaOverview} from './quota-overview.jsx';
export {createNativeQuotaProviders} from './native-quota-overview-input.mjs';
import {useMemo} from 'react';
import {ComposerTelemetryStrip} from '@source/cards';
import {__T3TelemetryPill} from '@source/summary';
import {originalSummaryProps} from './original-summary-props.mjs';
import {deriveTurnTelemetryIndex,lookupTurnTelemetry,countThreadToolCalls} from '@source/metrics';
import {createNativeTelemetryReader} from './native-telemetry-bridge.mjs';
const readTelemetry=createNativeTelemetryReader({deriveTurnTelemetryIndex,lookupTurnTelemetry,countThreadToolCalls});
export function NativeComposerTelemetry({projection,contextWindow,isWorking,activeRunId,providerInstanceId,activeModel,providers,sources}){
 const data=useMemo(()=>readTelemetry({projection,contextWindow,isWorking,activeRunId}),[projection,contextWindow,isWorking,activeRunId]);
 const summary=originalSummaryProps(data);
 return <ComposerTelemetryStrip {...data} summary={summary?<__T3TelemetryPill {...summary}/>:null} providerInstanceId={providerInstanceId} activeModel={activeModel} providers={providers} sources={sources}/>;
}
