# Jornada de Estudos — Windows portátil 1.0.1

Distribuição para **Windows 10/11 de 64 bits**. Extraia a pasta completa do ZIP e
abra **JornadaDeEstudos.exe**. Não precisa instalar Node.js, Python, Java, Android,
emulador, WebView2 ou outro runtime. Não exige administrador. O motor Electron
45.2.3 e todos os recursos necessários já estão incluídos; funciona offline.

## Fidelidade e escolha técnica

O aplicativo existente é Capacitor/WebView com JavaScript, não Kotlin/Compose.
Esta adaptação reutiliza os mesmos `generic/model.js`, `store.js`, `streak.js`,
CSS e interface de estudo. Não reescreve as regras, o esquema JSON, a persistência
transacional, a correção, as explicações, os sons ou o progresso.

Electron foi escolhido para incluir um motor completo e previsível: Tauri/WPF
com WebView2 precisariam depender do runtime do Windows ou incluí-lo também.
A distribuição maior evita exigir downloads ou instalação de dependências.
Há uma única janela, sem serviços, sincronização, telemetria ou atualizador.
As edições Android e seus arquivos permanecem inalterados.

O build copia os assets compartilhados e acrescenta somente a folha de estilos
`desktop.css`, o adaptador de teclado `desktop.js` e um ramo de exportação nativa
em `exportJson` na cópia empacotada. Essa transformação é verificada pelo script;
o código-fonte Android não é modificado.

## Uso

O programa começa sem conteúdo. Crie trilhas manualmente ou importe os mesmos
JSONs da variante Android Jornada de Estudos. Aceita arquivos e texto colado,
resolve conflitos individualmente, mantém IDs e progresso e acrescenta as novas
etapas ao final. Os arquivos de conteúdo e backup são os mesmos nas duas versões.

- **Exportar conteúdo:** uma trilha sem dados de progresso, para compartilhar.
- **Backup completo:** todas as trilhas, respostas, conclusões, histórico,
  ofensiva e a preferência de áudio. Pode ser restaurado no Android, e vice-versa.
- **Ctrl+O:** selecionar arquivo JSON.
- **Ctrl+Shift+B:** exportar backup completo.
- **1 a 5:** selecionar alternativa da questão atual.
- **Enter:** confirmar resposta ou concluir etapa, conforme o contexto.
- **Esc:** voltar. Não interfere em campos de digitação.
- **F11:** tela inteira. **Ctrl+ + / Ctrl+ -:** ajustar zoom.

A navegação usa barra lateral em janelas maiores e se reorganiza em janelas
menores. Há cartões de trilha, mouse/rolagem, foco visível e menus do Windows.
Apenas a ofensiva permanece como gamificação, igual à variante Android genérica.

## Dados portáteis

```text
Jornada-de-Estudos-Windows/
  JornadaDeEstudos.exe
  Dados/
    Perfil/          # preferências do aplicativo
    Navegador/       # IndexedDB e armazenamento da sessão
    Temporarios/
    Registros/
    Falhas/
  resources/app/     # programa e recursos
  ...               # DLLs e recursos do motor incluído
```

Os caminhos são calculados a partir da pasta do executável, antes de abrir a
primeira sessão. Não há armazenamento obrigatório em AppData ou Registro. O
banco IndexedDB/LevelDB é o mesmo armazenamento transacional do Android, contido
em `Dados`; ele é equivalente para este host, sem uma segunda base de regras.

Uma origem local estável **jornada://app/** evita perder o IndexedDB ao mudar o
caminho da pasta. Feche o aplicativo antes de copiar ou mover a pasta **completa**,
incluindo `Dados`. Não execute de dentro do ZIP nem mova somente o executável.
Não copie o banco enquanto ele estiver em uso. Não há sincronização automática.

Se não houver permissão de gravação, o programa avisa e encerra; não troca
silenciosamente para uma pasta de sistema. As exportações usam o diálogo nativo
de salvamento, com gravação temporária, sincronização e renomeação no mesmo local
para evitar arquivos JSON parciais.

## Segurança e distribuição

A janela usa `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`,
CSP local e bloqueio de navegação externa, webviews e novas janelas. O renderer
não recebe acesso a arquivos ou APIs Node. O único IPC de escrita pede ao usuário
o destino no diálogo e aceita apenas JSON de tamanho limitado. Nomes sugeridos
são sanitizados. Não há servidor HTTP ou portas abertas no computador do usuário.

Os runtimes oficiais Windows e Linux foram verificados contra os SHA-256
publicados pela versão Electron. O ícone e os metadados do executável são
personalizados com resedit 3.1.0. A assinatura Authenticode original do runtime
não é reaproveitada após a alteração; o PE entregue está sem assinatura comercial.
O Windows pode mostrar um aviso de editor desconhecido. Não há instalador,
registro de protocolo no sistema, serviços, associações ou gravação no Registro.

O ZIP tem aproximadamente **139 MiB** porque inclui o motor completo. É publicado
via Git LFS, pois supera o limite de 100 MiB por arquivo do Git convencional.
Quem baixa o ZIP pelo GitHub não precisa instalar Git LFS. Para obter o binário
clonando o repositório como desenvolvedor, use `git lfs pull`.

## Compilação reproduzível

Ferramentas apenas para desenvolver/compilar, não para o computador do usuário:
Node 24, Python 3 com Pillow para regenerar o ícone (opcional) e resedit fixado no
lockfile em `windows/build-tools`. `npm ci --prefix windows/build-tools` instala
apenas ferramentas de build.

Baixe os ZIPs oficiais `electron-v45.2.3-win32-x64.zip` e
`electron-v45.2.3-linux-x64.zip` e o `SHASUMS256.txt` da release Electron 45.2.3.
O ambiente desta entrega os conserva em `/workspace/windows-tools` com os nomes
`electron-win.zip` e `electron-linux.zip`. O builder confere o checksum Windows.

```sh
python3 tools/build_windows.py --tools /workspace/windows-tools
```

O diretório de ferramentas deve conter `build-deps/node_modules/resedit`
(instalável com o mesmo package-lock). O script produz a pasta portátil e o ZIP;
recusa reconstruir sobre um destino que já contenha `Dados/Perfil`, protegendo o
usuário. O arquivo `ARQUIVOS.sha256.json` lista os hashes de todos os arquivos
limpos da distribuição. O `.ico` possui versões de 16 até 256 pixels.

## Validação executada

- Modelo compartilhado: validação, conflitos, backup, ofensiva e 3.000 etapas.
- `node windows/tests/portable.cjs`: caminhos, Unicode, diretório sem permissão,
  exportação atômica e sanitização.
- `node windows/tests/electron.cjs`: aplicativo Electron real no Linux, início
  vazio, cadastro, questão/correção, sons, atalhos, importação arquivo/texto,
  continuação de trilha, exportação pelo IPC/diálogo, persistência, tema/áudio,
  redimensionamento e funcionamento sem serviços remotos.
- O teste fecha o app, move o código e a pasta Dados para outro caminho e reabre:
  trilhas, respostas, conclusões, ofensiva e preferências permanecem iguais.
- `python3 windows/tests/distribution.py`: PE GUI x64 real, código nativo `.text`
  idêntico ao runtime oficial, recursos, hashes, ZIP, perfil inicial vazio e
  preservação dos fontes Android.

O teste Electron usa `--no-sandbox` e modo headless somente na execução de testes
Linux deste ambiente; a distribuição Windows não inclui nem aplica esses flags.
Diálogos de confirmação/salvamento são controlados no teste. O executável Windows
foi gerado e inspecionado, mas **não executado em Windows 10/11 real**: não há
Windows ou Wine disponível neste ambiente. A confirmação final de instalação
zero e de diálogos do sistema será feita no computador Windows do usuário.


## Atualização 1.0.1 — importação de arquivos Windows

O seletor de arquivos usa agora o diálogo nativo do Windows e leitura direta do
arquivo selecionado, com indicação de nome, tamanho, codificação e versão lida.
Aceita UTF-8 com/sem BOM e UTF-16 LE/BE. A versão textual `"1"` é normalizada
para o número `1`; outras versões ou campos ausentes não são aceitos em silêncio.
Esquemas JSON, backups e manifestos do programa recebem instruções específicas.
Uma seleção inválida descarta a prévia anterior sem alterar os dados de estudo.
O cache de arquivos do programa é limpo ao abrir, sem apagar IndexedDB ou progresso.

O arquivo fornecido pelo usuário, com 20 questões de interpretação de textos,
foi importado no runtime Electron pelo novo caminho nativo. Esse arquivo já era
válido; a falha relatada não foi reproduzida com o anexo no leitor anterior.
A atualização torna a leitura e o diagnóstico verificáveis no computador do usuário.

Para atualizar preservando os dados: feche o programa, extraia a nova versão em
outra pasta e copie para ela a pasta **Dados** da versão anterior. A origem local
e o esquema do banco são os mesmos. Não copie enquanto o programa estiver aberto.
