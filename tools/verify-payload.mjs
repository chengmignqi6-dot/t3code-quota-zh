import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {sha256} from './asar.mjs';import {loadPayload} from './patch-policy.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));const {manifest}=loadPayload(root);
if(process.argv.includes('--built')){for(const f of manifest.files){const b=fs.readFileSync(path.join(root,'work/source-port/native-stage',f.file));if(sha256(b)!==f.sha256)throw Error('Rebuild differs from release: '+f.file);}}
console.log(JSON.stringify({ok:true,files:manifest.files.length,rebuiltCompared:process.argv.includes('--built'),patchedServerSha256:manifest.patchedServerSha256},null,2));
