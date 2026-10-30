# Manutenção — 30/10/2026

## TurnoExtra — 2.0.0 → 2.0.1

O plugin de geração de PWA dependia de Workbox → plugin-node-resolve → deepmerge, sem correção publicada para o advisory. Essa cadeia foi removida, sem usar downgrade automático nem ocultar o alerta. O build agora gera `sw.js` com a lista dos próprios arquivos estáticos e um identificador derivado do conteúdo. O manifesto mantém nome, ícones e escopo. Navegações tentam a rede e usam a página armazenada quando a rede falha; recursos estáticos utilizam o cache. Somente caches estáticos próprios e o cache legado do mesmo escopo são limpos. O mecanismo não acessa IndexedDB, PIN, backups, recebimentos ou dados de serviços. Uma instalação incompleta não substitui o worker anterior. Foram adicionados quatro testes para esse comportamento.

### Bibliotecas diretas alteradas

| Biblioteca | Antes | Depois | Para que serve |
|---|---|---|---|
| `@types/node` | não incluído | 24.19.2 | Tipagem para desenvolvimento; não acrescenta recurso ao site. |
| `@types/react` | 18.3.11 | 18.3.31 | Tipagem para desenvolvimento; não acrescenta recurso ao site. |
| `@types/react-dom` | 18.3.0 | 18.3.7 | Tipagem para desenvolvimento; não acrescenta recurso ao site. |
| `typescript-eslint` | 8.72.0 | 8.72.1 | Verifica código TypeScript e regras de qualidade. |

Dependências diretas removidas: `vite-plugin-pwa`.

### Verificações

Testes de domínio, quatro testes do PWA, TypeScript da aplicação e do build, lint e build.

Auditoria das dependências JavaScript: nenhuma vulnerabilidade conhecida reportada após as mudanças. Isso não substitui revisão de código nem significa risco zero.
