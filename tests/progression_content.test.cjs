const assert=require('node:assert/strict');
const P=require('../progression.js'),V=require('../content-validator.js'),example=require('../examples/matematica-basica.json');
const p=V.validate(example),courseModule=p.modules[0],lessons=courseModule.lessons.map(l=>({...l,module:courseModule.id}));
const state={done:{},answers:{},history:[]};P.init(state,[courseModule]);
assert.equal(P.level(state.evolution).name,'Iniciante');
const q=p.questions[0];assert.equal(P.answer(state,q,true,[courseModule]),10);assert.equal(P.answer(state,q,false,[courseModule]),0);
state.done[lessons[0].id]=true;assert.equal(P.complete(state,lessons[0],[courseModule],'2026-11-02').xp,30);
assert.equal(P.complete(state,lessons[0],[courseModule],'2026-11-02').xp,0);
state.done[lessons[1].id]=true;const r=P.complete(state,lessons[1],[courseModule],'2026-11-02');assert.equal(r.xp,160);assert.equal(r.goal,true);
assert.equal(P.complete(state,lessons[1],[courseModule],'2026-11-02').xp,0);
assert.equal(P.xp(state.evolution),200);assert.equal(P.level(state.evolution).name,'Aprendiz');
// Removing a package or undoing completion never removes its XP.
state.done[lessons[1].id]=false;assert.equal(P.xp(state.evolution),200);
const old={done:{[lessons[0].id]:true},answers:{x:{correct:true}},history:[{id:'x',correct:false},{id:'x',correct:true}]};P.init(old,[courseModule]);assert.equal(P.xp(old.evolution),32);assert.deepEqual(old.evolution.days,{});P.init(old,[courseModule]);assert.equal(P.xp(old.evolution),32);
for(const day of ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06'])state.evolution.days[day]=['a'];assert.equal(P.weekDays(state.evolution,'2026-11-06'),5);assert.equal(P.weekDays(state.evolution,'2026-11-09'),0);
for(const [key,value] of [['schemaVersion',2],['packageId','__proto__'],['disciplinas',[]]]){const bad=structuredClone(example);bad[key]=value;assert.throws(()=>V.validate(bad));}
for(const invalid of [-1,5,1.5,'2']){const bad=structuredClone(example);bad.disciplinas[0].modulos[0].etapas[0].questoes[0].respostaCorreta=invalid;assert.throws(()=>V.validate(bad));}
const dup=structuredClone(example);dup.disciplinas[0].modulos[0].etapas.push(dup.disciplinas[0].modulos[0].etapas[0]);assert.throws(()=>V.validate(dup));
const injection=structuredClone(example);injection.disciplinas[0].modulos[0].etapas[0].conteudo='<img src=x onerror=alert(1)><script>bad()</script>';assert.ok(V.validate(injection).modules[0].lessons[0].html.includes('&lt;script&gt;'));
assert.equal(V.validate(structuredClone(example)).modules[0].lessons[0].id,p.modules[0].lessons[0].id);
const huge=structuredClone(example);const first=huge.disciplinas[0].modulos[0].etapas[0];huge.disciplinas[0].modulos[0].etapas=Array.from({length:3000},(_,i)=>({...first,id:'step-'+i}));assert.equal(V.validate(huge).steps,3000);
console.log('PASS: XP idempotente, níveis, meta, histórico, frequência, IDs estáveis, validação, injeção e 3.000 etapas.');
