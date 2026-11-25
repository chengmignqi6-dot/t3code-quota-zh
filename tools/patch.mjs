#!/usr/bin/env node
// Never kills/restarts T3, changes credentials or sends AI messages.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {sha256} from './asar.mjs';import {PINS,noLinks,loadPayload,requireRestore,createCandidate} from './patch-policy.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));const args=process.argv.slice(2),mode=args.shift()??'check';
function option(name){const n=args.indexOf(name);if(n<0)return null;if(!args[n+1]||args[n+1].startsWith('--'))throw Error('Missing '+name);const value=args[n+1];args.splice(n,2);return value;}
function read(file){noLinks(file);if(!fs.statSync(file).isFile())throw Error('Expected regular file: '+file);return fs.readFileSync(file);}
function ensureClosed(){if(process.platform!=='win32')throw Error('Installation/restore is Windows-only');const command="$ErrorActionPreference='Stop'; $p=@(Get-Process | Where-Object { $_.ProcessName -like 'T3 Code*' -or $_.ProcessName -eq 't3code' }); if($p.Count -gt 0){exit 3}";try{execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{stdio:'ignore',windowsHide:true});}catch{throw Error('Close ALL T3 Code windows/processes first, or process check failed. No automatic termination.');}}
try{
 if(!['check','install','restore','prepare'].includes(mode))throw Error('Use check, install, restore or prepare');
 const explicit=option('--resources'),original=option('--original'),output=option('--output');const apply=args.includes('--apply');if(apply)args.splice(args.indexOf('--apply'),1);if(args.length)throw Error('Unknown arguments: '+args.join(' '));const {manifest,changes}=loadPayload(root);
 if(mode==='prepare'){if(!original||!output||apply||explicit)throw Error('prepare requires --original <archive> --output <new-file>; no --apply');const candidate=createCandidate(read(original),changes);noLinks(output);fs.writeFileSync(output,candidate,{flag:'wx'});console.log(JSON.stringify({ok:true,mode,sha256:sha256(candidate),applicationModified:false}));}
 else {
  if(original||output)throw Error('--original/--output apply only to prepare');const resources=noLinks(explicit??path.join(process.env.LOCALAPPDATA??'','Programs','t3code','resources'));if(!explicit&&!process.env.LOCALAPPDATA)throw Error('Set --resources explicitly');const server=path.join(resources,'server.asar'),desktop=path.join(resources,'app.asar'),backup=path.join(resources,'server.asar.quota-zh.original'),state=path.join(resources,'t3code-quota-zh.json');
  const current=read(server),currentHash=sha256(current);if(sha256(read(desktop))!==PINS.desktop)throw Error('Unsupported desktop build; refusing');if(![PINS.original,PINS.patched].includes(currentHash))throw Error('Unknown/modified/upgraded server archive; refusing');
  if(mode==='check'){console.log(JSON.stringify({ok:true,mode,version:manifest.t3Version,status:currentHash===PINS.patched?'patched':'supported-original',serverSha256:currentHash,backupPresent:fs.existsSync(backup),applicationModified:false},null,2));}
  else {
   if(!apply)throw Error('Write operation requires --apply. Close T3 Code first.');ensureClosed();let desired;
   if(mode==='install'){
    if(currentHash!==PINS.original)throw Error('Already patched; not reinstalling');desired=createCandidate(current,changes);
    if(fs.existsSync(backup)){if(sha256(read(backup))!==PINS.original)throw Error('Existing backup is corrupt; refusing');}else fs.writeFileSync(noLinks(backup),current,{flag:'wx'});
    if(fs.existsSync(state)){const s=JSON.parse(read(state));if(s.formatVersion!==1||s.original!==PINS.original||s.patched!==PINS.patched)throw Error('Existing state does not belong to this release');}
    else fs.writeFileSync(noLinks(state),JSON.stringify({formatVersion:1,original:PINS.original,patched:PINS.patched,desktop:PINS.desktop},null,2)+'\n',{flag:'wx'});
   }else {const s=JSON.parse(read(state));if(s.formatVersion!==1||s.original!==PINS.original||s.patched!==PINS.patched||s.desktop!==PINS.desktop)throw Error('Unknown backup ownership record');desired=read(backup);requireRestore(current,desired);}
   // Stage on the same filesystem; preserve mode. Never truncate the installed archive.
   const temp=noLinks(path.join(resources,`server.asar.quota-zh-${crypto.randomUUID()}.tmp`));let renamed=false;
   try{fs.writeFileSync(temp,desired,{flag:'wx',mode:fs.statSync(server).mode});const fd=fs.openSync(temp,'r+');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}if(sha256(read(temp))!==sha256(desired))throw Error('Staging hash mismatch');ensureClosed();if(sha256(read(desktop))!==PINS.desktop||sha256(read(server))!==currentHash||sha256(read(backup))!==PINS.original)throw Error('Files changed during operation; refusing replacement');fs.renameSync(temp,server);renamed=true;if(sha256(read(server))!==sha256(desired))throw Error('Post-replacement hash mismatch; close T3 and preserve backup for manual recovery');console.log(JSON.stringify({ok:true,mode,serverSha256:sha256(desired),restart:'manual',backupRetained:true},null,2));}
   finally{if(!renamed&&fs.existsSync(temp))fs.unlinkSync(temp);}
  }
 }
}catch(error){console.error('REFUSED: '+error.message);process.exitCode=1;}
