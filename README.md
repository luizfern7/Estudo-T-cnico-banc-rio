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

Os quatro testes verificam o backup JSON nativo, a preservação da exportação no navegador, falha de escrita e cancelamento do compartilhamento. Eles usam plugins simulados; não substituem testes de instalação, seletor de arquivos e compartilhamento em um Android real.
