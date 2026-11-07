'use strict';
const {TextDecoder}=require('node:util');
function decode(buffer){if(buffer.length>20*1024*1024)throw Error('O arquivo excede 20 MB.');let encoding='utf-8';if(buffer[0]===0xff&&buffer[1]===0xfe)encoding='utf-16le';else if(buffer[0]===0xfe&&buffer[1]===0xff)encoding='utf-16be';else if(buffer[1]===0&&buffer[3]===0)encoding='utf-16le';else if(buffer[0]===0&&buffer[2]===0)encoding='utf-16be';try{return {text:new TextDecoder(encoding,{fatal:true}).decode(buffer).replace(/^\uFEFF/,''),encoding}}catch{throw Error('Não foi possível ler a codificação. Salve o JSON em UTF-8 ou UTF-16.')}}
function inspect(buffer,name){const decoded=decode(buffer);let raw;try{raw=JSON.parse(decoded.text)}catch(error){throw Error(`O arquivo “${name}” não é um JSON válido. ${error.message}`)}if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(`O arquivo “${name}” precisa conter um objeto de trilha.`);
 if(raw.app==='jornada-estudos'&&raw.versao_backup)throw Error('Este é um backup completo. Use Preferências → Restaurar backup.');
 if(raw.$schema||raw.$defs)throw Error('Este arquivo descreve um esquema JSON, não uma trilha. Selecione o arquivo de conteúdo.');
 if(raw.versao_schema===undefined){const keys=Object.keys(raw).slice(0,6).join(', ');throw Error(`O arquivo “${name}” não contém versao_schema. Campos encontrados: ${keys||'nenhum'}. Selecione o JSON da trilha, e não o manifesto ARQUIVOS.sha256.json.`)}
 let text=decoded.text,normalized=false;
 if(typeof raw.versao_schema==='string'&&raw.versao_schema.trim()==='1'){raw.versao_schema=1;text=JSON.stringify(raw);normalized=true}
 if(raw.versao_schema!==1)throw Error(`Versão lida em “${name}”: ${JSON.stringify(raw.versao_schema)} (${typeof raw.versao_schema}). A versão suportada é o número 1.`);
 return {name,text,bytes:buffer.length,encoding:decoded.encoding,version:1,normalized};
}
module.exports={decode,inspect};
