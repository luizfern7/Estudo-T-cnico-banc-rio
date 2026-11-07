'use strict';
const {app,BrowserWindow,protocol,net,session,dialog,ipcMain,Menu}=require('electron');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const Portable=require('./portable.cjs');
const JsonFile=require('./json-file.cjs');
app.setName('Jornada de Estudos');
// As pastas são definidas antes da primeira sessão do Chromium. Sem AppData obrigatório.
const root=app.isPackaged?path.dirname(process.execPath):(process.env.JORNADA_TEST_DATA||path.resolve(__dirname,'..','DadosDesenvolvimento'));
let locations;
try{locations=Portable.prepare(root);for(const [key,value] of Object.entries({appData:locations.data,userData:locations.profile,sessionData:locations.session,temp:locations.temp,logs:locations.logs,crashDumps:locations.crashes}))app.setPath(key,value)}catch(error){dialog.showErrorBox('Pasta sem permissão de gravação','Não foi possível abrir os dados portáteis.\n\nExtraia ou mova a pasta completa para um local em que você possa gravar, como Documentos ou um pendrive desbloqueado. Nenhum dado será salvo em outra pasta automaticamente.\n\n'+error.message);app.exit(1)}
protocol.registerSchemesAsPrivileged([{scheme:'jornada',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
const files=new Set(['index.html','styles.css','variant.css','desktop.css','android.js','streak.js','model.js','store.js','app.js','desktop.js']);
const own=url=>{try{const u=new URL(url);return u.protocol==='jornada:'&&u.host==='app'}catch{return false}};
let win;
function send(action){if(win&&!win.isDestroyed())win.webContents.send('jornada:shortcut',action)}
function menus(){Menu.setApplicationMenu(Menu.buildFromTemplate([
 {label:'Arquivo',submenu:[{label:'Importar JSON…',accelerator:'CommandOrControl+O',click:()=>send('open-json')},{label:'Backup completo…',accelerator:'CommandOrControl+Shift+B',click:()=>send('backup')},{type:'separator'},{label:'Fechar',role:'quit',accelerator:'Alt+F4'}]},
 {label:'Editar',submenu:[{role:'undo',label:'Desfazer'},{role:'redo',label:'Refazer'},{type:'separator'},{role:'cut',label:'Recortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Colar'},{role:'selectAll',label:'Selecionar tudo'}]},
 {label:'Exibir',submenu:[{role:'resetZoom',label:'Zoom padrão'},{role:'zoomIn',label:'Aumentar zoom'},{role:'zoomOut',label:'Diminuir zoom'},{type:'separator'},{role:'togglefullscreen',label:'Tela inteira',accelerator:'F11'}]},
 {label:'Ajuda',submenu:[{label:'Atalhos de teclado',click:()=>dialog.showMessageBox(win,{type:'info',title:'Atalhos',message:'Jornada de Estudos',detail:'Ctrl+O — importar JSON\nCtrl+Shift+B — backup completo\n1 a 5 — selecionar alternativa\nEnter — confirmar resposta ou concluir a etapa\nEsc — voltar\nF11 — tela inteira\nCtrl+ + / Ctrl+ - — zoom\n\nOs atalhos de estudo não interferem nos campos de digitação.'})},{label:'Sobre',click:()=>dialog.showMessageBox(win,{type:'info',title:'Jornada de Estudos',message:'Jornada de Estudos · Windows portátil 1.0.1',detail:'Todos os conteúdos, progressos e configurações ficam na pasta Dados, ao lado do executável.\n\nFeche o programa antes de copiar ou mover a pasta completa. Não mova apenas o executável.'})}]}
 ]))}
async function create(){
 win=new BrowserWindow({width:1280,height:840,minWidth:720,minHeight:560,title:'Jornada de Estudos',backgroundColor:'#f5f7fb',show:false,icon:path.join(__dirname,'book.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,spellcheck:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{if(!own(url))event.preventDefault()});
 win.webContents.on('will-attach-webview',event=>event.preventDefault());
 win.webContents.on('render-process-gone',()=>dialog.showErrorBox('Aplicativo interrompido','O processo da janela foi interrompido. Reabra o aplicativo. As operações já confirmadas permanecem na pasta Dados.'));
 win.once('ready-to-show',()=>win.show());
 await win.loadURL('jornada://app/index.html');
}
if(!app.requestSingleInstanceLock()){app.exit(0)}else{
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
 app.whenReady().then(async()=>{
  await session.defaultSession.clearCache(); // Só cache HTTP: não altera IndexedDB ou progresso.
  protocol.handle('jornada',async request=>{const url=new URL(request.url),file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(url.host!=='app'||!files.has(file))return new Response('Arquivo indisponível',{status:404});const response=await net.fetch(pathToFileURL(path.join(__dirname,'web',file)).toString());const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; worker-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'");return new Response(response.body,{status:response.status,headers})});
  session.defaultSession.setPermissionRequestHandler((_web,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  ipcMain.handle('jornada:open-json',async event=>{
   if(!win||event.sender!==win.webContents||!own(event.senderFrame.url))throw Error('Origem não autorizada.');
   const result=await dialog.showOpenDialog(win,{title:'Selecionar JSON da trilha',defaultPath:app.getPath('downloads'),filters:[{name:'Conteúdo JSON',extensions:['json']}],properties:['openFile']});
   if(result.canceled||!result.filePaths.length)return null;
   const selected=result.filePaths[0],stat=await fs.promises.stat(selected);if(!stat.isFile()||stat.size>20*1024*1024)throw Error('Selecione um arquivo JSON de até 20 MB.');
   return JsonFile.inspect(await fs.promises.readFile(selected),path.basename(selected));
  });
  ipcMain.handle('jornada:save-json',async(event,request)=>{
   if(!win||event.sender!==win.webContents||!own(event.senderFrame.url))throw Error('Origem não autorizada.');
   if(!request||typeof request.text!=='string'||Buffer.byteLength(request.text)>20*1024*1024)throw Error('Exportação inválida ou maior que 20 MB.');
   JSON.parse(request.text);const filename=Portable.safeName(request.name);
   const result=await dialog.showSaveDialog(win,{title:'Salvar JSON — Jornada de Estudos',defaultPath:path.join(locations.root,filename),filters:[{name:'Arquivo JSON',extensions:['json']}],properties:['showOverwriteConfirmation','createDirectory']});
   if(result.canceled||!result.filePath)return {canceled:true};
   await Portable.atomicWrite(result.filePath,request.text);return {canceled:false};
  });
  menus();await create();
 }).catch(error=>{dialog.showErrorBox('Não foi possível iniciar','Verifique a permissão de escrita da pasta e extraia todos os arquivos do pacote.\n\n'+error.message);app.exit(1)});
}
app.on('window-all-closed',()=>app.quit());
