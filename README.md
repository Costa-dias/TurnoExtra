# TURNO EXTRA — Agenda de serviços

Aplicativo web para anotar e controlar **plantões, serviços, horas extras e contratos**: calendário mensal, valores, pagamentos, relatórios e backup. Feito para quem presta serviços fora do horário habitual de trabalho, como profissionais de saúde, cooperados e freelancers.

Os dados ficam **somente no seu aparelho**, protegidos por PIN. Não existe conta, servidor nem nuvem.

🔗 **Site:** https://gestao-de-plantao.onrender.com/

## Funcionalidades

- Tipos de serviço: **plantão, serviço, hora extra e contrato**
- Hora extra com valor por hora e total calculado automaticamente
- Contrato por **hora, dia, semana ou mês**, com data final e data de pagamento
- Serviços sem horário definido
- Calendário mensal com cores por empresa ou local
- **Modelos**: salve um serviço e use com 1 toque em qualquer dia
- **Repetição**: todo dia, a cada 2 dias (12x36), toda semana ou a cada 2 semanas
- Controle de pagamento (pago ou a receber) com data
- **Relatório** por período, empresa e tipo, com impressão em PDF e compartilhamento
- Exportação em **planilha CSV** para conferir no celular ou no PC
- **Backup criptografado** (.json) com exportação e importação
- Lembrete de backup após 30 dias
- Tema claro e escuro
- Interface pensada para o celular

## Privacidade e segurança

- Nenhum dado sai do seu navegador
- Dados criptografados com **AES-GCM de 256 bits**; chave derivada do PIN (PBKDF2 com SHA-256)
- O PIN nunca é salvo; PINs óbvios (como 1111 ou 1234) são recusados na criação
- Bloqueio temporário após 5 tentativas de PIN incorretas
- Sem bloqueio por inatividade: o aplicativo continua aberto e desbloqueado mesmo em segundo plano
- O PIN volta a ser exigido ao fechar e abrir novamente, recarregar a página ou usar o botão **Bloquear**
- Ao bloquear manualmente, os dados e o PIN são removidos da memória do aplicativo; não são gravados em sessão ou armazenamento local sem criptografia
- Backup criptografado, com validação rigorosa e limite de 5 MB na importação
- Proteção contra perda de dados: se os dados salvos não puderem ser lidos, o app bloqueia novas gravações em vez de sobrescrevê-los
- Entradas validadas; planilha protegida contra injeção de fórmulas
- Content Security Policy e cabeçalhos de segurança; nota A no securityheaders.com e no Mozilla Observatory

## Limitações conhecidas

- Os dados ficam **somente no navegador do aparelho**. Limpar os dados do site apaga tudo, por isso faça backup com frequência.
- **Não há recuperação de PIN.** Esquecendo o PIN, os dados não podem ser abertos.
- O backup só abre com o PIN que estava ativo quando ele foi exportado.
- Com PIN numérico curto, a proteção depende de o aparelho não ser acessado por terceiros.
- A planilha CSV **não é criptografada**: guarde com cuidado.
- Ferramenta de organização pessoal, fornecida sem garantia. Confira valores e pagamentos nos seus documentos oficiais.

## Tecnologias

React, TypeScript, Vite, Tailwind CSS, Lucide, Web Crypto API e IndexedDB.

## Como rodar localmente

Requer Node.js 24.

```bash
git clone https://github.com/Costa-dias/TurnoExtra.git
cd TurnoExtra
npm install
npm run dev

```

## Evolução do controle de recebimentos

- Recebimentos parciais com data, valor e saldo por serviço; registros antigos permanecem compatíveis.
- Cobranças de todos os períodos por empresa, ordenadas pelo vencimento.
- Avisos de conflito inclusive na virada do dia; o usuário decide se mantém a sobreposição.
- Exportação `.ics` com horários locais, sem sincronização automática e sem valores financeiros. Importações repetidas dependem do tratamento de duplicatas da agenda de destino.
- Prévia de restauração: o backup substitui os dados atuais somente após confirmação.

## Validação automatizada

`npm test` verifica recebimentos legados/parciais, conflitos noturnos, validação de backup, criptografia/senha incorreta e exportação ICS. Execute também `npm run typecheck`, `npm run lint` e `npm run build`.

## Transferência TurnoExtra → Dashboard

No TurnoExtra: Configurações → Transferir recebimentos para o Dashboard. No Dashboard: Importar recebimentos do TurnoExtra → selecione o JSON → confira a prévia, conta e categoria → confirme. Somente recebimentos registrados são copiados, com identificadores estáveis. Repetidos são ignorados; alterações exigem seleção explícita e preservam conta/categoria existentes. Exclusões não se propagam automaticamente. Registros antigos sem data de pagamento usam a data do serviço e aparecem sinalizados para conferência. O arquivo é local e não criptografado, limitado a 5 MB; valores em BRL sem conversão. Não há sincronização automática.
