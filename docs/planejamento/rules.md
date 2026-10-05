# Cupcake Gourmet — Regras de Desenvolvimento

Convenções do repositório. Aplicam-se a todo código, documentação e commits do projeto.

## 1. Idioma e Documentação
- Todo texto, comentário de negócio, documentação e mensagem de commit em **Português do Brasil (PT-BR)**.
- Nomes de código (variáveis, funções, arquivos) em **inglês**.

## 2. Estrutura de Pastas
- `src/modules` — módulos de domínio (catálogo, carrinho, pedidos, auth, admin), cada um com `*.controller.ts`, `*.service.ts`, `*.module.ts` e DTOs.
- `src/views` — templates Handlebars (View), com `layouts` e `partials`.
- `src/prisma` — `PrismaService` e acesso a dados (Model).
- `src/common` — guards, pipes, filtros e decorators compartilhados.
- `public` — assets estáticos (CSS gerado pelo Tailwind, imagens).
- `test` — testes e2e (Jest + Supertest).
- `prisma` — schema e migrations.

## 3. Convenções de Código
- **TypeScript** em modo estrito (`strict: true`).
- Formatação com **Prettier**; lint com **ESLint** (config do NestJS).
- Classes em `PascalCase` (`CatalogController`); arquivos seguem o sufixo do papel (`*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.dto.ts`).
- Funções e variáveis em `camelCase`; constantes em `UPPER_SNAKE_CASE`.
- Controllers apenas orquestram; a lógica de negócio fica nos services.
- Validar entradas com **DTOs** e `class-validator`/`ValidationPipe`.
- Nenhum segredo ou credencial no código; usar variáveis de ambiente (`.env`), com `.env.example` versionado.

## 4. Git e Commits
- Branch principal: `main`. Branches de trabalho: `feat/...`, `fix/...`, `docs/...`, `test/...`.
- Commits seguem **Conventional Commits**:
  ```
  feat: adiciona carrinho de compras
  fix: corrige cálculo do subtotal
  docs: atualiza regras de negócio
  test: cobre RN03 e RN04
  ```
- Commits pequenos e atômicos, sempre com o projeto compilando.

## 5. Testes
- Framework: **Jest** + Supertest.
- Testes unitários colocados (`*.spec.ts`) ao lado do código; testes e2e em `test`.
- Todo requisito funcional deve ter teste correspondente.
- As regras de negócio (`RN01`–`RN12`) devem ser cobertas por testes unitários.
- Fluxos principais (catálogo → carrinho → checkout) cobertos por teste de integração.

## 6. Fluxo de Trabalho
1. Criar branch a partir de `main`.
2. Implementar + escrever/atualizar testes.
3. Rodar `npm run lint`, `npm run test` e `npm run build` localmente.
4. Abrir Pull Request descrevendo a mudança e requisitos atendidos.
5. Fazer merge somente com build e testes verdes.

## 7. Definition of Done
Uma tarefa está concluída quando:
- [ ] O requisito/regra correspondente está implementado.
- [ ] Há testes cobrindo o comportamento.
- [ ] `lint`, `test` e `build` passam sem erros.
- [ ] A documentação (`project.md` / `requirements.md`) está atualizada, se aplicável.
- [ ] O código foi revisado e integrado à `main`.

## 8. Boas Práticas
- Não commitar `.env`, banco `*.db`, `node_modules` ou artefatos de build.
- Validar entradas do usuário no servidor, nunca apenas na interface.
- Mensagens de erro claras, sem expor detalhes internos.
- Manter dependências atualizadas e justificadas no `package.json`.
