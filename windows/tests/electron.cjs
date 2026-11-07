'use strict';
const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const runtime=process.env.JORNADA_ELECTRON||'/workspace/windows-tools/electron-linux/electron',appPath=process.env.JORNADA_APP||'/workspace/artifacts/Jornada-de-Estudos-Windows/resources/app';
const base=fs.mkdtempSync('/tmp/jornada-desktop-e2e-');let portable=path.join(base,'Pasta portátil A');fs.mkdirSync(portable);fs.cpSync(appPath,path.join(portable,'resources','app'),{recursive:true});
async function launch(root){const app=await _electron.launch({executablePath:runtime,args:['--no-sandbox','--disable-gpu','--ozone-platform=headless','--ozone-override-screen-size=1920,1080',path.join(root,'resources','app')],env:{...process.env,JORNADA_TEST_DATA:root},timeout:30000});const page=await app.firstWindow();await page.waitForSelector('.empty-state,.track-card');return {app,page};}
(async()=>{
 let {app,page}=await launch(portable);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));await page.evaluate(()=>{window.testDialogs=[];window.confirm=message=>{testDialogs.push(message);return true};window.alert=message=>{testDialogs.push(message)}});
 console.log('Janela:',await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].getBounds()));
 await page.setViewportSize({width:1280,height:850});
 assert.equal(await page.evaluate(()=>typeof require),'undefined');assert.equal(await page.evaluate(()=>typeof process),'undefined');assert.equal(await page.evaluate(()=>JourneyApp.snapshot().tracks.length),0);
 const locations=await app.evaluate(({app})=>({profile:app.getPath('userData'),session:app.getPath('sessionData'),temp:app.getPath('temp'),logs:app.getPath('logs')}));for(const value of Object.values(locations))assert.ok(value.startsWith(path.join(portable,'Dados')));
 await page.screenshot({path:'/tmp/jornada-desktop-empty.png'});
 const click=async action=>page.locator(`[data-action="${action}"]`).first().click();const idle=()=>page.waitForFunction(()=>!document.body.hasAttribute('aria-busy'));const snapshot=()=>page.evaluate(()=>JourneyApp.snapshot());
 console.log('Cadastro manual');await click('create-track');await page.locator('#track-name').fill('Curso no computador');await page.locator('#track-description').fill('Meu material portátil');await page.locator('#track-form [type="submit"]').click();await idle();
 await click('new-item');await page.locator('#item-title').fill('Questão de teste');await click('add-question');await page.locator('[data-field="prompt"]').fill('Selecione a segunda alternativa.');await page.locator('[data-field="alternatives"]').fill('Primeira\nSegunda\nTerceira');await page.locator('[data-field="correct"]').selectOption('1');await page.locator('[data-field="explanation"]').fill('A segunda alternativa é a indicada.');await page.locator('#item-form [type="submit"]').click();await idle();
 console.log('Questão criada');const id=(await snapshot()).tracks[0].id;
 await click('home');await click('select-track');await click('open-item');await page.waitForSelector('.integrated-q');await page.locator('body').click({position:{x:500,y:120}});await page.keyboard.press('2');assert.equal(await page.locator('.option.selected').getAttribute('data-choice'),'1');await page.keyboard.press('Enter');await idle();await page.waitForSelector('.feedback-correct');assert.ok((await page.locator('.feedback').innerText()).includes('A segunda alternativa é a indicada.'));
 await page.waitForFunction(()=>!document.querySelector('[data-action="complete"]').disabled);await page.keyboard.press('Enter');await idle();assert.equal((await snapshot()).progress[0].done,true);assert.equal(await page.evaluate(()=>JourneyStreak.streak({days:JourneyApp.snapshot().global.days}).current),1);
 console.log('Teclado e conclusão OK');
 // Menu nativo e atalho Ctrl+O usam o mesmo seletor de arquivo da versão Android.
 const pack={versao_schema:1,trilha:{id:'json-desktop',nome:'JSON do Android'},conteudos:[{id:'texto',titulo:'Leitura importada',tipo:'leitura',conteudo:'Material compatível entre Android e Windows.'}]};const jsonFile=path.join(base,'conteudo.json');fs.writeFileSync(jsonFile,JSON.stringify(pack));
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]})},jsonFile);await app.evaluate(({Menu})=>Menu.getApplicationMenu().items[0].submenu.items[0].click());await page.waitForSelector('#import-preview h2');await click('confirm-import');await idle();assert.equal((await snapshot()).tracks.length,2);
 console.log('Importação por arquivo OK');
 // Texto colado, continuação e ausência de duplicatas.
 const extra=structuredClone(pack);extra.conteudos.push({id:'nova',titulo:'Nova etapa',tipo:'leitura',conteudo:'Continuação.'});await click('import');await page.locator('#json-text').fill(JSON.stringify(extra));await click('validate-json');await idle();await click('confirm-import');await idle();assert.equal((await snapshot()).contents.filter(c=>c.trackId==='json-desktop').length,2);
 await page.keyboard.press('Escape');assert.equal(await page.locator('.track-card').count(),2);
 console.log('Importação por texto OK');
 // Exportação usa SaveDialog e gravação atômica nativos, sem pasta AppData.
 const exportPath=path.join(base,'backup-completo.json');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},exportPath);
 await click('settings');await click('backup');await idle();assert.ok(fs.existsSync(exportPath));const saved=JSON.parse(fs.readFileSync(exportPath));assert.equal(saved.trilhas.length,2);assert.ok(saved.trilhas.some(t=>t.progresso.some(p=>p.done)));
 await page.locator('#sounds').uncheck();await idle();await page.locator('#dark-theme').check();await idle();
 // Atalhos não interceptam digitação em formulários.
 await click('import');await page.locator('#json-text').fill('');await page.locator('#json-text').focus();await page.keyboard.type('12345');await page.keyboard.press('Enter');assert.ok((await page.locator('#json-text').inputValue()).startsWith('12345\n'));
 await page.setViewportSize({width:760,height:600});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1440,height:900});await click('home');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/jornada-desktop-tracks.png'});
 console.log('Exportação e layout OK');const before=await snapshot();assert.equal(errors.length,0,errors.join('\n'));await app.close();
 // Mover a pasta de dados mantendo uma origem estável não pode perder o IndexedDB.
 const moved=path.join(base,'Outra pasta','Jornada movida');fs.mkdirSync(path.dirname(moved),{recursive:true});fs.renameSync(portable,moved);({app,page}=await launch(moved));assert.equal(await page.evaluate(()=>JourneyApp.snapshot().tracks.length),2);const after=await page.evaluate(()=>JourneyApp.snapshot());assert.deepEqual(after.progress,before.progress);assert.deepEqual(after.global.days,before.global.days);assert.equal(after.global.sounds,false);assert.equal(after.global.theme,'dark');
 await app.evaluate(({session})=>{session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));});await page.locator('[data-action="select-track"]').first().click();await page.waitForSelector('.learning-path');assert.ok(await page.locator('.step-link').count());
 await app.close();console.log('PASS: runtime Electron real, início vazio, cadastro, estudo, teclado, JSON arquivo/texto, exportação nativa, persistência, tema/áudio, redimensionamento e mudança da pasta com progresso intacto.');
})().catch(error=>{console.error(error);process.exitCode=1;setTimeout(()=>process.exit(1),1000)});
