/* JSON não contém HTML executável: todo texto é escapado durante a normalização. */
(function(root){
'use strict';
const fail=message=>{throw Error(message)};
const obj=(v,label)=>{if(!v||typeof v!=='object'||Array.isArray(v))fail(label+': objeto esperado');return v};
const text=(v,label,max=20000)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(label+': texto obrigatório (até '+max+' caracteres)');return v.trim()};
const id=(v,label)=>{text(v,label,80);if(!/^[a-zA-Z0-9_-]+$/.test(v)||['__proto__','prototype','constructor'].includes(v))fail(label+': use letras, números, hífen ou sublinhado');return v};
const list=(v,label)=>{if(!Array.isArray(v)||!v.length)fail(label+': lista não vazia esperada');return v};
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(raw){
 obj(raw,'Pacote');if(raw.schemaVersion!==1)fail('schemaVersion não suportada: use 1');const packageId=id(raw.packageId,'packageId'),title=text(raw.titulo,'Título',200);const modules=[],questions=[],seen=new Set();let steps=0;
 const unique=k=>{if(seen.has(k))fail('Identificador duplicado: '+k);seen.add(k);return k};
 for(const d of list(raw.disciplinas,'Disciplinas')){obj(d,'Disciplina');const did=unique('pkg:'+packageId+':d:'+id(d.id,'Disciplina.id')),discipline=text(d.nome,'Disciplina.nome',200);
 for(const m of list(d.modulos,'Módulos')){obj(m,'Módulo');const mid=unique(did+':m:'+id(m.id,'Módulo.id')),mt=text(m.titulo,'Módulo.titulo',200),lessons=[];
 for(const l of list(m.etapas,'Etapas')){obj(l,'Etapa');const lid=unique(mid+':l:'+id(l.id,'Etapa.id')),lt=text(l.titulo,'Etapa.titulo',300),ids=[];
 const body=l.conteudo===undefined?'':text(l.conteudo,'Conteúdo',100000);const subject=l.assunto===undefined?'':text(l.assunto,'Assunto',300);
 for(const q of list(l.questoes,'Questões da etapa '+l.id)){obj(q,'Questão');const qid=unique(lid+':q:'+id(q.id,'Questão.id')),prompt=text(q.enunciado,'Enunciado');const options=list(q.alternativas,'Alternativas');if(options.length<2||options.length>8)fail('Use de 2 a 8 alternativas');if(!Number.isInteger(q.respostaCorreta)||q.respostaCorreta<0||q.respostaCorreta>=options.length)fail('respostaCorreta deve ser um índice válido, começando em 0');const explanation=text(q.explicacao,'Explicação');
 if(questions.length>=100000)fail('Limite de 100.000 questões por arquivo excedido');
 questions.push({id:qid,module:mid,title:lt,prompt,promptHtml:'<p>'+esc(prompt)+'</p>',options:options.map((v,i)=>({key:String.fromCharCode(65+i),text:text(v,'Alternativa')})),answer:String.fromCharCode(65+q.respostaCorreta),explanation,explanationHtml:'<p>'+esc(explanation).replace(/\n/g,'<br>')+'</p>',difficulty:'Importada',origin:'Conteúdo importado'});ids.push(qid);
 }
 lessons.push({id:lid,title:lt,subject,html:(subject?'<h2>'+esc(subject)+'</h2>':'')+'<p>'+esc(body||'Pratique as questões desta etapa para fixar o conteúdo.').replace(/\n/g,'<br>')+'</p>',inlineQuestionIds:ids,packageId});steps++;if(steps>20000)fail('Limite de 20.000 etapas por arquivo excedido');
 }
 modules.push({id:mid,title:discipline+' · '+mt,discipline,lessons,packageId});
 }}
 if(steps>20000||questions.length>100000)fail('Pacote muito grande: limite de 20.000 etapas e 100.000 questões por arquivo');
 return {schemaVersion:1,packageId,title,modules,questions,steps,source:raw};
}
if(typeof module!=='undefined'&&module.exports)module.exports={validate};else root.StudyContentValidator={validate};
if(typeof WorkerGlobalScope!=='undefined'&&root instanceof WorkerGlobalScope)root.onmessage=e=>{try{root.postMessage({ok:true,pack:validate(JSON.parse(e.data))})}catch(error){root.postMessage({ok:false,error:error.message})}};
})(globalThis);
