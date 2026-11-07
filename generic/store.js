(function(root){'use strict';let opened;function abort(t){try{t.abort()}catch{}}
function db(){if(!opened)opened=new Promise((resolve,reject)=>{const r=indexedDB.open('jornada-estudos-independent',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('tracks',{keyPath:'id'});d.createObjectStore('contents',{keyPath:['trackId','id']});d.createObjectStore('progress',{keyPath:['trackId','itemId']});d.createObjectStore('meta',{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Falha ao abrir o armazenamento local.'))});return opened;}
async function transaction(stores,action){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(stores,'readwrite');t.oncomplete=resolve;t.onabort=()=>reject(t.error||Error('Gravação cancelada. Nenhum dado desta operação foi alterado.'));t.onerror=()=>reject(t.error||Error('Falha de gravação.'));try{action(t)}catch(e){abort(t);reject(e)}})}
async function load(){const d=await db();return new Promise((resolve,reject)=>{const names=['tracks','contents','progress','meta'],t=d.transaction(names),data={};for(const name of names){const r=t.objectStore(name).getAll();r.onsuccess=()=>data[name]=r.result}t.oncomplete=()=>resolve({...data,global:data.meta.find(x=>x.key==='global')||{key:'global',days:{},sounds:true}});t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)})}
async function importPlan(plan,updateMetadata=false){return transaction(['tracks','contents'],t=>{
 const tracks=t.objectStore('tracks'),contents=t.objectStore('contents'),tr=tracks.get(plan.pack.trilha.id),all=contents.getAll();let a,b,loaded=0;
 function commit(){if(++loaded!==2)return;try{const existing=new Map(b.filter(c=>c.trackId===plan.pack.trilha.id).map(c=>[c.id,c]));let next=Math.max(-1,...[...existing.values()].map(c=>c.order))+1;
  for(const entry of plan.entries){if(entry.status==='same'||(entry.status==='conflict'&&entry.choice!=='update'))continue;const old=existing.get(entry.item.id);if((entry.status==='add'&&old)||(entry.status==='conflict'&&(!old||JSON.stringify(JourneyModel.clean(old))!==entry.previous))){abort(t);return}contents.put({...entry.item,trackId:plan.pack.trilha.id,order:old?.order??next++})}
  if(!a||updateMetadata)tracks.put({...plan.pack.trilha,createdAt:a?.createdAt||new Date().toISOString()});
 }catch(e){abort(t)}}
 tr.onsuccess=()=>{a=tr.result;commit()};all.onsuccess=()=>{b=all.result;commit()};
})}

async function saveTrack(track){return transaction(['tracks'],t=>t.objectStore('tracks').put(track))}
async function saveItem(item){return transaction(['contents'],t=>t.objectStore('contents').put(item))}
async function removeItem(trackId,id){return transaction(['contents','progress'],t=>{t.objectStore('contents').delete([trackId,id]);t.objectStore('progress').delete([trackId,id])})}
async function removeTrack(id){return transaction(['tracks','contents','progress'],t=>{t.objectStore('tracks').delete(id);for(const [store,key] of [['contents','trackId'],['progress','trackId']]){const r=t.objectStore(store).openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value[key]===id)c.delete();c.continue()}}}})}
async function study(trackId,itemId,day,mutate){return transaction(['contents','progress','meta'],t=>{
 const cs=t.objectStore('contents'),ps=t.objectStore('progress'),ms=t.objectStore('meta');let c,p,g,loaded=0;
 function apply(){if(++loaded!==3)return;try{if(!c)throw Error('A etapa foi removida. Volte para a trilha.');p??={trackId,itemId,answers:{},history:[],done:false};g??={key:'global',days:{},sounds:true};mutate(p,c);g.days[day]??=[];const event=trackId+':'+itemId;if(!g.days[day].includes(event))g.days[day].push(event);ps.put(p);ms.put(g)}catch(e){abort(t)}}
 const cr=cs.get([trackId,itemId]),pr=ps.get([trackId,itemId]),gr=ms.get('global');cr.onsuccess=()=>{c=cr.result;apply()};pr.onsuccess=()=>{p=pr.result;apply()};gr.onsuccess=()=>{g=gr.result;apply()};
})}
async function answer(trackId,itemId,q,selected,day){return study(trackId,itemId,day,(p,c)=>{const actual=c.questoes.find(x=>x.id===q.id);if(!actual||JSON.stringify(actual)!==JSON.stringify(q)||!Number.isInteger(selected)||selected<0||selected>=actual.alternativas.length)throw Error('A questão foi alterada. Reabra a etapa.');p.answers[q.id]={selected,correct:selected===actual.resposta_correta,at:new Date().toISOString()};p.history.push({questionId:q.id,...p.answers[q.id]})})}
async function complete(trackId,itemId,day){return study(trackId,itemId,day,(p,c)=>{if(!c.questoes.every(q=>p.answers[q.id]&&p.answers[q.id].selected<q.alternativas.length))throw Error('Responda às questões da etapa antes de concluir.');p.done=true;p.completedAt??=new Date().toISOString()})}

async function saveGlobal(value){return transaction(['meta'],t=>{const store=t.objectStore('meta'),r=store.get('global');r.onsuccess=()=>store.put({...r.result,key:'global',days:r.result?.days||{},sounds:value.sounds!==false,theme:value.theme||'light'})})}
async function restore(data){return transaction(['tracks','contents','progress','meta'],t=>{for(const store of ['tracks','contents','progress']){t.objectStore(store).clear();for(const value of data[store])t.objectStore(store).put(value)}t.objectStore('meta').put(data.global)})}
root.JourneyStore={load,transaction,importPlan,saveTrack,saveItem,removeItem,removeTrack,answer,complete,saveGlobal,restore};
})(globalThis);
