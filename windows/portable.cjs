'use strict';
const path=require('node:path'),fs=require('node:fs');
function paths(root){const base=path.resolve(root),data=path.join(base,'Dados');return {root:base,data,profile:path.join(data,'Perfil'),session:path.join(data,'Navegador'),temp:path.join(data,'Temporarios'),logs:path.join(data,'Registros'),crashes:path.join(data,'Falhas'),exports:path.join(base,'Exportacoes')};}
function prepare(root){const p=paths(root);for(const name of ['data','profile','session','temp','logs','crashes'])fs.mkdirSync(p[name],{recursive:true});const probe=path.join(p.data,'.verificacao-'+process.pid+'-'+Date.now());const fd=fs.openSync(probe,'wx');fs.writeFileSync(fd,'ok');fs.closeSync(fd);fs.unlinkSync(probe);return p;}
function safeName(value){const base=String(value||'jornada.json').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/^\.+/,'').slice(0,180);return base.endsWith('.json')?base:'jornada.json';}
async function atomicWrite(target,text){const temp=target+'.'+process.pid+'-'+Date.now()+'.tmp';let handle;try{handle=await fs.promises.open(temp,'wx');await handle.writeFile(text,'utf8');await handle.sync();await handle.close();handle=null;await fs.promises.rename(temp,target)}catch(e){if(handle)await handle.close().catch(()=>{});await fs.promises.unlink(temp).catch(()=>{});throw e}}
module.exports={paths,prepare,safeName,atomicWrite};
