/* Regra de ofensiva reaproveitada do aplicativo original. Sem XP ou níveis. */
(function(root){'use strict';
function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function civil(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [y,m,d]=value.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?Math.floor(dt.getTime()/86400000):null}
function streak(e,today=day()){
 const now=civil(today);if(now===null)throw Error('Data inválida');
 const dates=new Set(Object.entries(e.days||{}).filter(([date,items])=>Array.isArray(items)&&items.length&&civil(date)!==null&&civil(date)<=now).map(([date])=>civil(date)));
 const studiedToday=dates.has(now);let anchor=studiedToday?now:now-1,current=0;
 while(dates.has(anchor)){current++;anchor--}
 let best=0,run=0,last=null;for(const date of [...dates].sort((a,b)=>a-b)){run=last!==null&&date===last+1?run+1:1;best=Math.max(best,run);last=date}
 return {current,best,studiedToday,atRisk:!studiedToday&&current>0};
}
const api={day,streak};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.JourneyStreak=api;})(globalThis);
