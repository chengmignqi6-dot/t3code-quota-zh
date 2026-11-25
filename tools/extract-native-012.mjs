// Read-only archive extraction for rebuilding; never touches the installation.
import fs from 'node:fs';import path from 'node:path';import {parseAsar,sha256} from './asar.mjs';
const args=process.argv.slice(2);if(args.length!==1)throw Error('Usage: node tools/extract-native-012.mjs <official server.asar>');
const bytes=fs.readFileSync(args[0]);if(sha256(bytes)!=='0714162c59487f54ffac6009dd283d5d5f12183d90486795ca13e07c23f1ca71')throw Error('Exact official 0.1.12 archive required; input refused');
const archive=parseAsar(bytes),prefix='apps/server/dist/client/',out=path.resolve('work/pristine-0.1.12');
for(const name of archive.entries.keys()){if(!name.startsWith(prefix)||!(/\/index\.html$/.test(name)||/\/assets\/[\w.-]+\.(js|css)$/.test(name)))continue;const data=archive.get(name),file=path.join(out,name);fs.mkdirSync(path.dirname(file),{recursive:true});if(fs.existsSync(file)){if(!fs.readFileSync(file).equals(data))throw Error('Existing extraction differs: '+name);}else fs.writeFileSync(file,data,{flag:'wx'});}
console.log('Verified exact native archive; frontend extracted only into ignored work directory.');
