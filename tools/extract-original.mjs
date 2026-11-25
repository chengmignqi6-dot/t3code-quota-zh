// Development only: extracts a small pinned frontend input set from an archive you supply.
import fs from 'node:fs';import path from 'node:path';import {parseAsar,sha256} from './asar.mjs';
const file=process.argv[2];if(!file)throw Error('Usage: node tools/extract-original.mjs <official-original-server.asar>');
const data=fs.readFileSync(file);if(sha256(data)!=='51437657773bb073a633674678da4370ecfce0f622fd403b87d315a9d3f8d631')throw Error('Unsupported or modified original archive');
const a=parseAsar(data),prefix='apps/server/dist/client/';const names=['index.html',...['network-DzfmnD4s.js','_chat-CpVn0Bm5.js','_chat.usage-Cuvca1lh.js','ProviderModelPicker-CkHxDKn3.js','usageLimits-i1WvFdCN.js','UsageLimits-SEld7yZt.js','usageFormat-C8gd1nnt.js','main-C7LLcwbG.css'].map(x=>'assets/'+x)];
for(const name of names){const target=path.resolve('work/pristine',prefix+name);fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)&&!fs.readFileSync(target).equals(a.get(prefix+name)))throw Error('Existing extracted input differs: '+name);fs.writeFileSync(target,a.get(prefix+name));}
console.log('Extracted 9 pinned frontend build inputs. No application installation modified.');
