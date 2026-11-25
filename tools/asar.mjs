import fs from 'node:fs';
import crypto from 'node:crypto';
export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
export function parseAsar(data){
 if(data.readUInt32LE(0)!==4)throw Error('Invalid ASAR size pickle');
 const headerLength=data.readUInt32LE(12), offset=8+data.readUInt32LE(4);
 if(offset>data.length||headerLength>offset-16)throw Error('Invalid ASAR header');
 const header=JSON.parse(data.subarray(16,16+headerLength).toString());
 const entries=new Map();
 function walk(node,p=''){for(const[k,v]of Object.entries(node.files??{})){const key=p+k;if(v.files)walk(v,key+'/');else entries.set(key,v);}}
 walk(header);
 const get=p=>{const n=entries.get(p);if(!n||n.unpacked||n.link)throw Error('Not a packed file: '+p);const start=offset+Number(n.offset);if(!Number.isSafeInteger(start)||start<offset||start+n.size>data.length)throw Error('Invalid file bounds');return data.subarray(start,start+n.size);};
 return {data,header,offset,entries,get};
}
export function allowed(p){return /^apps\/server\/dist\/client\/(?:[\w.-]+\/)*[\w.-]+\.(html|js|css)$/.test(p)&&!p.split('/').some(x=>x==='..'||x==='.');}
export function integrity(data,blockSize=4194304){const blocks=[];for(let i=0;i<data.length;i+=blockSize)blocks.push(sha256(data.subarray(i,i+blockSize)));return{algorithm:'SHA256',hash:sha256(data),blockSize,blocks};}
export function repack(source,changes){
 const parsed=Buffer.isBuffer(source)?parseAsar(source):source;
 const header=structuredClone(parsed.header), contents=[], pending=new Map(changes);let offset=0;
 for(const[p,b]of pending)if(!allowed(p)||!Buffer.isBuffer(b))throw Error('Disallowed patch path/content: '+p);
 function walk(node,p=''){for(const[k,n]of Object.entries(node.files??{})){const key=p+k;if(n.files){walk(n,key+'/');continue;}if(n.unpacked||n.link){if(pending.has(key))throw Error('Cannot patch unpacked/link');continue;}
 const changed=pending.has(key),data=changed?pending.get(key):parsed.get(key);pending.delete(key);
 n.offset=String(offset);n.size=data.length;offset+=data.length;if(changed)n.integrity=integrity(data,n.integrity?.blockSize??4194304);contents.push(data);}}
 walk(header);
 for(const[p,data]of pending){let folder=header;const parts=p.split('/'),file=parts.pop();for(const part of parts){folder.files??={};folder.files[part]??={files:{}};folder=folder.files[part];if(!folder.files)throw Error('Parent is not directory');}folder.files[file]={size:data.length,offset:String(offset),integrity:integrity(data)};contents.push(data);offset+=data.length;}
 const json=Buffer.from(JSON.stringify(header)), padded=Math.ceil((4+json.length)/4)*4, head=Buffer.alloc(4+padded);
 head.writeUInt32LE(padded,0);head.writeUInt32LE(json.length,4);json.copy(head,8);
 // Header pickle consists of payload-size + string-size + padded JSON.
 const size=Buffer.alloc(8);size.writeUInt32LE(4,0);size.writeUInt32LE(head.length,4);
 return Buffer.concat([size,head,...contents]);
}
export function assertDiff(original,staged,changes){
 for(const p of changes.keys())if(!allowed(p))throw Error('Disallowed patch path '+p);
 const a=parseAsar(original),b=parseAsar(staged);let count=0;
 for(const[p,n]of a.entries){const m=b.entries.get(p);if(!m)throw Error('Missing original entry '+p);if(n.unpacked||n.link){if(JSON.stringify(n)!==JSON.stringify(m))throw Error('Metadata changed '+p);continue;}const x=a.get(p),y=b.get(p);if(changes.has(p)){if(!y.equals(changes.get(p)))throw Error('Patch mismatch '+p);if(JSON.stringify({...n,offset:0,size:0,integrity:null})!==JSON.stringify({...m,offset:0,size:0,integrity:null}))throw Error('Unexpected changed-file metadata '+p);count++;}else if(!x.equals(y)||JSON.stringify({...n,offset:0})!==JSON.stringify({...m,offset:0}))throw Error('Unapproved change '+p);}
 for(const[p,n]of b.entries)if(!a.entries.has(p)){if(!changes.has(p)||!allowed(p)||n.unpacked||n.link||!b.get(p).equals(changes.get(p)))throw Error('Unapproved added entry '+p);count++;}
 if(count!==changes.size)throw Error('Patch count mismatch');return count;
}
export function readAsar(file){return parseAsar(fs.readFileSync(file));}
