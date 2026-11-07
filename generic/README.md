# Jornada de Estudos — variante independente

Aplicativo genérico sem conteúdo predefinido. A edição original continua intacta
na raiz do repositório. Esta variante usa **br.com.jornadadeestudos.app**, outro
banco local e outro APK; pode ser instalada ao lado de Estudo para Concurso.
Não desinstale a edição original para instalar esta variante.

## Como usar

No primeiro acesso, aparece **Sua jornada começa aqui.** Escolha criar uma trilha,
selecionar um arquivo JSON ou colar JSON. Nenhum exemplo é cadastrado sozinho.

- **Criar trilha:** informe nome e descrição; adicione leituras, questões ou
  lições com exercícios pela interface. Questões permitem 2 a 8 alternativas.
- **Minhas trilhas:** cartões com quantidade de etapas e conclusão; cada trilha
  tem sua própria jornada linear e seu próprio histórico de respostas.
- **Gerenciar:** renomear, alterar descrição, adicionar/editar/excluir etapas,
  excluir a trilha ou exportar o material. IDs existentes permanecem estáveis.
- **Importar:** arquivo ou texto colado usa a mesma validação. A prévia mostra
  adições, atualizações e itens ignorados. As escolhas de conflito são individuais.
- **Estudar:** leia o texto e responda às questões para concluir. Respostas têm
  feedback verde/vermelho, explicações e efeitos sonoros opcionais. Leituras não
  precisam de questões. Etapas novas são liberadas progressivamente.

A ofensiva é **global**: uma leitura concluída ou questão respondida conta como
estudo. Apenas abrir o app, importar conteúdo ou trocar de trilha não conta.
Várias atividades e trilhas no mesmo dia contam um único dia. Perder um dia
interrompe a sequência e mantém o histórico e o recorde. Não há XP, níveis,
moedas, recompensas ou conquistas nesta variante. Leituras concluídas podem ser
revistas e questões podem ser respondidas novamente para estudar em outros dias.

## JSON versão 1

Use [o modelo](examples/trilha-exemplo.json) e o [JSON Schema](examples/trilha.schema.json).
O modelo existe apenas no repositório, não é conteúdo pronto do aplicativo.
A tela **Como preparar o JSON** também explica o formato sem conexão à internet.

```json
{
  "versao_schema": 1,
  "trilha": {"id": "meu-curso", "nome": "Meu curso", "descricao": "Opcional"},
  "conteudos": [
    {"id": "tema-1", "titulo": "Meu tema", "tipo": "leitura", "conteudo": "Meu texto de estudo."}
  ]
}
```

O ID da trilha é a identidade principal, mesmo se o nome mudar. Para acrescentar
conteúdo, mantenha esse ID e use IDs novos para as novas etapas. O ID aparece no
gerenciamento e no JSON exportado. Uma trilha pode conter disciplinas diferentes.

Campos de uma etapa:

| Campo | Uso |
| --- | --- |
| `id` | Identidade permanente da etapa, única na trilha |
| `titulo` | Título, até 300 caracteres |
| `tipo` | `leitura`, `licao` ou `questao` (`etapa` equivale a `licao`) |
| `disciplina` | Nome opcional, até 200 caracteres |
| `conteudo` | Texto opcional, até 100.000 caracteres |
| `questoes` | Lista opcional de até 200 questões |

Uma etapa precisa de texto ou de questões. Uma etapa `questao` precisa ter pelo
menos uma questão. Um conteúdo só de leitura pode ter zero questões. Para uma
questão avulsa, os campos abaixo também podem ficar diretamente no conteúdo,
como no exemplo de referência solicitado pelo usuário.

Cada questão tem `id`, `enunciado`, `alternativas` (2 a 8 textos),
`resposta_correta` (índice numérico a partir de **zero**) e `explicacao`.
Enunciados, alternativas e explicações aceitam até 20.000 caracteres. IDs usam
1–80 letras ASCII, números, hífen ou sublinhado; `__proto__`, `constructor` e
`prototype` são reservados. IDs repetidos no mesmo pai são recusados.

Arquivos e texto colado têm limite de 20 MB e 10.000 etapas por importação. Para
mais conteúdo, divida em pacotes com o mesmo ID da trilha. Não há quantidade de
etapas fixa no caminho; as listas usam páginas de 50 etapas. As limitações são
por arquivo para evitar esgotamento da memória, não por concurso/curso.

Texto importado é escapado, não executado. HTML aparece como texto; não são
executados scripts, comandos ou instruções no JSON. A interpretação e validação
de arquivos e texto colado acontecem em um Worker.

### Duplicatas e alterações

- Trilha desconhecida: cria uma nova trilha; trilha existente: acrescenta nela.
- Conteúdo idêntico com mesmo ID: ignorado, sem duplicar.
- Mesmo ID com conteúdo alterado: escolha **Manter original**, **Atualizar com o
  importado** ou **Ignorar item importado**. O padrão é manter o original.
- Nome e descrição de uma trilha existente só mudam se a opção de atualização
  desses dados for marcada na prévia.
- Conteúdo novo é acrescentado ao final, na ordem do arquivo. Atualização de
  conteúdo mantém sua posição, conclusão e histórico de respostas.
- Ausência de uma etapa no novo arquivo não exclui a etapa antiga.
- Renomear um ID cria outra identidade. Mantenha os IDs para preservar vínculo.
- Exclusões só acontecem pelo gerenciamento com confirmação. Excluir uma etapa
  remove suas respostas; excluir uma trilha remove o progresso associado. Ambas
  mantêm o histórico global de dias estudados e o recorde.

## Exportações e backup

**Exportar conteúdo** produz JSON de uma trilha, sem respostas ou progresso,
compatível com a importação. Útil para compartilhar seu material.

**Exportar backup completo** reúne todas as trilhas, conteúdos, respostas,
históricos, conclusões, dias estudados e a preferência de efeitos sonoros.
**Restaurar backup** valida tudo antes e exige confirmação porque substitui os
dados desta variante. A edição original não é afetada. No navegador, os arquivos
são baixados; no Android, é usado o compartilhamento nativo para salvar/enviar.

Todos os dados ficam no aparelho em IndexedDB e funcionam offline. Desinstalação
ou limpeza de dados do Android pode apagá-los: mantenha cópias dos backups fora
do aplicativo. Não existe login ou sincronização remota.

## Arquitetura e compilação

A arquitetura existente é Capacitor/WebView, não Compose. Reaproveitamos o host
Android, o bridge de compartilhamento, os recursos de livro e a identidade visual,
sem introduzir uma segunda arquitetura de UI ou dependências desnecessárias.
IndexedDB é a persistência compatível com esse host; Room exigiria uma nova
camada nativa e bridge para todos os fluxos. Esta variante usa transações locais
para importação e, conjuntamente, para respostas/progresso/dias estudados.

- `model.js`: validação, normalização, comparação de conteúdos, exportação e backup.
- `store.js`: stores `tracks`, `contents`, `progress` e `meta`, em banco próprio.
- `streak.js`: regra civil de dias reaproveitada do original, sem as recompensas.
- `app.js`: interface, cadastro, importação, conflitos e estudo.
- `styles.css`: base visual reaproveitada; `variant.css`: ajustes da variante.
- `../tools/build_generic.py`: APK próprio, sem tocar nos fontes originais.

Para desenvolver, sirva a raiz do repositório e acesse `/generic/` internamente:

```sh
python3 -m http.server 8010 --bind 127.0.0.1
node generic/tests/model.test.cjs
python3 generic/tests/browser_smoke.py
```

Build reproduzível, usando as ferramentas já verificadas em `/workspace/android-tools`:

```sh
python3 tools/build_generic.py downloads/campus-estudos-banestes-feedback-debug.apk /tmp/generic-unsigned.apk
/workspace/android-tools/android-15/zipalign -f -P 16 4 /tmp/generic-unsigned.apk /tmp/generic-aligned.apk
# Assine com sua chave (mantida fora do Git) e então verifique:
/workspace/android-tools/android-15/apksigner verify --verbose /caminho/jornada-assinada.apk
/workspace/android-tools/android-15/zipalign -c -P 16 4 /caminho/jornada-assinada.apk
```

O host Android mantém o namespace Java de suas classes compiladas; applicationId,
permissões próprias, authorities do FileProvider, nome e preferências de URL são
independentes. Os assets educacionais da edição antiga são removidos do novo APK.
Os exemplos e testes não são empacotados no app. A cópia do bridge `android.js`
é feita no build; em desenvolvimento, o HTML o carrega da raiz do repositório.

A variante mantém a ofensiva dentro do app. Não contém widgets de XP/níveis ou
lembretes da edição original.

## Validação desta entrega

Passaram os testes de modelo e interface: instalação limpa, leituras e questões
cadastradas manualmente, edição e exclusão, múltiplas trilhas, histórico isolado,
importações por arquivo/texto, adição de etapas sem perder respostas, conflitos
por ID, escolha de metadados, transação IndexedDB abortada, reinício, exclusão
sem apagar os dias globais, exportação e reimportação em instalação limpa, backup
completo e restauração, revisão no dia seguinte, quebra da ofensiva, preferências,
uso offline e paginação de 3.000 etapas.

O mesmo roteiro também foi executado sobre os assets extraídos do APK final,
servidos no caminho raiz do host, além do diretório de desenvolvimento. A rota
de compartilhamento nativo foi testada no navegador com plugins simulados.

`generic/tests/apk_integrity.py` verifica o APK real: applicationId, nome, versão,
FileProvider próprio, classe de entrada disponível, ícones adaptativos, assets
idênticos aos testados, ausência do conteúdo predefinido, assinatura, alinhamento
e preservação dos arquivos funcionais da edição original.

Não há aparelho/emulador Android disponível neste ambiente. A instalação física,
a apresentação do ícone no launcher e a abertura do seletor/compartilhamento do
Android ainda precisam de conferência no dispositivo. A compilação, integridade
e fluxos principais no WebView equivalente (Chromium) passaram; não foram
identificados erros de compilação ou falhas pendentes nos fluxos testados.
