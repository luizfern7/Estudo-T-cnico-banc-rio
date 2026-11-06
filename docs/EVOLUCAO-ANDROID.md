# Evolução, conteúdo dinâmico e Android 1.2

## Arquitetura e preservação

Continuação do código recuperado do APK e publicado na branch
`download/apk-feedback-20261104`. O aplicativo permanece Capacitor/WebView com
lições e questões originais incorporadas; `applicationId` continua
`br.com.campusestudos.banestes` e a origem HTTPS local e a chave de progresso
`banestes2026_plataforma_v1` foram preservadas.

- `progression.js`: XP idempotente, níveis, migração do histórico, dias estudados.
- `content-validator.js`: esquema versão 1, validação e conversão em Worker.
- `content-store.js`: transações IndexedDB para pacotes.
- `index.html`: jornada contínua paginada, tela Minha Evolução, metas, conquistas,
  importação, atualização e remoção confirmadas, feedback e som.
- `android.js`: backup via compartilhamento nativo inclui progresso e pacotes.
- `native/src`: widgets RemoteViews e bridge de métricas, sem dependências novas.
- `native/res`: layouts dos dois widgets, metadados, livro em vetor, ícones
  adaptativos, monocromático e fallback legado, fundo e splash.
- `tools/build_android.py`: reconstrução reproduzível a partir do APK anterior.

O projeto Gradle original não estava no ambiente. O build usa Apktool para manter
as classes e os recursos existentes, ECJ para compilar as classes Java novas e D8
para gerar um DEX adicional. O único ponto alterado no Capacitor nativo registra
a interface limitada `StudyWidgets.update` antes de carregar o WebView. Ela aceita
apenas métricas em JSON e não oferece comandos, arquivos ou execução de código.
O conteúdo importado é sempre escapado antes de entrar no DOM. Links externos
continuam sujeitos às regras de navegação originais do Capacitor.

## Recompensas e migração

Primeira resposta confirmada de cada questão: 10 XP (acerto) ou 2 XP (erro).
Primeira conclusão de etapa: 30 XP; conclusão de módulo: 100 XP; meta diária:
30 XP uma vez por data. A repetição, renderização, importação ou remoção de pacote
não repete XP. O ledger conserva recompensas ao desfazer uma conclusão ou remover
um pacote; reimportar os mesmos IDs recupera o progresso. Sem penalidade por pausa.

Níveis e limiares: Iniciante (0), Aprendiz (100), Estudante Dedicado (300),
Explorador do Conhecimento (700), Concurseiro Persistente (1500), Mestre dos
Estudos (3000) e Rumo à Aprovação (6000). Depois do último nível, XP continua
acumulando. Meta padrão: duas etapas; configurável de 1 a 100. Semana: segunda a
domingo, usando a data local do aparelho. Só conclusões inéditas contam para a
meta e frequência. Conquistas ficam guardadas: 10/25/100 etapas, módulos e cinco
dias estudados na mesma semana.

O histórico anterior recebe uma migração única: primeira resposta histórica por
questão, conclusões e módulos já completos concedem os respectivos XP. Datas de
conclusão não armazenadas pelo app antigo não são inventadas nem contadas hoje.
Backup inclui todos os dados; restaurar backup e apagar progresso ainda exigem
as confirmações existentes. Limpar dados do Android/desinstalar apaga o estado
local: exporte backup antes. A nova versão usa a mesma chave de desenvolvimento
da versão de feedback desta sessão; não é a chave do primeiro APK enviado.

## Widgets

**Minha Evolução · compacto (2×1)** e **expandido (4×2)** são adicionados pelo
seletor de widgets do launcher. O compacto mostra livro, nível, XP e barra; o
expandido acrescenta etapas de hoje, meta e dias da semana. Tocar abre o app.
SharedPreferences recebe uma fotografia das métricas após os salvamentos de
atividade; os widgets são atualizados no mesmo momento e a cada 30 minutos pelo
Android. Dia/semana são calculados de novo no provider, inclusive depois de virar
o dia. Restrições de bateria do launcher podem adiar atualizações periódicas.
Os widgets não exigem login ou rede.

## Som

Acerto: duas notas triangulares ascendentes com ganho 0,22 (anterior: seno em
0,075); erro: duas notas senoidais suaves em 0,10. Envelopes curtos evitam cliques;
pico somado inferior a 0,44. Não altera volume global do dispositivo. A preferência
Efeitos sonoros e as políticas de gesto do Web Audio são respeitadas. Animações
respeitam `prefers-reduced-motion`.

## Compilação e testes

Ferramentas externas ficam fora do Git em `/workspace/android-tools`: Apktool
2.11.1, Android Build Tools 35, plataforma Android 35, ECJ 3.40 e org.json para
os testes Java. Download oficial HTTPS; checksums publicados da plataforma,
Build Tools e ECJ foram conferidos. Chaves de assinatura não são versionadas.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
# Em outro terminal:
node tests/progression_content.test.cjs
python3 tests/feedback_smoke.py
python3 tests/evolution_import_smoke.py
python3 tools/build_android.py downloads/campus-estudos-banestes-feedback-debug.apk /tmp/unsigned.apk
/workspace/android-tools/android-15/zipalign -f -P 16 4 /tmp/unsigned.apk /tmp/aligned.apk
# Assinar com a chave compatível, depois verificar:
/workspace/android-tools/android-15/apksigner verify --verbose /caminho/assinado.apk
/workspace/android-tools/android-15/zipalign -c -P 16 4 /caminho/assinado.apk
```

`tests/WidgetCountsTest.java` executa no JVM as métricas do provider real (passando
org.json antes de android.jar no classpath). A integração de emissão de snapshots
é exercitada no Playwright. Build e inspeção do manifest verificam os providers,
layouts e ícones. A renderização e adição dos widgets pelo launcher, o seletor de
arquivos no Android e o som no alto-falante precisam ser conferidos no aparelho:
este ambiente não dispõe de emulador ou dispositivo Android.
