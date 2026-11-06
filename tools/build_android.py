"""Reconstrói o APK-base preservando classes, applicationId e origem do WebView.
Ferramentas verificadas instaladas em /workspace/android-tools; não baixa nada.
A assinatura é uma etapa explícita separada; nunca inclui a chave no repositório.
"""
import argparse,subprocess,shutil,xml.etree.ElementTree as ET,hashlib,json
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('base',type=Path);parser.add_argument('output',type=Path)
parser.add_argument('--tools',type=Path,default=Path('/workspace/android-tools'))
args=parser.parse_args();root=Path(__file__).resolve().parents[1];tools=args.tools;build=tools/'evolution-build';decoded=build/'decoded'
def run(*cmd):subprocess.run([str(x) for x in cmd],check=True)
build.mkdir(exist_ok=True);args.output.parent.mkdir(parents=True,exist_ok=True)
assert hashlib.sha1((tools/'ecj.jar').read_bytes()).hexdigest()==(tools/'ecj.sha1').read_text().strip()
run('java','-jar',tools/'apktool.jar','d','-f',args.base,'-o',decoded)
for source in (root/'native/res').rglob('*'):
 if source.is_file():dest=decoded/'res'/source.relative_to(root/'native/res');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
for styles in (decoded/'res').glob('values*/styles.xml'):
 styles.write_text(styles.read_text().replace('@drawable/splash','@drawable/study_splash'))
strings=decoded/'res/values/strings.xml';string_tree=ET.parse(strings)
for item in string_tree.getroot().findall('string'):
 if item.get('name') in ['app_name','title_activity_main']:item.text='Estudo para Concurso'
string_tree.write(strings,encoding='utf-8',xml_declaration=True)
values=decoded/'res/values';(values/'study_resources.xml').write_text('<resources><color name="study_icon_blue">#17496B</color></resources>')
# Default icon for API 23–25. Adaptive versions supersede it on newer Android.
(values/'study_icons.xml').write_text('<resources><item type="mipmap" name="study_icon">@drawable/study_icon_legacy</item></resources>')
ns='http://schemas.android.com/apk/res/android';ET.register_namespace('android',ns);A='{'+ns+'}'
manifest=ET.parse(decoded/'AndroidManifest.xml');app=manifest.getroot().find('application')
app.set(A+'label','Estudo para Concurso');app.set(A+'icon','@mipmap/study_icon');app.set(A+'roundIcon','@mipmap/study_icon')
for activity in app.findall('activity'):
 if activity.get(A+'name','').endswith('.MainActivity'):activity.set(A+'label','Estudo para Concurso')
for cls,title,name in [('StudyWidget','Minha Evolução · compacto','compact'),('ExpandedStudyWidget','Minha Evolução · expandido','expanded')]:
 receiver=ET.SubElement(app,'receiver',{A+'name':'br.com.campusestudos.banestes.evolution.'+cls,A+'exported':'false',A+'label':title})
 intent=ET.SubElement(receiver,'intent-filter');ET.SubElement(intent,'action',{A+'name':'android.appwidget.action.APPWIDGET_UPDATE'})
 ET.SubElement(receiver,'meta-data',{A+'name':'android.appwidget.provider',A+'resource':'@xml/study_widget_'+name+'_info'})
for permission in ['android.permission.POST_NOTIFICATIONS','android.permission.RECEIVE_BOOT_COMPLETED']:
 ET.SubElement(manifest.getroot(),'uses-permission',{A+'name':permission})
receiver=ET.SubElement(app,'receiver',{A+'name':'br.com.campusestudos.banestes.evolution.StreakReminder',A+'exported':'false'})
intent=ET.SubElement(receiver,'intent-filter')
for action in ['android.intent.action.BOOT_COMPLETED','android.intent.action.TIME_SET','android.intent.action.TIMEZONE_CHANGED']:
 ET.SubElement(intent,'action',{A+'name':action})
manifest.write(decoded/'AndroidManifest.xml',encoding='utf-8',xml_declaration=True)
yaml=decoded/'apktool.yml';yaml.write_text(yaml.read_text().replace('versionCode: 2','versionCode: 4').replace('versionName: 1.1','versionName: 1.3'))
# Hook antes de loadWebView carregar a página: interface disponível no primeiro carregamento.
bridge=next(decoded.glob('smali*/com/getcapacitor/Bridge.smali'));s=bridge.read_text();needle='.method private loadWebView()V\n    .locals 10';assert s.count(needle)==1
s=s.replace(needle,needle+'\n\n    iget-object v0, p0, Lcom/getcapacitor/Bridge;->webView:Landroid/webkit/WebView;\n\n    invoke-static {v0}, Lbr/com/campusestudos/banestes/evolution/WidgetBridge;->install(Landroid/webkit/WebView;)V')
bridge.write_text(s)
for name in ['index.html','android.js','progression.js','content-validator.js','content-store.js']:
 shutil.copy2(root/name,decoded/'assets/public'/name)
config_path=decoded/'assets/capacitor.config.json';config=json.loads(config_path.read_text());config['appName']='Estudo para Concurso';config_path.write_text(json.dumps(config,ensure_ascii=False,indent=2))
# Compile somente os novos widgets contra a API Android; preserve os DEX anteriores.
classes=build/'classes';shutil.rmtree(classes,ignore_errors=True);classes.mkdir()
android=tools/'platform/android-35/android.jar'
run('java','-jar',tools/'ecj.jar','-source','1.8','-target','1.8','-bootclasspath',android,'-d',classes,*sorted((root/'native/src').rglob('*.java')))
jar=build/'widgets.jar'
from zipfile import ZipFile
with ZipFile(jar,'w') as z:
 for f in classes.rglob('*.class'):z.write(f,f.relative_to(classes))
dex=build/'dex';dex.mkdir(exist_ok=True)
run('java','-cp',tools/'android-15/lib/d8.jar','com.android.tools.r8.D8','--lib',android,'--min-api','23','--output',dex,jar)
# Apktool inclui o novo DEX como arquivo desconhecido sem recompilar suas classes.
existing=[1 if d.name=='smali' else int(d.name.split('classes')[-1]) for d in decoded.glob('smali*') if d.is_dir()]
extra=decoded/'unknown'/('classes'+str(max(existing)+1)+'.dex');extra.parent.mkdir(exist_ok=True);shutil.copy2(dex/'classes.dex',extra)
run('java','-jar',tools/'apktool.jar','b',decoded,'-o',args.output)
print('APK reconstruído sem assinatura:',args.output)
