/* Regras puras compartilhadas pela interface, widgets e testes. */
(function(root){
'use strict';
const names=['Iniciante','Aprendiz','Estudante Dedicado','Explorador do Conhecimento','Concurseiro Persistente','Mestre dos Estudos','Rumo à Aprovação'];
const thresholds=[0,100,300,700,1500,3000,6000];
function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function init(state,modules){
 if(state.evolution?.version===1)return state.evolution;
 const e=state.evolution={version:1,grants:{},days:{},dailyGoal:2,achievements:{}};
 // Recupera XP histórico sem inventar datas para conclusões antigas.
 const seen=new Set();for(const a of state.history||[]){if(!seen.has(a.id)){seen.add(a.id);award(e,'answer:'+a.id,a.correct?10:2)}}
 for(const [id,a] of Object.entries(state.answers||{}))if(!seen.has(id))award(e,'answer:'+id,a.correct?10:2);
 for(const [id,done] of Object.entries(state.done||{}))if(done)award(e,'lesson:'+id,30);
 modules.forEach(m=>{if(m.lessons.length&&m.lessons.every(l=>state.done[l.id]))award(e,'module:'+m.id,100)});
 achievements(e,modules,state);return e;
}
function award(e,key,amount){if(Object.hasOwn(e.grants,key))return 0;e.grants[key]=amount;return amount}
function xp(e){return Object.values(e.grants).reduce((sum,n)=>sum+(Number.isFinite(n)?n:0),0)}
function level(e){const total=xp(e);let i=thresholds.findLastIndex(n=>total>=n);return {index:i+1,name:names[i],xp:total,floor:thresholds[i],next:thresholds[i+1]??null,percent:i===6?100:Math.min(100,Math.floor((total-thresholds[i])*100/(thresholds[i+1]-thresholds[i])))};}
function weekDays(e,today=day()){
 const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));const start=day(d);d.setDate(d.getDate()+6);const end=day(d);
 return Object.entries(e.days).filter(([k,v])=>k>=start&&k<=end&&v.length).length;
}
// Datas civis, sem dividir horas locais: mantém a contagem nas mudanças de horário de verão.
function civil(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [y,m,d]=value.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?Math.floor(dt.getTime()/86400000):null}
function streak(e,today=day()){
 const now=civil(today);if(now===null)throw Error('Data inválida');
 const dates=new Set(Object.entries(e.days||{}).filter(([date,items])=>Array.isArray(items)&&items.length&&civil(date)!==null&&civil(date)<=now).map(([date])=>civil(date)));
 const studiedToday=dates.has(now);let anchor=studiedToday?now:now-1,current=0;
 while(dates.has(anchor)){current++;anchor--}
 let best=0,run=0,last=null;for(const date of [...dates].sort((a,b)=>a-b)){run=last!==null&&date===last+1?run+1:1;best=Math.max(best,run);last=date}
 return {current,best,studiedToday,atRisk:!studiedToday&&current>0};
}
function achievements(e,modules,state){const count=Object.keys(e.grants).filter(k=>k.startsWith('lesson:')).length;for(const n of [10,25,100])if(count>=n)e.achievements['steps-'+n]??=`${n} etapas concluídas`;
 for(const m of modules)if(Object.hasOwn(e.grants,'module:'+m.id))e.achievements['module-'+m.id]??='Módulo concluído: '+m.title;
 if(weekDays(e)>=5)e.achievements['week-5']??='Estudou em cinco dias da semana';
}
function answer(state,q,correct,modules){const e=init(state,modules);return award(e,'answer:'+q.id,correct?10:2)}
function complete(state,l,modules,today=day()){
 const e=init(state,modules),before=xp(e);const first=award(e,'lesson:'+l.id,30)>0;
 if(first){e.days[today]??=[];if(!e.days[today].includes(l.id))e.days[today].push(l.id)}
 const m=modules.find(m=>m.id===l.module);if(m?.lessons.length&&m.lessons.every(x=>state.done[x.id]))award(e,'module:'+m.id,100);
 let goal=false;if((e.days[today]?.length||0)>=e.dailyGoal)goal=award(e,'daily:'+today,30)>0;
 achievements(e,modules,state);const sequence=streak(e,today);let streakMilestone=0;
 if(first&&[1,3,7,14,30,60,100,365].includes(sequence.current)){e.streakNotices??={};const notice=today+':'+sequence.current;if(!e.streakNotices[notice]){e.streakNotices[notice]=true;streakMilestone=sequence.current}}
 return {xp:xp(e)-before,goal,streakMilestone};
}
function snapshot(state){const e=state.evolution;return {...level(e),today:e.days[day()]?.length||0,goal:e.dailyGoal,weekDays:weekDays(e),streak:streak(e),days:e.days}}
const api={day,streak,init,award,xp,level,weekDays,answer,complete,snapshot};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StudyProgress=api;
})(globalThis);
