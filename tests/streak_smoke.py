from playwright.sync_api import sync_playwright
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':360,'height':800},timezone_id='America/Sao_Paulo');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install(time=datetime(2026,11,6,15,0,tzinfo=timezone.utc))
 page.add_init_script('window.reminderToggles=[];window.StudyWidgets={update(json){window.lastWidget=JSON.parse(json)},syncReminderPreference(value){window.syncedReminder=value},setRemindersEnabled(value){reminderToggles.push(value)}}')
 page.goto('http://127.0.0.1:8000/');page.wait_for_selector('.streak-count')
 assert '0' in page.locator('.streak-count').inner_text()
 # A versão anterior já tinha dias de conclusão: migração é derivada, sem apagar ou duplicar XP.
 page.evaluate("()=>{buildStudyBackup().progress.evolution.days={'2026-11-04':['old-a'],'2026-11-05':['old-b']}}")
 page.reload();page.wait_for_selector('.streak-risk')
 assert '2' in page.locator('.streak-count').inner_text();assert page.evaluate('lastWidget.streak.atRisk')
 before=page.evaluate('JSON.stringify(buildStudyBackup().progress.evolution.grants)')
 page.screenshot(path='/tmp/streak-risk-mobile.png')
 page.locator('[data-page="more"]').click();page.locator('[data-act="settings"]').click()
 page.locator('#streak-reminders').check();assert page.evaluate('reminderToggles')==[True]
 page.reload();page.wait_for_selector('.streak-count');assert page.evaluate('syncedReminder')
 page.locator('[data-page="more"]').click();page.locator('[data-act="settings"]').click();assert page.locator('#streak-reminders').is_checked()
 page.locator('#streak-reminders').uncheck();assert page.evaluate('reminderToggles')==[False]
 page.locator('[data-page="dashboard"]').click();page.locator('[data-act="continue"]').click()
 q=page.locator('.integrated-q').first;q.locator('[data-act="inline-choose"]').first.click();q.locator('[data-act="inline-confirm"]').click()
 page.evaluate("()=>{const s=buildStudyBackup().progress;s.read[s.lastLesson]=100;window.dispatchEvent(new Event('scroll'))}")
 page.wait_for_timeout(200);page.locator('[data-act="complete-lesson"]').click()
 assert page.locator('.level-celebration').filter(has_text='3 dias de ofensiva').count()==1
 assert page.evaluate('lastWidget.streak.current')==3
 page.locator('[data-page="dashboard"]').click();assert '3' in page.locator('.streak-count').inner_text();assert page.locator('.streak-done').count()==1
 notices=page.evaluate('JSON.stringify(buildStudyBackup().progress.evolution.streakNotices)')
 page.reload();page.wait_for_selector('.streak-done');assert page.locator('.level-celebration').count()==0
 assert page.evaluate('JSON.stringify(buildStudyBackup().progress.evolution.streakNotices)')==notices
 xp=page.evaluate('JSON.stringify(buildStudyBackup().progress.evolution.grants)')
 page.clock.fast_forward(24*60*60*1000);page.locator('[data-page="dashboard"]').click();assert page.locator('.streak-risk').count()==1
 page.clock.fast_forward(24*60*60*1000);page.locator('[data-page="dashboard"]').click()
 assert '0' in page.locator('.streak-count').inner_text();assert 'Recorde: 3' in page.locator('.streak-best').inner_text()
 assert page.evaluate('JSON.stringify(buildStudyBackup().progress.evolution.grants)')==xp
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/streak-reset-mobile.png')
 assert not errors,errors
 print('PASS: risco, conclusão, incremento, comemoração única, lembretes, persistência, virada do dia, quebra e preservação do XP; layout móvel sem overflow.')
 b.close()
