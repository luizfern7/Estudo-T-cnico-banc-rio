"""Verifica o APK real, não apenas o diretório de fontes."""
from pathlib import Path
from zipfile import ZipFile
import subprocess,re,json
ROOT=Path(__file__).resolve().parents[1]
TOOLS=Path('/workspace/android-tools/android-15')
APK=Path('/workspace/artifacts/estudo-para-concurso-v1.2.apk')
def run(*args):return subprocess.check_output([str(a) for a in args],text=True)
with ZipFile(APK) as z:
 assert z.testzip() is None
 for file in ['index.html','android.js','progression.js','content-store.js','content-validator.js']:
  assert z.read('assets/public/'+file)==(ROOT/file).read_bytes(),file
 assert json.loads(z.read('assets/capacitor.config.json'))['appId']=='br.com.campusestudos.banestes'
 assert b'Lbr/com/campusestudos/banestes/evolution/StudyWidget;' in z.read('classes5.dex')
 assert b'Landroid/webkit/JavascriptInterface;' in z.read('classes5.dex')
 for resource in ['layout/study_widget_compact.xml','layout/study_widget_expanded.xml','xml/study_widget_compact_info.xml','xml/study_widget_expanded_info.xml','mipmap-anydpi-v33/study_icon.xml']:
  assert 'res/'+resource in z.namelist(),resource
meta=run(TOOLS/'aapt2','dump','badging',APK)
assert "versionCode='3'" in meta and "versionName='1.2'" in meta
assert "application-label:'Estudo para Concurso'" in meta
manifest=run(TOOLS/'aapt2','dump','xmltree',APK,'--file','AndroidManifest.xml')
for name in ['StudyWidget','ExpandedStudyWidget','android.appwidget.provider']:assert name in manifest
cert=run(TOOLS/'apksigner','verify','--print-certs',APK)
old_cert=run(TOOLS/'apksigner','verify','--print-certs',ROOT/'downloads/campus-estudos-banestes-feedback-debug.apk')
pattern=r'Signer #1 certificate SHA-256 digest: (\w+)'
assert re.search(pattern,cert).group(1)==re.search(pattern,old_cert).group(1)
run(TOOLS/'zipalign','-c','-P','16','4',APK)
old=run('git','-C',ROOT,'show','476d991db9af9c1b766fbfe51e39e9677b4b1e48:index.html')
get=lambda text:re.search(r'<script>window.COURSE_DATA=(.*?);</script>',text,re.S).group(1)
assert get(old)==get((ROOT/'index.html').read_text())
print('PASS: APK íntegro, assets correspondem ao código testado, conteúdo básico idêntico, providers/ícones/DEX presentes, applicationId preservado, versão 1.2/3, assinatura compatível e alinhamento verificado.')
