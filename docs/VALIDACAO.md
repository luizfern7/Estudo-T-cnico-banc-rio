# Validação da versão 1.2

Executado no ambiente desta tarefa:

| Verificação | Resultado |
| --- | --- |
| Regras de XP, concessão única, níveis, metas e migração | Passou (`node tests/progression_content.test.cjs`) |
| IDs, versões, alternativas, respostas, duplicatas e texto malicioso | Passou (mesma suíte) |
| Normalização de pacote com 3.000 etapas | Passou (mesma suíte) |
| Feedback, áudio por confirmação, preferência, movimento reduzido, simulados | Passou (`python3 tests/feedback_smoke.py`, Chromium) |
| Importar, atualizar, remover e reimportar, mantendo XP e progresso | Passou (`python3 tests/evolution_import_smoke.py`) |
| Gravação IndexedDB abortada sem conteúdo parcial | Passou (mesmo teste de navegador) |
| Jornada de 3.000 etapas, paginação de 60, layout móvel | Passou (mesmo teste de navegador) |
| Backup inclui progresso, evolução e conteúdo dos pacotes | Passou (mesmo teste de navegador) |
| Emissão de métricas para o bridge dos widgets | Passou com bridge simulado no navegador |
| Métricas do provider Java: dia atual, semana e virada da semana | Passou (`tests/WidgetCountsTest.java`, JVM) |
| Compilação Java/D8, recursos e reconstrução Apktool | Passou |
| APK: nome, versão, applicationId, providers, layouts, ícone e DEX novo | Passou (`python3 tests/apk_integrity.py`) |
| Assets publicados iguais ao código testado; conteúdo básico inalterado | Passou (mesmo teste do APK) |
| Assinatura válida, alinhamento e certificado igual ao APK de feedback | Passou (mesmo teste do APK) |
| Instalação, seletor de arquivos e widgets exibidos no launcher Android | Não executado: sem dispositivo/emulador disponível |
| Percepção do som no alto-falante do celular | Não executado: volume aumentado no sintetizador e fluxo testado no navegador |

O novo APK pode atualizar o APK de feedback assinado nesta sessão (versão 1.1,
código 2), preservando os dados locais. Não corresponde à chave privada do
primeiro APK anexado pelo usuário. Instale sobre a última versão enviada, sem
desinstalá-la; exportar um backup antes continua sendo recomendável.
