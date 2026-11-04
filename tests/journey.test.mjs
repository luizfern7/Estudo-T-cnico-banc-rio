import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const root = new URL('../www/', import.meta.url);
let server, browser, url;
const KEY = 'banestes2026_plataforma_v1';
before(async () => {
  server = createServer(async (req, res) => {
    const script = req.url === '/android.js';
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html');
    res.end(await readFile(new URL(script ? 'android.js' : 'index.html', root)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); await new Promise(resolve => server.close(resolve)); });
async function withPage(run, state) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (state) await page.addInitScript(({key, value}) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value)); }, {key:KEY, value:state});
  try { await page.goto(url); await run(page); assert.deepEqual(errors, []); }
  finally { await context.close(); }
}
const act = (page, action) => page.locator(`[data-act="${action}"]`).first();
const nav = (page, name) => page.locator(`.journey-nav [data-page="${name}"]`).click();
async function data(page) { return page.evaluate(() => ({ ids: COURSE_DATA.modules.flatMap(m => m.lessons.map(l => l.id)), modules: COURSE_DATA.modules.length, questions: COURSE_DATA.questions.length, library: COURSE_DATA.library.length, cases: COURSE_DATA.cases.length })); }
async function readAndAnswer(page) {
  await page.locator('#lesson-practice').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  const cards = page.locator('.integrated-q');
  for (let i=0; i<await cards.count(); i++) {
    const card = cards.nth(i);
    await card.locator('[data-act="inline-choose"]').first().click();
    await card.locator('[data-act="inline-confirm"]').click();
  }
  await act(page,'complete-lesson').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
}

test('all original course data is byte-for-byte preserved', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const script = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)][0][1];
  assert.equal(createHash('sha256').update(script).digest('hex'), '4c7b4ea8a91e360c4e36fc05d4e039a82da6143004d239fa9e019f0a5aeb82d4');
  await withPage(async p => { const d=await data(p); assert.equal(d.modules,18); assert.equal(d.ids.length,112); assert.equal(d.questions,185); assert.equal(d.library,8); assert.equal(d.cases,10); });
});

test('fresh path has one current lesson; later lessons stay locked through every entry', async () => {
  await withPage(async p => {
    assert.equal(await p.locator('.journey-nav button').count(),3);
    assert.equal(await p.locator('.step-link:not(:disabled)').count(),1);
    assert.equal(await p.locator('.step-link:disabled').count(),111);
    assert.equal(await p.locator('[aria-current="step"]').count(),1);
    // A stale UI link cannot bypass the central openLesson guard.
    await p.evaluate(() => { const b=document.createElement('button'); b.dataset.act='open-lesson'; b.dataset.id=COURSE_DATA.modules[1].lessons[0].id;document.body.append(b);b.click();b.remove(); });
    assert.equal(await p.locator('#reading').count(),0);
    assert.match(await p.locator('.toast').innerText(),/Conclua a aula atual/);
    await act(p,'continue').click();
    assert.equal(await act(p,'complete-lesson').isDisabled(),true);
    assert.equal(await p.locator('.lesson-tools[open]').count(),0);
    await readAndAnswer(p);
    assert.equal(await act(p,'complete-lesson').isEnabled(),true);
    await act(p,'complete-lesson').click();
    assert.match(await p.locator('h1').innerText(),/Aula concluída/);
    let saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.equal(saved.done['m1-l1'],true);
    await act(p,'continue').click();
    saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.equal(saved.lastLesson,'m1-l2');
    await nav(p,'dashboard');
    assert.equal(await p.locator('.step-link:not(:disabled)').count(),2);
    assert.equal(await p.locator('.is-current [data-id="m1-l2"]').count(),1);
  });
});

test('completion requires both reading and integrated answers', async () => {
  await withPage(async p => {
    await act(p,'continue').click();
    await p.locator('#lesson-practice').scrollIntoViewIfNeeded();await p.waitForTimeout(180);
    assert.equal(await act(p,'complete-lesson').isDisabled(),true);
    // Even a programmatic click on a forged button must not bypass requirements.
    await p.evaluate(() => {const b=document.createElement('button');b.dataset.act='complete-lesson';document.body.append(b);b.click();b.remove()});
    assert.equal(await p.locator('.completion-card').count(),0);
    await readAndAnswer(p);
    assert.equal(await act(p,'complete-lesson').isEnabled(),true);
  });
});

test('legacy progress and notes survive; continue targets first unfinished lesson and restores reading', async () => {
  const state={done:{'m1-l1':true,'m1-l3':true},lastLesson:'m1-l1',notes:{'m1-l1':'Minha anotação antiga'},answers:{},scroll:{},theme:'dark'};
  await withPage(async p=>{
    assert.equal(await p.locator('.is-current [data-id="m1-l2"]').count(),1);
    assert.equal(await p.locator('.is-done').count(),2);
    await act(p,'continue').click();
    assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).lastLesson,KEY),'m1-l2');
    await p.evaluate(()=>window.scrollTo({top:400,behavior:'instant'}));await p.waitForTimeout(200);
    const y=await p.evaluate(()=>scrollY);
    await nav(p,'dashboard');await act(p,'continue').click();await p.waitForTimeout(150);
    assert.ok(Math.abs((await p.evaluate(()=>scrollY))-y)<5);
    await p.reload();await act(p,'continue').click();await p.waitForTimeout(150);
    assert.ok(Math.abs((await p.evaluate(()=>scrollY))-y)<5);
    const saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    assert.equal(saved.notes['m1-l1'],'Minha anotação antiga');assert.equal(saved.done['m1-l3'],true);
    assert.equal(await p.locator('body.dark').count(),1);
  },state);
});

test('cross-module progression and the last lesson have a valid next action', async () => {
  await withPage(async p=>{
    const d=await data(p);
    await p.addInitScript(({key,ids})=>{const s=JSON.parse(localStorage.getItem(key));s.done=Object.fromEntries(ids.slice(0,-1).map(id=>[id,true]));localStorage.setItem(key,JSON.stringify(s))},{key:KEY,ids:d.ids});
    await p.reload();assert.equal(await p.locator('.is-current').count(),1);
    await act(p,'continue').click();await readAndAnswer(p);await act(p,'complete-lesson').click();
    assert.match(await p.locator('h1').innerText(),/completou a trilha/);
    await act(p,'dashboard').click();assert.equal(await p.locator('.is-done').count(),112);
    assert.equal(await p.locator('.is-current').count(),0);
  });
  await withPage(async p=>{
    const ids=await p.evaluate(()=>COURSE_DATA.modules[0].lessons.map(l=>l.id));
    await p.addInitScript(({key,ids})=>{const s=JSON.parse(localStorage.getItem(key));s.done=Object.fromEntries(ids.map(id=>[id,true]));localStorage.setItem(key,JSON.stringify(s))},{key:KEY,ids});
    await p.reload();assert.equal(await p.locator('.active-unit .unit-number').innerText(),'02');
    await act(p,'continue').click();assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).lastLesson,KEY),'m2-l1');
  });
});

test('supporting features, backup and mobile layouts remain available', async () => {
  await withPage(async p=>{
    await nav(p,'practice');
    for (const action of ['questions','sim-setup','review']) {await act(p,action).click();await act(p,'journey-back').click();assert.match(await p.locator('h1').innerText(),/pouco de prática/);}
    await nav(p,'more');
    for (const action of ['notes','library','stats']) {await act(p,action).click();assert.ok((await p.locator('#content').innerText()).length>50);await act(p,'journey-back').click();}
    await act(p,'settings').click();
    const downloaded=p.waitForEvent('download');await act(p,'export').click();const file=await downloaded;
    const backup=JSON.parse(await readFile(await file.path(),'utf8'));assert.equal(backup.app,'banestes-2026');
    p.on('dialog',dialog=>dialog.accept());
    await p.locator('#importfile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await p.waitForSelector('.learning-path');
    for(const width of [320,390,768,1280]){await p.setViewportSize({width,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.next-card').evaluate(e=>getComputedStyle(e).animationName),'none');
  });
});
