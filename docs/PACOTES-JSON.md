# Pacotes de conteúdo — esquema 1

No app, abra **Mais → Conteúdos importados → Importar conteúdo** (também em
Preferências e backup). O seletor nativo do Android permite escolher um `.json`.
Confira o resumo e confirme. As etapas são acrescentadas depois do conteúdo
básico; a primeira etapa ainda não concluída da jornada é a próxima liberada.
Pacotes não são restritos a uma banca ou concurso.

Use [o exemplo completo](../examples/matematica-basica.json) e o
[JSON Schema](../examples/pacote.schema.json). A estrutura é:

- `schemaVersion`: número inteiro `1`.
- `packageId`: identidade permanente do pacote; `titulo`: título do pacote.
- `disciplinas[]`: `id`, `nome`, `modulos[]`.
- Módulo: `id`, `titulo`, `etapas[]`.
- Etapa (uma lição da jornada): `id`, `titulo`, `questoes[]`, e, opcionalmente,
  `assunto` e `conteudo` (texto da aula).
- Questão: `id`, `enunciado`, `alternativas` (2 a 8 textos),
  `respostaCorreta` (índice numérico **a partir de zero**) e `explicacao`.

Todos os IDs têm 1 a 80 caracteres, usando apenas letras ASCII, números, hífen e
sublinhado; `__proto__`, `constructor` e `prototype` são reservados. IDs devem ser
únicos no respectivo pai. Não altere IDs nem mova lições para outros pais em uma
atualização: a identidade interna inclui pacote, disciplina, módulo e etapa.

As listas são obrigatórias e não vazias. Textos têm limite: títulos de pacote,
disciplina e módulo, 200 caracteres; títulos de etapa e assunto, 300; conteúdo,
100.000; enunciados, alternativas e explicações, 20.000 cada. O arquivo pode ter
até 20 MB, 20.000 etapas e 100.000 questões. Divida material maior em pacotes.
Limites evitam esgotamento de memória; a jornada não tem um total fixo de etapas.

## Segurança e persistência

O arquivo é lido, interpretado e normalizado em um Worker. Texto, incluindo tags
HTML, é exibido como texto escapado, nunca como código. Não há JavaScript, links
ativos, scripts ou instruções executáveis no formato. Use quebras de linha para
organizar os parágrafos. Cada etapa precisa de ao menos uma questão; se não
houver conteúdo textual, a lição mostra uma breve orientação de prática.

Pacotes são persistidos em IndexedDB, em uma transação de leitura/gravação.
Nenhuma etapa é ativada em memória antes do commit. Falhas de leitura, validação
ou gravação não substituem o conteúdo anterior. O progresso existente continua
na chave de localStorage original do app. Backup exportado no navegador e no
Android inclui todos os pacotes, XP, metas e progresso.

Importar o mesmo `packageId` pede confirmação de atualização ou permite cancelar.
IDs mantidos preservam marcações, respostas, anotações e XP. Atualizações que
removeriam etapas ou questões existentes são recusadas; mantenha os IDs ou
remova explicitamente o pacote primeiro. Pacotes distintos têm IDs isolados.
Não concedemos XP por importação, atualização, navegação ou renderização.

**Remover pacote** pede confirmação. Remove as aulas/questões importadas da
jornada, mas mantém XP, conquistas e registros de progresso associados. Reimportar
os mesmos IDs restaura as marcações. Nenhum conteúdo básico é removido. Um pacote
usado no simulado em andamento só pode ser removido depois da finalização.

Módulos recolhidos não criam o DOM das lições; ao abrir, exibem páginas de 60
etapas. Banco de questões e lista de aulas também têm páginas de 60. Todo o
conteúdo continua disponível, independentemente do tamanho da página.
