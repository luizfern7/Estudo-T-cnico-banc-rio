from playwright.sync_api import sync_playwright
from pathlib import Path
from datetime import datetime,timezone
import json,copy,os
ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('APP_TEST_URL','http://127.0.0.1:8010/generic/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},timezone_id='America/Sao_Paulo');errors=[];dialogs=[]
 page.clock.install(time=datetime(2026,11,7,15,tzinfo=timezone.utc))
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:errors.append(f'Recurso {r.status}: {r.url}') if r.status>=400 and r.url.endswith(('.js','.css')) else None)
 page.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
 page.goto(URL);page.wait_for_selector('.empty-state')
 assert page.locator('.empty-state h2').inner_text()=='Sua jornada começa aqui.'
 assert page.evaluate('JourneyApp.snapshot().tracks.length')==0
 assert page.evaluate('typeof window.COURSE_DATA')=='undefined'
 page.screenshot(path='/tmp/generic-empty.png')
 def click(action):page.locator(f'[data-action="{action}"]').first.click()
 def snap():return page.evaluate('JourneyApp.snapshot()')
 def wait_idle():page.wait_for_function('!document.body.hasAttribute("aria-busy")')
 def home():click('home')
 def create_track(name,description):
  home();click('create-track');page.locator('#track-name').fill(name);page.locator('#track-description').fill(description);page.locator('#track-form [type="submit"]').click();page.wait_for_selector('.content-list')
  return next(t['id'] for t in snap()['tracks'] if t['nome']==name)
 def select(trackid):home();page.locator(f'[data-action="select-track"][data-id="{trackid}"]').click()
 def import_text(pack,confirm=True):
  click('import');page.locator('#json-text').fill(json.dumps(pack,ensure_ascii=False));click('validate-json');wait_idle();page.wait_for_selector('#import-preview h2')
  if confirm:click('confirm-import');wait_idle();page.wait_for_selector('.learning-path,.empty-state')
 def complete_reading():
  click('open-item');page.wait_for_selector('#reading');page.wait_for_timeout(80);page.evaluate('scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100);click('complete');wait_idle();page.wait_for_selector('.learning-path')
 a=create_track('Programação','Meu material de programação')
 click('new-item');page.locator('#item-title').fill('Minha leitura');page.locator('#item-body').fill('Meu texto de estudo escrito manualmente.');page.locator('#item-form [type="submit"]').click();wait_idle()
 aid=snap()['contents'][0]['id'];select(a);complete_reading()
 assert next(r for r in snap()['progress'] if r['trackId']==a)['done']
 click('manage-track');click('edit-item');page.locator('#item-title').fill('Minha leitura editada');page.locator('#item-form [type="submit"]').click();wait_idle();assert next(r for r in snap()['progress'] if r['trackId']==a)['done']
 click('edit-track');page.locator('#track-name').fill('Programação atualizada');page.locator('#track-description').fill('Descrição atualizada');page.locator('#track-form [type="submit"]').click();wait_idle();assert next(t for t in snap()['tracks'] if t['id']==a)['nome']=='Programação atualizada'
 b=create_track('Matemática','Revisão pessoal')
 click('new-item');page.locator('#item-title').fill('Meu exercício');click('add-question')
 page.locator('[data-field="prompt"]').fill('Qual alternativa foi indicada?');page.locator('[data-field="alternatives"]').fill('Primeira\nSegunda\nTerceira');page.locator('[data-field="correct"]').select_option('1');page.locator('[data-field="explanation"]').fill('A segunda alternativa é a indicada.');page.locator('#item-form [type="submit"]').click();wait_idle()
 select(b);click('open-item');page.locator('[data-action="choose"][data-choice="0"]').click();click('answer');wait_idle();assert page.locator('.feedback-wrong').count()==1
 click('retry');page.locator('[data-action="choose"][data-choice="1"]').click();click('answer');wait_idle();assert page.locator('.feedback-correct').count()==1
 assert len(snap()['global']['days'])==1
 p_b=next(r for r in snap()['progress'] if r['trackId']==b);assert len(p_b['history'])==2;assert not p_b['done']
 page.evaluate('scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100);click('complete');wait_idle()
 select(a);assert '100%' in page.locator('.progress-label').inner_text();select(b);assert '100%' in page.locator('.progress-label').inner_text()
 assert page.evaluate('JourneyStreak.streak({days:JourneyApp.snapshot().global.days}).current')==1
 saved_answers=copy.deepcopy(next(r for r in snap()['progress'] if r['trackId']==b))
 extension=page.evaluate('(id)=>JourneyApp.exportTrack(id)',b);extension['conteudos'].append({'id':'continuacao','titulo':'Continuação','tipo':'leitura','conteudo':'Mais conteúdo na mesma trilha.'})
 import_text(extension);assert next(r for r in snap()['progress'] if r['trackId']==b)==saved_answers
 assert len([c for c in snap()['contents'] if c['trackId']==b])==2
 pack={'versao_schema':1,'trilha':{'id':'informatica','nome':'Informática','descricao':'Conteúdo importado'},'conteudos':[{'id':'intro','titulo':'Leitura de abertura','tipo':'leitura','conteudo':'Texto para abrir a trilha.'},{'id':'q1','titulo':'Prática','tipo':'questao','enunciado':'Escolha B.','alternativas':['A','B'],'resposta_correta':1,'explicacao':'B é a escolha indicada.'}]}
 click('import');page.locator('#json-file').set_input_files({'name':'trilha.json','mimeType':'application/json','buffer':json.dumps(pack).encode()});page.wait_for_selector('#import-preview h2');click('confirm-import');wait_idle()
 assert len(snap()['tracks'])==3;complete_reading();before=copy.deepcopy(snap())
 update=copy.deepcopy(pack);update['trilha']['nome']='Nome alterado no arquivo';update['conteudos'][0]['titulo']='Título atualizado';update['conteudos'].append({'id':'final','titulo':'Nova etapa','tipo':'leitura','conteudo':'Continuação da jornada.'})
 import_text(update,False);assert '1 adicionados' in page.locator('.preview-counts').inner_text();page.locator('[data-conflict="intro"]').select_option('update');assert '1 atualizados' in page.locator('.preview-counts').inner_text();click('confirm-import');wait_idle()
 after=snap();assert len(after['tracks'])==3;assert len([c for c in after['contents'] if c['trackId']=='informatica'])==3
 assert next(t for t in after['tracks'] if t['id']=='informatica')['nome']=='Informática'
 assert next(c for c in after['contents'] if c['trackId']=='informatica' and c['id']=='intro')['titulo']=='Título atualizado'
 assert after['progress']==before['progress']
 assert [c['id'] for c in sorted([c for c in after['contents'] if c['trackId']=='informatica'],key=lambda c:c['order'])]==['intro','q1','final']
 # Repetição idêntica, conflitos mantidos ou ignorados não duplicam etapas.
 import_text(update);assert len([c for c in snap()['contents'] if c['trackId']=='informatica'])==3
 conflict=copy.deepcopy(update);conflict['conteudos'][0]['titulo']='NÃO substituir'
 for choice in ['keep','ignore']:
  import_text(conflict,False);page.locator('[data-conflict="intro"]').select_option(choice);click('confirm-import');wait_idle();assert next(c for c in snap()['contents'] if c['id']=='intro')['titulo']=='Título atualizado'
 # Nome e descrição só mudam por autorização explícita.
 import_text(update,False);page.locator('#update-metadata').check();click('confirm-import');wait_idle();assert next(t for t in snap()['tracks'] if t['id']=='informatica')['nome']=='Nome alterado no arquivo'
 # Validação de JSON e IDs duplicados.
 click('import');page.locator('#json-text').fill('{invalid');click('validate-json');wait_idle();assert not page.locator('#form-error').is_hidden()
 invalid=copy.deepcopy(pack);invalid['conteudos'].append(invalid['conteudos'][0]);page.locator('#json-text').fill(json.dumps(invalid));click('validate-json');wait_idle();assert 'duplicado' in page.locator('#form-error').inner_text()
 # Falha real em transação IndexedDB: nenhum conteúdo parcial.
 failure=copy.deepcopy(pack);failure['trilha']['id']='falha-transacao'
 import_text(failure,False);page.evaluate("()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const r=originalPut.apply(this,args);this.transaction.abort();return r}}")
 click('confirm-import');wait_idle();page.evaluate('()=>{IDBObjectStore.prototype.put=originalPut}')
 assert not any(t['id']=='falha-transacao' for t in snap()['tracks'])
 # Exportar conteúdo não inclui progresso. Backup completo inclui todas as trilhas.
 select('informatica')
 with page.expect_download() as download:click('export-track')
 exported=json.loads(Path(download.value.path()).read_text());assert 'progresso' not in exported;assert len(exported['conteudos'])==3
 click('settings')
 with page.expect_download() as download:click('backup')
 saved=json.loads(Path(download.value.path()).read_text());assert len(saved['trilhas'])==3 and saved['dias_estudados'];assert any(t['progresso'] for t in saved['trilhas'])
 # Exportação de conteúdo importada em uma instalação limpa não leva progresso junto.
 fresh=browser.new_page();fresh.goto(URL);fresh.wait_for_selector('.empty-state');fresh.locator('[data-action="import"]').first.click();fresh.locator('#json-text').fill(json.dumps(exported));fresh.locator('[data-action="validate-json"]').click();fresh.wait_for_selector('#import-preview h2');fresh.on('dialog',lambda d:d.accept());fresh.locator('[data-action="confirm-import"]').click();fresh.wait_for_function('!document.body.hasAttribute("aria-busy")');assert fresh.evaluate('JourneyApp.snapshot().tracks.length')==1;assert fresh.evaluate('JourneyApp.snapshot().progress.length')==0;fresh.close()
 # Persistência após reabrir e exclusão sem afetar o histórico global.
 baseline=snap();page.reload();page.wait_for_selector('.track-card');assert snap()['progress']==baseline['progress'];assert snap()['global']['days']==baseline['global']['days']
 select(b);click('manage-track');click('delete-track');wait_idle();assert len(snap()['tracks'])==2;assert snap()['global']['days']==baseline['global']['days']
 click('settings');page.locator('#backup-file').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(saved).encode()});wait_idle();page.wait_for_selector('.track-card');assert len(snap()['tracks'])==3;assert snap()['progress']==baseline['progress']
 # Revisão concluída no dia seguinte mantém a ofensiva sem depender de conteúdo novo.
 page.clock.fast_forward(24*60*60*1000);select(a);complete_reading();assert page.evaluate('JourneyStreak.streak({days:JourneyApp.snapshot().global.days}).current')==2
 days_before=copy.deepcopy(snap()['global']['days']);page.clock.fast_forward(48*60*60*1000);home();assert page.evaluate('JourneyStreak.streak({days:JourneyApp.snapshot().global.days}).current')==0;assert snap()['global']['days']==days_before
 # 3.000 etapas e paginação de 50: nenhum limite fixo na jornada.
 huge={'versao_schema':1,'trilha':{'id':'grande','nome':'Trilha extensa'},'conteudos':[{'id':f'e-{i}','titulo':f'Etapa {i+1}','tipo':'leitura','conteudo':'Texto.'} for i in range(3000)]}
 import_text(huge);assert page.locator('.journey-step').count()==50;page.locator('[data-action="journey-page"]').last.click();assert page.locator('.journey-step').count()==50;assert '51–100' in page.locator('.page-controls').inner_text()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Mesmo conteúdo em trilhas diferentes tem progresso independente; importação é offline.
 other=copy.deepcopy(exported);other['trilha']['id']='outra-trilha';other['trilha']['nome']='Outra trilha';import_text(other);assert not any(r['trackId']=='outra-trilha' for r in snap()['progress'])
 context=page.context;context.set_offline(True);select(a);click('open-item');page.wait_for_selector('#reading');assert page.locator('#reading').inner_text();context.set_offline(False)
 home();page.screenshot(path='/tmp/generic-tracks.png',full_page=True)
 # Edição e exclusão de etapa, além de persistência das preferências.
 select(a);click('manage-track');click('delete-item');wait_idle();assert not any(c['trackId']==a for c in snap()['contents']);assert snap()['global']['days']
 click('settings');page.locator('#sounds').uncheck();wait_idle();page.locator('#dark-theme').check();wait_idle();page.reload();page.wait_for_selector('.track-card');click('settings');assert not page.locator('#sounds').is_checked();assert page.locator('body.dark').count()==1
 # A exportação Android usa o seletor de compartilhamento, não um download WebView.
 page.evaluate('''()=>{window.nativeExports=[];window.Capacitor.isNativePlatform=()=>true;window.Capacitor.Plugins.Filesystem={writeFile:async value=>{nativeExports.push(value);return {uri:'content://jornada/test.json'}}};window.Capacitor.Plugins.Share={share:async value=>{window.sharedExport=value}}}''')
 click('backup');wait_idle();assert page.evaluate('nativeExports[0].directory')=='CACHE';assert page.evaluate('sharedExport.files[0]')=='content://jornada/test.json'
 assert not errors,errors
 print('PASS: instalação limpa, criação manual, questões, leitura, progresso por trilha, importações arquivo/texto, conflitos, metadados, rollback, persistência, exclusão, backup, exportação, ofensiva global, offline e 3.000 etapas.')
 browser.close()
