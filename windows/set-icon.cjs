'use strict';
const fs=require('node:fs'),path=require('node:path');
const buildRequire=require('node:module').createRequire(path.resolve(process.argv[2],'..','..','package.json'));const RE=buildRequire('resedit'),PE=buildRequire('pe-library');
const input=process.argv[3],output=process.argv[4],icon=process.argv[5];
const exe=PE.NtExecutable.from(fs.readFileSync(input),{ignoreCert:true}),res=PE.NtExecutableResource.from(exe);
const ico=RE.Data.IconFile.from(fs.readFileSync(icon));
const groups=RE.Resource.IconGroupEntry.fromEntries(res.entries);if(!groups.length)throw Error('Executável sem grupo de ícone');
for(const group of groups)RE.Resource.IconGroupEntry.replaceIconsForResource(res.entries,group.id,group.lang,ico.icons.map(item=>item.data));
for(const vi of RE.Resource.VersionInfo.fromEntries(res.entries)){
 vi.setFileVersion(1,0,0,0,1033);vi.setProductVersion(1,0,0,0,1033);
 for(const lang of vi.getAllLanguagesForStringValues())vi.setStringValues(lang,{CompanyName:'Jornada de Estudos',FileDescription:'Jornada de Estudos — Windows portátil',ProductName:'Jornada de Estudos',InternalName:'JornadaDeEstudos',OriginalFilename:'JornadaDeEstudos.exe',LegalCopyright:'Jornada de Estudos',ProductVersion:'1.0.0',FileVersion:'1.0.0.0'});
 vi.outputToResourceEntries(res.entries);
}
res.outputResource(exe);fs.writeFileSync(output,Buffer.from(exe.generate()));
// A modificação de recursos gera um PE novo, sem reutilizar uma assinatura Authenticode inválida.
const check=PE.NtExecutable.from(fs.readFileSync(output));const resources=PE.NtExecutableResource.from(check);const versions=RE.Resource.VersionInfo.fromEntries(resources.entries);
if(!versions.some(v=>v.getAllLanguagesForStringValues().some(l=>v.getStringValues(l).ProductName==='Jornada de Estudos')))throw Error('Falha ao aplicar nome');
console.log('Nome, versão e ícone aplicados ao PE Windows.');
