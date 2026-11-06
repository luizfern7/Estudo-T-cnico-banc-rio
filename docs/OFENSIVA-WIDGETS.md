# Versão 1.3 — Ofensiva e widgets

## Regra de contagem

Um dia com ao menos uma **nova etapa concluída** mantém a ofensiva. Apenas abrir
o app ou tocar no widget não conta como estudo. Várias conclusões no mesmo dia
incrementam um único dia. A contagem usa datas locais do aparelho, sem dividir
intervalos por 24 horas: resiste a mudanças de horário de verão, meses e anos.

Se a última conclusão foi ontem, a ofensiva permanece ativa com o estado **Em
risco** até o fim de hoje. Se passar um dia inteiro sem conclusão, a sequência
zera. O recorde continua visível; nenhum XP, nível, conquista, conteúdo importado
ou marcação de conclusão é removido. Não há proteção automática nesta versão.
Os dias de conclusão já registrados na versão 1.2 são reconhecidos sem migração
destrutiva. Conclusões antigas sem data continuam sem data, como antes.

Marcos de 1, 3, 7, 14, 30, 60, 100 e 365 dias têm comemoração discreta no app;
reabrir a tela não a reproduz. Movimento reduzido é respeitado pelas animações
existentes. A ofensiva, seu recorde e os avisos derivam do histórico persistido e
estão incluídos no backup, mantendo compatibilidade com o formato anterior.

## Alertas

O app exibe a sequência, recorde e aviso de risco em **Minha Evolução** e na
trilha. A mensagem é recalculada ao abrir, ao retornar ao app e na virada do dia.

**Preferências e backup → Ofensiva e lembretes → Lembretes da ofensiva** ativa os
avisos locais opcionais. Vêm desativados. Android 13 ou superior solicita
permissão de notificações a partir dessa ação; se negada ou se o canal estiver
bloqueado, apenas os alertas dentro do app continuarão visíveis. A preferência é
salva e pode ser desativada imediatamente.

O lembrete de risco é agendado para aproximadamente 20h, no horário do aparelho,
somente notificando se ainda houver uma sequência em risco. O alarme é inexato e
pode ser adiado pelo sistema/economia de bateria; não usa permissão de alarme
exato. É reagendado depois de disparar, reiniciar o aparelho ou alterar o fuso.
Notificações de marcos usam as mesmas datas e são deduplicadas. Desativar os
lembretes cancela o alarme e os avisos atuais. Concluir a etapa dispensa o aviso
de risco. Tocar na notificação abre o app.

## Widgets

Os dois widgets preservam o identificador e os providers anteriores: widgets já
adicionados não precisam de um novo provider. Chama vetorial, contador, cores de
estado, tipografia hierárquica, cantos arredondados, gradiente discreto, elevação
e ripple nativo no toque atualizam a apresentação.

O compacto mostra a ofensiva, nível, XP e progresso. O expandido acrescenta o
estado (mantida/em risco), recorde, meta e frequência semanal. Ao redimensionar,
o provider escolhe o layout compacto se não houver espaço suficiente; tamanho
de fonte do sistema também participa da escolha. Linhas limitadas e elipse
evitam texto transbordando em larguras pequenas. A contagem é recalculada pelo
código nativo com a data atual mesmo quando o app está fechado; as atualizações
periódicas continuam sujeitas ao agendamento do launcher. Conclusões publicam
imediatamente os dados para os widgets.

## Arquivos e validação

- `progression.js`: contagem civil da sequência, recorde e deduplicação de marcos.
- `index.html`: indicador, alertas, comemoração e preferência persistida.
- `native/src/.../StreakRules.java`: mesma regra de datas para os widgets.
- `native/src/.../StreakReminder.java`: canal, alarme inexato e notificações locais.
- `WidgetBridge.java`: sincronização de preferência e pedido de permissão por ação.
- `StudyWidget.java` e `native/res`: layout adaptativo, chama e feedback de toque.
- `tools/build_android.py`: versão 1.3/código 4, permissões e receiver do lembrete.

Testes executados:

- `node tests/streak.test.cjs`: 12 cenários de datas, recorde, persistência, marcos,
  repetição e ausência de perda/concessão extra de XP.
- `StreakNativeTest.java`: mesmos 12 casos em UTC, São Paulo e Nova York;
  seleção dos layouts compacto/expandido e marcos.
- `python3 tests/streak_smoke.py`: app real no Chromium, relógio controlado,
  avanço por conclusão, risco, quebra, persistência, comemoração única,
  preferência de lembretes e layout móvel.
- Regressões de XP/importação e `feedback_smoke.py`/`evolution_import_smoke.py`.
- Compilação Java/D8/Apktool, assinatura, alinhamento e `apk_integrity.py`.

Os testes de interface usam um bridge nativo simulado para observar os eventos.
A regra Java real também foi testada na JVM. Sem dispositivo/emulador Android,
a apresentação final no launcher, o ripple, o diálogo de permissão e a entrega
efetiva das notificações em segundo plano **não foram executados** neste ambiente.

O applicationId, origem do WebView, dados e chave da versão 1.2 foram preservados.
O APK pode ser instalado por cima da versão 1.2 enviada nesta conversa, sem
necessidade de desinstalação. Faça um backup antes de atualizar.
