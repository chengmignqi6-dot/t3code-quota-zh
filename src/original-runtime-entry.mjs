// Display-currency preferences and guarded original upstream burn/quota math; no localization or cache actions.
import {createCurrencyStore} from './source-currency-store.mjs';
import {computeBurnForecast} from '@source/burn';
import {getProviderQuota,buildTopbarPills} from '@source/quota-math';
import {showTopbarQuotaPopover,closeTopbarQuotaPopover} from '@source/topbar-popover';
import {guardedQuotaFunctions} from './native-quota-boundary.mjs';
if(globalThis.__t3QuotaUi!==undefined)throw new Error('Unexpected quota runtime: refusing to replace it');
let storage;try{storage=globalThis.localStorage;}catch{}
const store=createCurrencyStore(storage);
// Native stale snapshots may survive a reset while refresh is pending. Do not forecast from them.
function nativeBurnForecast(pool,nowInput){
 const now=Number.isFinite(nowInput)?nowInput:Date.now();
 const window=Array.isArray(pool?.columns)?pool.columns.find(column=>column?.window)?.window:pool;
 if(window?.resetsAt){const reset=Date.parse(window.resetsAt);if(!Number.isFinite(reset)||reset<=now)return null;}
 return computeBurnForecast(pool,nowInput);
}
Object.defineProperty(globalThis,'__t3QuotaUi',{value:Object.freeze({...store,showTopbarQuotaPopover,closeTopbarQuotaPopover,computeBurnForecast:nativeBurnForecast,...guardedQuotaFunctions(getProviderQuota,buildTopbarPills)}),configurable:false});
