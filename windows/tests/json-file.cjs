const assert=require('node:assert/strict'),J=require('../json-file.cjs');
const source=JSON.stringify({versao_schema:1,trilha:{id:'teste',nome:'Português'},conteudos:[]});
const le=Buffer.from(source,'utf16le'),be=Buffer.from(le);for(let i=0;i<be.length;i+=2){const n=be[i];be[i]=be[i+1];be[i+1]=n}
for(const b of [Buffer.from(source),Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),Buffer.from(source)]),Buffer.concat([Buffer.from([0xff,0xfe]),le]),Buffer.concat([Buffer.from([0xfe,0xff]),be]),le,be])assert.deepEqual(JSON.parse(J.inspect(b,'teste.json').text),JSON.parse(source));
assert.equal(J.inspect(Buffer.from(source.replace('"versao_schema":1','"versao_schema":"1"')),'teste.json').normalized,true);
assert.throws(()=>J.inspect(Buffer.from('{"versao_schema":2}'),'teste.json'),/Versão lida/);
assert.throws(()=>J.inspect(Buffer.from('{"arquivo":"hash"}'),'ARQUIVOS.sha256.json'),/não contém versao_schema/);
assert.throws(()=>J.inspect(Buffer.from('{"$schema":"schema"}'),'schema.json'),/esquema JSON/);
assert.throws(()=>J.inspect(Buffer.from('{"app":"jornada-estudos","versao_backup":1}'),'backup.json'),/Restaurar backup/);
assert.throws(()=>J.inspect(Buffer.from('não é JSON'),'x.json'),/não é um JSON válido/);
console.log('PASS: UTF-8, BOM, UTF-16 LE/BE, versão textual, versão desconhecida e arquivos incorretos.');
