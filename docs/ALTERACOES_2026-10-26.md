# Alterações e validação — 26/10/2026

## Mudanças

- `src/types.ts`: recebimentos opcionais por serviço; registros antigos sem o campo continuam legíveis.
- `src/lib/receivables.ts`: soma recebida, saldo pendente, vencimento e conflito de horários, inclusive atravessando a meia-noite.
- `ShiftModal`: edição de recebimentos com data/valor e proteção contra total acima do serviço.
- `App`: cobranças de todos os períodos por local, confirmação de conflitos ao criar/editar/repetir/aplicar modelos e exportação ICS.
- Relatório e CSV passam a incluir valores parciais; restauração mostra prévia e exige confirmação antes de substituir o conjunto.
- Dependência Supabase sem uso removida; versão do app atualizada.

## Verificação

`npm test`, `npm run typecheck`, `npm run lint` e `npm run build`. Cenários do teste estão em `tests/domain.test.mjs`. No navegador local: criar serviço de R$ 600, registrar R$ 200, salvar, recarregar e desbloquear preservou o registro e R$ 400 pendentes. Dados fictícios, sem tocar no armazenamento dos usuários.

## Limites

Atualização de código não migra dados entre navegadores. O backup novo preserva os recebimentos; versões antigas não devem ser usadas para editar/reexportar esses dados. Exportação ICS não sincroniza automaticamente com Google Agenda. Horários são locais, sem fuso fixado.
