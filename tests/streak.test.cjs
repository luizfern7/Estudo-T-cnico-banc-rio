const assert=require('node:assert/strict'),P=require('../progression.js'),cases=require('./streak_cases.json');
for(const c of cases){const actual=P.streak({days:c.days},c.today);assert.deepEqual([actual.current,actual.best,+actual.studiedToday,+actual.atRisk],c.expected,c.name)}
const moduleData={id:'m',title:'M',lessons:[{id:'a'},{id:'b'},{id:'c'}]},state={history:[],answers:{},done:{}};
P.init(state,[moduleData]);let a={id:'a',module:'m'};state.done.a=true;
let result=P.complete(state,a,[moduleData],'2026-11-04');assert.equal(result.streakMilestone,1);const xp=P.xp(state.evolution);
assert.equal(P.complete(state,a,[moduleData],'2026-11-04').streakMilestone,0);assert.equal(P.xp(state.evolution),xp);
state.done.b=true;P.complete(state,{id:'b',module:'m'},[moduleData],'2026-11-05');state.done.c=true;result=P.complete(state,{id:'c',module:'m'},[moduleData],'2026-11-06');assert.equal(result.streakMilestone,3);
assert.equal(P.streak(state.evolution,'2026-11-08').current,0);assert.equal(P.streak(state.evolution,'2026-11-08').best,3);
const saved=JSON.parse(JSON.stringify(state));assert.equal(P.streak(saved.evolution,'2026-11-06').current,3);
assert.equal(P.xp(saved.evolution),P.xp(state.evolution));
console.log('PASS: 12 cenários de datas, viradas, recorde, repetição, persistência e marcos sem XP extra.');
