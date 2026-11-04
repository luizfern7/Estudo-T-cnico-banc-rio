from playwright.sync_api import sync_playwright
from pathlib import Path
import json, os
url=os.environ.get('APP_TEST_URL','http://127.0.0.1:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''window.audioEvents=[];const AC=window.AudioContext;window.AudioContext=class extends AC{createOscillator(){const o=super.createOscillator();const start=o.start.bind(o);o.start=(...args)=>{window.audioEvents.push(o.frequency.value);start(...args)};return o}}''')
 page.goto(url)
 data=page.evaluate('window.COURSE_DATA')
 q=data['questions'][0]; correct=q['answer'];wrong=next(o['key'] for o in q['options'] if o['key']!=correct)
 def click(act):page.locator(f'[data-act="{act}"]').first.click()
 def bank():
  page.locator('[data-page="practice"]').click();click('questions');page.locator(f'[data-act="open-question"][data-id="{q["id"]}"]').click()
 def confirm(key):
  page.locator(f'[data-act="choose"][data-key="{key}"]').click();click('confirm-answer');page.wait_for_timeout(100)
 def sounds():return page.evaluate('audioEvents.length')
 bank();confirm(correct)
 assert page.locator('.feedback-correct').count()==1
 assert 'Sua escolha: '+correct in page.locator('.feedback-summary').inner_text()
 assert page.locator('.answer-label').count()==1
 assert sounds()==2,sounds()
 assert page.locator('.feedback').evaluate('(e)=>getComputedStyle(e).animationName')=='answer-success'
 explanation=page.locator('.feedback .reader').inner_html();assert explanation==(q.get('explanationHtml') or '<p>'+q['explanation']+'</p>')
 # A queued duplicate confirmation must not record or play again.
 page.evaluate("document.querySelector('.question-card').insertAdjacentHTML('beforeend','<button data-act=\"confirm-answer\" id=\"duplicate\">duplicate</button>');document.querySelector('#duplicate').click()")
 assert sounds()==2
 click('favorite-question');assert sounds()==2
 click('retry-answer');confirm(wrong)
 assert page.locator('.feedback-wrong').count()==1
 assert page.locator('.answer-label').count()==2
 assert sounds()==4
 good=page.locator('.feedback').evaluate('(e)=>getComputedStyle(e).backgroundColor');assert good!='rgb(232, 244, 242)'
 assert page.locator('.feedback .reader').inner_html()==explanation
 page.locator('[data-page="more"]').click();click('settings')
 assert page.locator('#sound-effects').is_checked()
 page.locator('#sound-effects').uncheck();page.reload()
 page.locator('[data-page="more"]').click();click('settings');assert not page.locator('#sound-effects').is_checked()
 bank();before=sounds();confirm(correct);assert sounds()==before
 page.locator('[data-page="more"]').click();click('settings');page.locator('#sound-effects').check()
 bank();confirm(wrong);assert sounds()==before+2
 page.emulate_media(reduced_motion='reduce');click('retry-answer');confirm(correct)
 assert page.locator('.feedback').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
 page.locator('[data-page="dashboard"]').click();click('continue')
 wrapper=page.locator('.integrated-q').first; qid=wrapper.get_attribute('data-inline-id');iq=next(x for x in data['questions'] if x['id']==qid)
 if wrapper.locator('[data-act="inline-retry"]').count():wrapper.locator('[data-act="inline-retry"]').click()
 for key,result in [(iq['answer'],'correct'),(next(o['key'] for o in iq['options'] if o['key']!=iq['answer']),'wrong')]:
  page.locator(f'[data-inline-id="{qid}"] [data-act="inline-choose"][data-key="{key}"]').click()
  before=sounds();page.locator(f'[data-inline-id="{qid}"] [data-act="inline-confirm"]').click();page.wait_for_timeout(60)
  assert sounds()==before+2
  assert page.locator(f'[data-inline-id="{qid}"] .feedback-{result}').count()==1
  if result=='correct':page.locator(f'[data-inline-id="{qid}"] [data-act="inline-retry"]').click()
 page.locator('.lesson-tools summary').first.click();before=sounds();click('favorite-lesson');assert sounds()==before
 assert not page.locator('.feedback-fresh').count()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/feedback-mobile.png',full_page=True)
 page.locator('[data-page="more"]').click();click('settings');click('toggle-theme')
 bank();confirm(wrong);assert page.locator('body.dark .feedback-wrong').count()==1
 page.screenshot(path='/tmp/feedback-dark.png')
 # Simulados preservam o gabarito oculto e não tocam sons por seleção.
 page.locator('[data-page="practice"]').click();click('sim-setup');page.locator('#sim-count').select_option('10');click('start-sim')
 before=sounds();click('choose');assert sounds()==before;assert not page.locator('.feedback').count()
 page.on('dialog',lambda d:d.accept());click('finish-sim')
 assert page.locator('.feedback').count()==10
 assert page.locator('.feedback-wrong').count()>=9
 assert sounds()==before
 assert 'Não respondida' in page.locator('.feedback-summary').last.inner_text()
 assert not errors,errors
 print('PASS: acertos e erros, explicações completas, identificação de alternativas, 1 som/confirmacão, sem áudio na renderização, preferência imediata e persistida, aulas e banco, animações e movimento reduzido, tema escuro e layout móvel; nenhum erro JS.')
 browser.close()
