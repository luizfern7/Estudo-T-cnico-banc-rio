'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('JornadaDesktop',{
 openJson:async()=>{try{return await ipcRenderer.invoke('jornada:open-json')}catch(error){throw Error(error.message.replace(/^Error invoking remote method[^:]*:\s*/,''))}},
 saveJson:async (request)=>{try{return await ipcRenderer.invoke('jornada:save-json',request)}catch(error){throw Error('Não foi possível salvar o JSON. '+error.message.replace(/^Error invoking remote method[^:]*:\s*/,'') )}},
 onShortcut:callback=>{if(typeof callback!=='function')return;ipcRenderer.on('jornada:shortcut',(_event,action)=>callback(action));}
});
