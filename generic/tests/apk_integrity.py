from pathlib import Path
from zipfile import ZipFile
import subprocess,json,re,hashlib
ROOT=Path(__file__).resolve().parents[2]
APK=Path('/workspace/artifacts/jornada-de-estudos-v1.0.apk');TOOLS=Path('/workspace/android-tools/android-15')
def run(*args):return subprocess.check_output([str(x) for x in args],text=True)
with ZipFile(APK) as z:
 assert z.testzip() is None
 for file in ['index.html','styles.css','variant.css','app.js','store.js','model.js','streak.js']:
  assert z.read('assets/public/'+file)==(ROOT/'generic'/file).read_bytes(),file
 assert z.read('assets/public/android.js')==(ROOT/'android.js').read_bytes()
 for name in ['cordova.js','cordova_plugins.js']:assert z.read('assets/public/'+name)==b''
 config=json.loads(z.read('assets/capacitor.config.json'));assert config['appId']=='br.com.jornadadeestudos.app' and config['appName']=='Jornada de Estudos'
 html=z.read('assets/public/index.html').decode();assert 'COURSE_DATA' not in html and 'BANESTES' not in html
 assert 'classes5.dex' not in z.namelist()
 assert b'Lbr/com/campusestudos/banestes/MainActivity;' in b''.join(z.read(name) for name in z.namelist() if name.endswith('.dex'))
 assert not any('/examples/' in name or '/tests/' in name for name in z.namelist())
 for file in ['res/mipmap-anydpi-v26/study_icon.xml','res/mipmap-anydpi-v33/study_icon.xml','res/drawable/study_book.xml']:assert file in z.namelist()
meta=run(TOOLS/'aapt2','dump','badging',APK)
assert "package: name='br.com.jornadadeestudos.app'" in meta and "versionName='1.0'" in meta and "versionCode='1'" in meta
assert "application-label:'Jornada de Estudos'" in meta
manifest=run(TOOLS/'aapt2','dump','xmltree',APK,'--file','AndroidManifest.xml')
assert 'br.com.jornadadeestudos.app.fileprovider' in manifest
assert 'br.com.campusestudos.banestes.fileprovider' not in manifest
assert 'StudyWidget' not in manifest and 'StreakReminder' not in manifest
run(TOOLS/'apksigner','verify',APK);run(TOOLS/'zipalign','-c','-P','16','4',APK)
# Preserva os arquivos da edição original já publicada.
original='50bb4f4623e7ff64bda1c054e43af996ed16df1a'
for file in ['index.html','android.js','progression.js','content-validator.js','content-store.js','tools/build_android.py']:
 assert subprocess.check_output(['git','-C',str(ROOT),'show',original+':'+file])==(ROOT/file).read_bytes(),file
print('PASS: variante independente, versão/nome/ícones, FileProvider próprio, assets testados, sem conteúdo pré-carregado, assinatura/alinhamento e aplicativo original preservado.')
