# Versão do produto

**Versão 2.0.0 · atualizado em 30/10/2026**

## Marco atual

Evolução da agenda de plantões para gestão de serviços e recebimentos: pagamentos parciais, saldos, cobranças, conflitos na virada do dia e exportação revisada para o Dashboard.

Esta numeração consolida o estado atual após revisão do código e do histórico. Não é uma alegação de que todas as versões intermediárias tenham sido publicadas formalmente. A identificação por calendário adicionada anteriormente foi substituída por versão do produto e data separadas.

## Evidências no histórico

- `5436a2879`
- `87d5217d7`
- `d0d28042c`

Os marcos acima foram conferidos com os arquivos alterados e a implementação atual; quantidade de commits, versões de React/Vite e o campo genérico 0.0.0 não determinam a versão do produto.

## Política daqui em diante

- MAJOR: nova geração do produto, com reformulação substancial dos fluxos ou da arquitetura, ou incompatibilidades.
- MINOR: funcionalidades adicionais na mesma geração.
- PATCH: correções sem nova funcionalidade relevante.
- A versão do produto é independente do formato de backup, banco de dados e contrato da API. Este marco não modifica esses formatos.

Em cada publicação, manter alinhados `package.json`, o lockfile quando aplicável, a fonte usada pelo rodapé, este documento e o README. Atualizar a data somente quando houver publicação.

A fonte do rodapé é `src/release.ts`. Ela é incorporada ao build; uma aba antiga continua mostrando a versão do código carregado, sem consultar uma versão mais recente pela rede.
