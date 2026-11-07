const assert=require('node:assert/strict'),M=require('../model.js'),P=require('../streak.js'),example=require('../examples/trilha-exemplo.json');
const pack=M.validate(example);assert.equal(pack.conteudos.length,3);assert.equal(pack.conteudos[0].questoes.length,0);assert.equal(pack.conteudos[1].questoes[0].resposta_correta,1);
let plan=M.plan(pack,null,[]);assert.deepEqual(M.summary(plan),{add:3,update:0,ignore:0});
const existing=pack.conteudos.map((c,i)=>({...c,trackId:pack.trilha.id,order:i}));plan=M.plan(pack,pack.trilha,existing);assert.deepEqual(M.summary(plan),{add:0,update:0,ignore:3});
const changed=structuredClone(pack);changed.conteudos[1].titulo='Título atualizado';plan=M.plan(changed,pack.trilha,existing);assert.equal(plan.entries[1].status,'conflict');assert.equal(M.summary(plan).update,0);plan.entries[1].choice='update';assert.equal(M.summary(plan).update,1);
assert.deepEqual(M.validate(M.exportTrack(pack.trilha,existing)),pack);
for(const x of [null,{}, {...example,versao_schema:9},{...example,trilha:{id:'__proto__',nome:'x'}}])assert.throws(()=>M.validate(x));
const duplicate=structuredClone(example);duplicate.conteudos.push(duplicate.conteudos[0]);assert.throws(()=>M.validate(duplicate));
for(const index of [-1,3,1.5,'1']){const bad=structuredClone(example);bad.conteudos[1].resposta_correta=index;assert.throws(()=>M.validate(bad))}
assert.throws(()=>M.validate({...example,conteudos:[{id:'x',titulo:'Vazio',tipo:'leitura'}]}));
const manual=M.content({id:'manual',titulo:'Manual',tipo:'questao',disciplina:'',conteudo:'',questoes:[{id:'q',enunciado:'Pergunta?',alternativas:['A','B'],resposta_correta:0,explicacao:'Explicação'}]});assert.equal(manual.disciplina,'');
const b={app:'jornada-estudos',versao_backup:1,trilhas:[{...pack,progresso:[]}],dias_estudados:{'2026-11-07':['a','b']},efeitos_sonoros:false};const restored=M.validateBackup(b);assert.equal(restored.contents.length,3);assert.equal(restored.global.sounds,false);assert.equal(P.streak({days:restored.global.days},'2026-11-07').current,1);
const dates=require('../../tests/streak_cases.json');for(const c of dates){const s=P.streak({days:c.days},c.today);assert.deepEqual([s.current,s.best,+s.studiedToday,+s.atRisk],c.expected)}
const huge=structuredClone(example);huge.conteudos=Array.from({length:3000},(_,i)=>({...example.conteudos[0],id:'step-'+i}));assert.equal(M.validate(huge).conteudos.length,3000);
console.log('PASS: modelo genérico, leituras e questões, importações/diferenças, IDs, exportação, backup, ofensiva global e 3.000 etapas.');
