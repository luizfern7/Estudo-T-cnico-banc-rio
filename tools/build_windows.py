"""Gera pasta e ZIP Windows x64 usando runtime oficial com SHA-256 verificado.
Os arquivos de negócio vêm da variante Android generic/. Não exige Windows para montar.
"""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import argparse,shutil,json,hashlib,subprocess
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--tools',type=Path,default=Path('/workspace/windows-tools'));p.add_argument('--output',type=Path,default=Path('/workspace/artifacts/Jornada-de-Estudos-Windows'));p.add_argument('--zip',type=Path,default=Path('/workspace/artifacts/Jornada-de-Estudos-Windows-x64-v1.0.1.zip'));args=p.parse_args()
root=Path(__file__).resolve().parents[1];source=root/'windows';version=json.loads((source/'package.json').read_text())['config']['electronVersion'];runtime=args.tools/'electron-win.zip'
expected=next(s.split()[0] for s in (args.tools/'SHASUMS256.txt').read_text().splitlines() if s.endswith(f'electron-v{version}-win32-x64.zip'))
assert hashlib.sha256(runtime.read_bytes()).hexdigest()==expected,'Checksum do runtime não confere'
# Nunca reconstruir uma distribuição que já contenha dados do usuário.
if (args.output/'Dados'/'Perfil').exists():raise SystemExit('A pasta de destino já contém um perfil. Escolha outro destino para preservar os dados.')
if args.output.exists():shutil.rmtree(args.output)
args.output.mkdir(parents=True)
with ZipFile(runtime) as z:
 for item in z.infolist():
  if item.is_dir() or item.filename=='resources/default_app.asar':continue
  if item.filename.startswith('locales/') and item.filename not in ['locales/pt-BR.pak','locales/en-US.pak']:continue
  dest=args.output/item.filename;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(item))
app=args.output/'resources/app';app.mkdir(parents=True,exist_ok=True)
for name in ['main.cjs','preload.cjs','portable.cjs','json-file.cjs','package.json']:shutil.copy2(source/name,app/name)
shutil.copy2(source/'assets/book.ico',app/'book.ico')
web=app/'web';web.mkdir()
for name in ['index.html','app.js','model.js','store.js','streak.js','styles.css','variant.css']:shutil.copy2(root/'generic'/name,web/name)
shutil.copy2(root/'android.js',web/'android.js')
for name in ['desktop.js','desktop.css']:shutil.copy2(source/name,web/name)
html=(web/'index.html').read_text().replace('src="../android.js"','src="android.js"').replace('</head>','<link rel="stylesheet" href="desktop.css"></head>').replace('</body>','<script src="desktop.js"></script></body>');(web/'index.html').write_text(html)
js=(web/'app.js').read_text();needle="const text=JSON.stringify(value,null,2);if(window.Capacitor?.isNativePlatform?.())";assert js.count(needle)==1
js=js.replace(needle,"const text=JSON.stringify(value,null,2);if(window.JornadaDesktop?.saveJson){await window.JornadaDesktop.saveJson({name,text});return}if(window.Capacitor?.isNativePlatform?.())")
(web/'app.js').write_text(js)
subprocess.run(['node',str(source/'set-icon.cjs'),str(args.tools/'build-deps/node_modules/resedit'),str(args.output/'electron.exe'),str(args.output/'JornadaDeEstudos.exe'),str(source/'assets/book.ico')],check=True)
(args.output/'electron.exe').unlink()
(args.output/'Dados').mkdir();(args.output/'Dados/LEIA-ME.txt').write_text('Esta pasta guardará automaticamente suas trilhas, progresso e configurações.\nFeche o programa antes de mover ou copiar a pasta completa.\n',encoding='utf-8')
shutil.copy2(source/'LEIA-ME.txt',args.output/'LEIA-ME.txt')
# App não depende de caminhos do ambiente de compilação.
for file in [app/'main.cjs',app/'portable.cjs',web/'desktop.js']:
 assert '/workspace/' not in file.read_text(),file
manifest={str(f.relative_to(args.output)):hashlib.sha256(f.read_bytes()).hexdigest() for f in args.output.rglob('*') if f.is_file()}
(args.output/'ARQUIVOS.sha256.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
args.zip.parent.mkdir(parents=True,exist_ok=True)
with ZipFile(args.zip,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for file in args.output.rglob('*'):
  if file.is_file():z.write(file,Path(args.output.name)/file.relative_to(args.output))
print('Windows portátil:',args.output);print('ZIP:',args.zip,round(args.zip.stat().st_size/1024/1024,1),'MiB')
