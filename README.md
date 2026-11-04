# Campus de Estudos BANESTES

Aplicação de estudos offline baseada no `index.html` original, agora com projeto Android em Capacitor. O HTML original permanece independente e pode continuar sendo aberto ou servido normalmente.

## Gerar o APK

Pré-requisitos: Node.js 22 ou superior, JDK 21 e Android SDK com plataforma Android 35 e Build Tools 34.0.0 (instalados automaticamente pelo Gradle quando as licenças estão aceitas). Configure `JAVA_HOME` e `ANDROID_HOME` ou abra a pasta `android` no Android Studio e instale os componentes solicitados. Aceite as licenças do SDK. Não versione `android/local.properties`.

```sh
npm ci
npm run apk
```

O APK de teste assinado é gerado em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Para trabalhar com Android Studio:

```sh
npm run sync:android
npm run android
```

O Gradle Wrapper baixa a versão fixada e verifica seu SHA-256. O primeiro build precisa de internet para obter as ferramentas e dependências. O aplicativo compilado inclui todo o conteúdo e funciona sem internet.

## Uso no aparelho

Instale o APK autorizando a instalação pelo aplicativo que abriu o arquivo. Requer Android 6.0 ou superior. O progresso fica no armazenamento local do aplicativo. Em Configurações, use Exportar para salvar ou compartilhar um backup JSON; Importar abre o seletor de arquivos do Android. Desinstalar ou limpar os dados pode apagar o progresso. Os dados do navegador não são transferidos automaticamente: exporte e importe o backup.

Identificador: `br.com.campusestudos.banestes`. Nome: Campus de Estudos BANESTES.

O APK debug é destinado a instalação e testes. Para distribuir uma versão de produção ou publicar na Play Store, gere uma versão release com sua própria chave de assinatura, guardada fora do repositório. A identidade visual e o material são de preparação independente, sem vínculo oficial com o BANESTES.

## Organização

- `index.html`: conteúdo original.
- `mobile/android.js`: integração de backup com o compartilhamento nativo.
- `scripts/build-web.mjs`: prepara os assets offline e empacota a integração nativa em `www`, sem modificar o HTML original.
- `android`: projeto Android e Gradle Wrapper.

Após editar o HTML ou a integração, execute `npm run sync:android` antes de compilar. `www`, assets copiados, caches, APKs e caminhos locais não são versionados.

## Validação

```sh
npm test
```

Os sete testes verificam backup JSON, exportação no navegador, falha de escrita, cancelamento do compartilhamento e comportamento do botão Voltar do Android. Eles usam plugins simulados; não substituem testes de instalação, seletor de arquivos e compartilhamento em um Android real.

## Trilha de aprendizagem (versão 1.1)

A tela inicial mostra a primeira aula ainda não concluída. As aulas são liberadas em sequência; etapas já concluídas continuam abertas para revisão. O avanço exige pelo menos 90% de leitura e resposta aos exercícios integrados, mantendo os critérios do conteúdo original. Depois da conclusão, uma tela oferece acesso direto à próxima aula.

As três entradas principais são Trilha, Praticar e Mais. Questões, simulados e revisões ficam em Praticar; caderno, biblioteca, estatísticas, preferências e backup ficam em Mais. Dentro da aula, as ferramentas complementares ficam recolhidas. Todas as 112 aulas, 185 questões, 8 materiais e 10 estudos de caso dos 18 módulos foram preservados.

O formato de backup e a chave de armazenamento existentes são mantidos. Atualizações com o mesmo identificador e a mesma chave de assinatura preservam os dados. Não desinstale o aplicativo anterior para atualizar; faça um backup antes. A posição de leitura é retomada ao tocar em Continuar aula. O botão Voltar do Android retorna à navegação anterior ou minimiza o aplicativo quando a trilha está aberta.

Para executar os seis cenários de interface (incluindo preservação integral do conteúdo, progressão, retomada, último módulo, backup e dimensões móveis):

```sh
npm run test:ui
```

É necessário Chromium instalado. O teste usa `/usr/bin/chromium` por padrão; defina `CHROMIUM_PATH` para outro caminho. Os testes de navegador verificam os fluxos web do APK. A instalação e a integração nativa continuam exigindo conferência em um aparelho Android.
