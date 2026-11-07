"""Compila a variante independente, sem modificar os arquivos do aplicativo original.
Usa o APK-base de feedback (sem widgets) e os recursos de livro já existentes.
"""
import argparse,subprocess,shutil,json,xml.etree.ElementTree as ET
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__);p.add_argument('base',type=Path);p.add_argument('output',type=Path);p.add_argument('--tools',type=Path,default=Path('/workspace/android-tools'));args=p.parse_args()
root=Path(__file__).resolve().parents[1];build=args.tools/'generic-build';decoded=build/'decoded';app_id='br.com.jornadadeestudos.app';display_name='Jornada de Estudos'
def run(*cmd):subprocess.run([str(s) for s in cmd],check=True)
build.mkdir(exist_ok=True);args.output.parent.mkdir(parents=True,exist_ok=True)
run('java','-jar',args.tools/'apktool.jar','d','-f',args.base,'-o',decoded)
# Sem qualquer conteúdo didático da edição original no APK genérico.
public=decoded/'assets/public';shutil.rmtree(public);public.mkdir()
for file in (root/'generic').iterdir():
 if file.is_file() and file.suffix in ['.html','.css','.js']:shutil.copy2(file,public/file.name)
shutil.copy2(root/'android.js',public/'android.js')
# Arquivos vazios de compatibilidade lidos pelo host, sem conteúdo educacional.
for compatibility_file in ['cordova.js','cordova_plugins.js']:(public/compatibility_file).write_bytes(b'')
config_path=decoded/'assets/capacitor.config.json';config=json.loads(config_path.read_text());config.update(appId=app_id,appName=display_name);config_path.write_text(json.dumps(config,ensure_ascii=False,indent=2))
ns='http://schemas.android.com/apk/res/android';A='{'+ns+'}';ET.register_namespace('android',ns)
manifest=ET.parse(decoded/'AndroidManifest.xml');m=manifest.getroot();old=m.get('package');m.set('package',app_id)
# Classes existentes continuam com seu namespace Java; só a identidade do app,
# as permissões e as authorities mudam para não colidir com a edição original.
for node in m.iter():
 for attr,value in list(node.attrib.items()):
  if attr==A+'authorities':node.set(attr,value.replace(old,app_id))
  if node.tag in ['permission','uses-permission'] and attr==A+'name' and value.startswith(old+'.'):node.set(attr,value.replace(old,app_id,1))
app=m.find('application');app.set(A+'label',display_name);app.set(A+'icon','@mipmap/study_icon');app.set(A+'roundIcon','@mipmap/study_icon')
for activity in app.findall('activity'):
 if activity.get(A+'name','').endswith('.MainActivity'):activity.set(A+'label',display_name)
manifest.write(decoded/'AndroidManifest.xml',encoding='utf-8',xml_declaration=True)
for folder in ['drawable','mipmap-anydpi-v26','mipmap-anydpi-v33']:
 for source in (root/'native/res'/folder).glob('*'):
  if source.name in ['study_book.xml','study_book_mono.xml','study_icon_legacy.xml','study_icon.xml','study_splash.xml']:
   dest=decoded/'res'/folder/source.name;dest.parent.mkdir(exist_ok=True);shutil.copy2(source,dest)
values=decoded/'res/values';(values/'generic_resources.xml').write_text('<resources><color name="study_icon_blue">#17496B</color><item type="mipmap" name="study_icon">@drawable/study_icon_legacy</item></resources>')
strings=values/'strings.xml';tree=ET.parse(strings)
for item in tree.getroot().findall('string'):
 if item.get('name') in ['app_name','title_activity_main']:item.text=display_name
 if item.get('name') in ['package_name','custom_url_scheme']:item.text=app_id
tree.write(strings,encoding='utf-8',xml_declaration=True)
for styles in (decoded/'res').glob('values*/styles.xml'):styles.write_text(styles.read_text().replace('@drawable/splash','@drawable/study_splash'))
yaml=decoded/'apktool.yml';yaml.write_text(yaml.read_text().replace('versionCode: 2','versionCode: 1').replace('versionName: 1.1','versionName: 1.0'))
run('java','-jar',args.tools/'apktool.jar','b',decoded,'-o',args.output)
print('Variante independente sem assinatura:',args.output)
