"""Fluxos reais no navegador, contexto descartável, sem alterar dados de usuário."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,copy,time
ROOT=Path(__file__).resolve().parents[1]
KEY='banestes2026_plataforma_v1'
example=json.loads((ROOT/'examples/matematica-basica.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[];dialogs=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:(dialogs.append(d.message),d.accept()))
 page.add_init_script('window.widgetSnapshots=[];window.StudyWidgets={update(json){widgetSnapshots.push(JSON.parse(json))}}')
 page.goto('http://127.0.0.1:8000/');page.wait_for_selector('.evolution-card')
 base_count=page.evaluate('COURSE_DATA.modules.reduce((n,m)=>n+m.lessons.length,0)')
 # Simula a atualização de um usuário que concluiu a jornada básica no APK anterior.
 page.evaluate('''key=>{const s=buildStudyBackup().progress;for(const m of COURSE_DATA.modules)for(const l of m.lessons)s.done[l.id]=true;s.notes['m1-l1']='Nota anterior preservada';delete s.evolution;localStorage.setItem(key,JSON.stringify(s))}''',KEY)
 page.reload();page.wait_for_selector('.evolution-card');initial=page.evaluate('buildStudyBackup().progress.evolution');initial_xp=sum(initial['grants'].values())
 def click(act):page.locator(f'[data-act="{act}"]').first.click()
 def settings():page.locator('[data-page="more"]').click();click('settings')
 def import_pack(pack):
  settings();count=len(dialogs);page.locator('#content-file').set_input_files({'name':'pacote.json','mimeType':'application/json','buffer':json.dumps(pack,ensure_ascii=False).encode()})
  page.wait_for_function('!document.querySelector("#content-status")?.textContent.includes("Validando")')
  page.wait_for_timeout(100)
  assert len(dialogs)>count
 def snapshot():return page.evaluate('buildStudyBackup()')
 import_pack(example);assert snapshot()['packages'][0]['packageId']==example['packageId']
 assert page.locator('.package-list article').count()==1
 assert snapshot()['progress']['notes']['m1-l1']=='Nota anterior preservada'
 assert sum(snapshot()['progress']['evolution']['grants'].values())==initial_xp
 page.reload();page.wait_for_selector('.evolution-card');assert len(snapshot()['packages'])==1
 assert page.locator('.next-card').inner_text().find('Adição')>=0
 # Questões e conclusão das duas etapas importadas, com concessão única de XP.
 for title,key in [('Adição','C'),('Subtração','A')]:
  click('continue');page.wait_for_selector('#reading');assert title in page.locator('#content h1').inner_text()
  wrapper=page.locator('.integrated-q').first
  wrapper.locator(f'[data-act="inline-choose"][data-key="{key}"]').click();wrapper.locator('[data-act="inline-confirm"]').click()
  if title=='Adição':
   current=sum(snapshot()['progress']['evolution']['grants'].values())
   wrapper.locator('[data-act="inline-retry"]').click();wrapper.locator('[data-act="inline-choose"][data-key="C"]').click();wrapper.locator('[data-act="inline-confirm"]').click()
   assert sum(snapshot()['progress']['evolution']['grants'].values())==current
  page.evaluate('''()=>{const s=buildStudyBackup().progress;s.read[s.lastLesson]=100;window.dispatchEvent(new Event('scroll'))}''')
  page.wait_for_timeout(150);click('complete-lesson');page.wait_for_selector('.completion-card')
 e=snapshot()['progress']['evolution'];assert sum(e['grants'].values())==initial_xp+202
 assert len(e['days'])==1 and len(next(iter(e['days'].values())))==2
 assert len([k for k in e['grants'] if k.startswith('daily:')])==1
 assert page.evaluate('widgetSnapshots.at(-1).today')==2
 # Atualização idempotente e atualização de texto com progresso mantido.
 before=snapshot();import_pack(example);assert len(snapshot()['packages'])==1
 updated=copy.deepcopy(example);updated['disciplinas'][0]['modulos'][0]['etapas'][0]['titulo']='Adição revisada'
 import_pack(updated);assert snapshot()['progress']['done']==before['progress']['done']
 assert snapshot()['progress']['evolution']==before['progress']['evolution']
 assert snapshot()['packages'][0]['disciplinas'][0]['modulos'][0]['etapas'][0]['titulo']=='Adição revisada'
 # Atualização que removeria IDs deve ser recusada sem modificar os dados.
 destructive=copy.deepcopy(updated);destructive['disciplinas'][0]['modulos'][0]['etapas'].pop();import_pack(destructive)
 assert 'removeria' in dialogs[-1];assert len(snapshot()['packages'][0]['disciplinas'][0]['modulos'][0]['etapas'])==2
 bad=copy.deepcopy(example);bad['disciplinas'][0]['modulos'][0]['etapas'][0]['questoes'][0]['respostaCorreta']=99
 import_pack(bad);assert 'respostaCorreta' in dialogs[-1];assert len(snapshot()['packages'])==1
 # Falha transacional não deve ativar pacote parcial em memória.
 failure=copy.deepcopy(example);failure['packageId']='rollback-test'
 settings();page.evaluate("()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const request=original.apply(this,args);this.transaction.abort();return request}}")
 page.locator('#content-file').set_input_files({'name':'failure.json','mimeType':'application/json','buffer':json.dumps(failure).encode()});page.wait_for_timeout(300)
 assert len(snapshot()['packages'])==1;assert any(word in dialogs[-1] for word in ['cancelada','Falha'])
 page.reload();page.wait_for_selector('.evolution-card');assert len(snapshot()['packages'])==1
 # 3.000 etapas: Worker não bloqueia interface; DOM inicial é limitado a 60 por módulo aberto.
 big=copy.deepcopy(example);big['packageId']='grande-3000';first=big['disciplinas'][0]['modulos'][0]['etapas'][0]
 big['disciplinas'][0]['modulos'][0]['etapas']=[dict(first,id=f'etapa-{i}') for i in range(3000)]
 page.evaluate('window.heartbeats=0;setInterval(()=>heartbeats++,10)');start=time.monotonic();import_pack(big)
 assert page.evaluate('heartbeats')>0;assert len(snapshot()['packages'])==2
 page.locator('[data-page="dashboard"]').click();page.wait_for_selector('[data-path-module]')
 assert page.locator('.journey-step').count()<=60
 details=page.locator('[data-path-module]').last
 if details.get_attribute('open') is None:details.locator('summary').click()
 assert details.locator('.journey-step').count()==60
 assert '3000' in details.inner_text();assert page.locator('.journey-step').count()<=120
 details.locator('[data-act="path-page"]').last.click();assert details.locator('.journey-step').count()==60
 assert '61' in details.locator('.page-controls').inner_text()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Remoção explícita mantém XP e registros; reimportação restaura as marcações.
 settings();click('content');page.locator('[data-package="matematica-basica-01"]').click();page.wait_for_function('buildStudyBackup().packages.length===1');assert len(snapshot()['packages'])==1
 assert snapshot()['progress']['evolution']==before['progress']['evolution']
 import_pack(updated);assert snapshot()['progress']['done']==before['progress']['done']
 settings();page.locator('#daily-goal').fill('4');click('save-goal');page.reload();page.wait_for_selector('.evolution-card');settings();assert page.locator('#daily-goal').input_value()=='4'
 page.locator('[data-page="dashboard"]').click();page.screenshot(path='/tmp/evolution-mobile.png',full_page=True)
 assert not errors,errors
 print(f'PASS: migração, XP, meta, widgets via bridge, persistência, importação e atualização, duplicatas, rejeição destrutiva, rollback, remoção/reimportação, backup completo e 3.000 etapas ({time.monotonic()-start:.1f}s incluindo testes de UI).')
 browser.close()
