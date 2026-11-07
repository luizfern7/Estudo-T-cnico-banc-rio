from pathlib import Path
from zipfile import ZipFile
import hashlib,json,struct,subprocess
ROOT=Path(__file__).resolve().parents[2];dist=Path('/workspace/artifacts/Jornada-de-Estudos-Windows');exe=dist/'JornadaDeEstudos.exe';data=exe.read_bytes()
assert data[:2]==b'MZ';offset=struct.unpack_from('<I',data,0x3c)[0];assert data[offset:offset+4]==b'PE\0\0';assert struct.unpack_from('<H',data,offset+4)[0]==0x8664
optional=offset+24;assert struct.unpack_from('<H',data,optional)[0]==0x20b;assert struct.unpack_from('<H',data,optional+68)[0]==2
# O código nativo continua o mesmo runtime oficial; somente os recursos de marca mudam.
def sections(raw):
 p=struct.unpack_from('<I',raw,0x3c)[0];count=struct.unpack_from('<H',raw,p+6)[0];size=struct.unpack_from('<H',raw,p+20)[0];result={}
 for n in range(count):
  start=p+24+size+40*n;name=raw[start:start+8].rstrip(b'\0').decode();length,pointer=struct.unpack_from('<II',raw,start+16);result[name]=raw[pointer:pointer+length]
 return result
original=sections(Path('/workspace/windows-tools/electron-win/electron.exe').read_bytes());new=sections(data);assert original['.text']==new['.text']
assert struct.unpack_from('<II',data,optional+112+4*8)==(0,0),'Assinatura antiga não deve permanecer inválida'
app=dist/'resources/app';web=app/'web'
for name in ['model.js','store.js','streak.js','styles.css','variant.css']:assert (web/name).read_bytes()==(ROOT/'generic'/name).read_bytes(),name
for name in ['main.cjs','portable.cjs','preload.cjs','json-file.cjs']:assert (app/name).read_bytes()==(ROOT/'windows'/name).read_bytes(),name
assert 'window.JornadaDesktop?.saveJson' in (web/'app.js').read_text();assert not (dist/'Dados/Perfil').exists()
manifest=json.loads((dist/'ARQUIVOS.sha256.json').read_text())
for name,digest in manifest.items():assert hashlib.sha256((dist/name).read_bytes()).hexdigest()==digest,name
with ZipFile('/workspace/artifacts/Jornada-de-Estudos-Windows-x64-v1.0.1.zip') as z:
 assert z.testzip() is None
 assert all(name.startswith(dist.name+'/') for name in z.namelist())
 assert any(name.endswith('/JornadaDeEstudos.exe') for name in z.namelist())
 assert not any('/Dados/Perfil/' in name for name in z.namelist())
# As versões Android continuam exatamente iguais ao commit anterior.
for name in ['generic/app.js','generic/store.js','generic/model.js','generic/index.html','generic/streak.js','index.html','progression.js']:
 assert subprocess.check_output(['git','-C',str(ROOT),'show','91f6f982ba539cc4a06fee39dd4e37cf74e9de8d:'+name])==(ROOT/name).read_bytes(),name
print('PASS: PE Windows GUI x64 real, código oficial preservado, assets compartilhados, pasta limpa, ZIP íntegro e aplicativos Android inalterados.')
