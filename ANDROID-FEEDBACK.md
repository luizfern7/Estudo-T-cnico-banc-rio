> Histórico da versão 1.1. A continuação atual está em [Evolução e Android](docs/EVOLUCAO-ANDROID.md).

# Continuidade do APK — feedback das questões

A base desta alteração foi recuperada de `assets/public/index.html` do APK
`campus-estudos-banestes-debug (1) (1).apk` enviado pelo usuário. Essa versão já
continha a navegação por trilha e integração Capacitor, diferentes do HTML que
estava no Git. O arquivo `android.js` também foi preservado do APK. Conteúdo de
aulas e questões, armazenamento de progresso e integração nativa foram mantidos.
O projeto Android/Gradle original e a chave de assinatura original não foram
recuperados. O APK foi atualizado substituindo apenas o HTML no pacote original.

## Desenvolvimento e testes

Na raiz do checkout, executar:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Em outro terminal, com Playwright Python e Chromium disponíveis:

```sh
python3 tests/feedback_smoke.py
```

O teste usa contexto descartável: verifica respostas corretas/incorretas nas aulas
e banco, preservação das explicações, áudio sem duplicação, configurações,
movimento reduzido, tema escuro, responsividade e comportamento dos simulados.
Não confirma a qualidade percebida do som no alto-falante de um celular real.

Os sons são sintetizados localmente pela Web Audio API, sem downloads. Som e
animação são acionados pelos eventos de confirmação, nunca por renderização ou
pela rotina compartilhada de pontuação. `soundEffects` usa o estado e backup já
existentes; dados antigos recebem o padrão ativado. Navegar por resultados de
simulados não toca som e mantém as cores de cada resposta.

## Reempacotar e assinar

```sh
python3 tools/repack_apk.py /caminho/original.apk /tmp/unsigned.apk
/workspace/android-tools/android-15/zipalign -f -p 4 /tmp/unsigned.apk /tmp/aligned.apk
/workspace/android-tools/android-15/apksigner sign --ks /caminho/chave.keystore --out /tmp/atualizado.apk /tmp/aligned.apk
/workspace/android-tools/android-15/apksigner verify --verbose /tmp/atualizado.apk
/workspace/android-tools/android-15/zipalign -c -p 4 /tmp/atualizado.apk
```

Use a chave original para uma atualização compatível. O pacote e versão nativos
permanecem os originais (`br.com.campusestudos.banestes`, 1.1 / código 2).
A nova chave de desenvolvimento usada nesta sessão está fora do Git, em
`/workspace/android-tools/feedback-debug.keystore`; ela não corresponde à original.
O APK entregue com essa chave não pode substituir a instalação anterior.
Antes de qualquer desinstalação, exporte o progresso no app antigo e guarde o JSON
fora do app; importe no novo depois. Se não puder exportar, mantenha a instalação
anterior até obter a chave original. Nenhuma instalação/desinstalação foi feita
neste ambiente e não houve validação em Android real.
