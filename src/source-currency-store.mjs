// Native data adapter for the original upstream currency controls, not a replacement UI.
// Defaults to official USD. 7.25 is the upstream REFERENCE fallback, never a live FX quote.
const CURRENCY_KEY='t3code:quota-ui-currency',RATE_KEY='t3code:quota-ui-fx-rate',DEFAULT_RATE=7.25;
export function createCurrencyStore(storage){
 const read=key=>{try{return storage?.getItem(key);}catch{return null;}};
 const savedCurrency=read(CURRENCY_KEY),savedRate=read(RATE_KEY),parsedRate=savedRate===null||savedRate?.trim()===''?NaN:Number(savedRate);
 let currency=savedCurrency==='CNY'?'CNY':'USD';
 const rate=Number.isFinite(parsedRate)&&parsedRate>0?parsedRate:DEFAULT_RATE;
 const listeners=new Set();
 const snapshot=()=>Object.freeze({currency,rate,rateSource:Number.isFinite(parsedRate)&&parsedRate>0?'saved-reference':'upstream-reference-fallback'});
 return Object.freeze({
  adapterVersion:1,
  isCny:()=>currency==='CNY',getRate:()=>rate,getSnapshot:snapshot,
  setCurrency(next){
   if(!['CNY','USD'].includes(next))throw new TypeError('Unsupported display currency');
   if(currency===next)return;
   currency=next;try{storage?.setItem(CURRENCY_KEY,currency);}catch{/* Display still works with blocked storage. */}
   for(const listener of [...listeners]){try{listener(snapshot());}catch{/* One renderer cannot break other subscribers. */}}
  },
  subscribe(listener){if(typeof listener!=='function')throw new TypeError('Expected currency listener');listeners.add(listener);return()=>listeners.delete(listener);},
 });
}
export function installCurrencyStore(target=globalThis){
 if(target.__t3QuotaUi!==undefined)throw new Error('Unexpected quota runtime: refusing to overwrite it');
 let storage;try{storage=target.localStorage;}catch{}
 const store=createCurrencyStore(storage);Object.defineProperty(target,'__t3QuotaUi',{value:store,configurable:true});return store;
}
