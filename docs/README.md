# Documentação — Cupcake Gourmet (PIT II)

Índice da documentação do projeto **Cupcake Gourmet**, solução do *Projeto Integrador Transdisciplinar em Engenharia de Software II*. Esta pasta concentra, no Git, os documentos exigidos pela atividade.

> Repositório (código-fonte + documentação): <https://github.com/Felipe-Sarmento/projeto-transdisciplinar-2>

## Conteúdo versionado

| Documento | Situação | Descrição |
| --- | --- | --- |
| [`planejamento/project.md`](planejamento/project.md) | 1 | Visão geral, escopo, perfis, funcionalidades, stack e arquitetura. |
| [`planejamento/requirements.md`](planejamento/requirements.md) | 1 | Regras de negócio, requisitos funcionais/não funcionais e histórias de usuário. |
| [`planejamento/rules.md`](planejamento/rules.md) | 1 | Convenções de código, Git/commits, testes e *Definition of Done*. |
| [`planejamento/banco-de-dados.md`](planejamento/banco-de-dados.md) | 1 | DER, dicionário de dados, DDL do SQLite e dados de exemplo. |
| [`manual-de-uso.md`](manual-de-uso.md) | 2 | Como instalar, executar e operar o sistema (cliente e admin). |

## Situações-problema × entregáveis

Conforme orientado no material da disciplina (*Problema em Foco*), a atividade se divide em três desafios complementares:

### Situação 1 — Revisão e organização no Git

- Revisitar e melhorar a documentação de planejamento do PIT I.
- Manter documentação + código **num só lugar**, no Git.
- Projetar a estrutura do banco com um SGBD de fácil manutenção (SQLite).

**Entregáveis:** [`planejamento/`](planejamento/) (project, requirements, rules e banco de dados) + código-fonte no repositório.

### Situação 2 — Codificação

- Front-end, back-end e aplicação web, conforme o planejamento.
- Manual de uso e vídeo narrado (mínimo 5 minutos) demonstrando o funcionamento.
- Tudo concentrado no Git.

**Entregáveis:** código-fonte (`src/`, `test/`, `prisma`/`database`) + [`manual-de-uso.md`](manual-de-uso.md).
**Vídeos (externos):** solução em funcionamento — <https://youtu.be/m9sAPNI3Wao>.

### Situação 3 — Testes pelos colegas

- 5 colegas testam a solução (teste de aceitação).
- Entregar **PDF** com as 5 opiniões/testes e um **vídeo** das mudanças adotadas.

**Entregáveis (externos ao repositório):** PDF com as 5 avaliações e vídeo das correções.
**Vídeo das modificações:** <https://www.youtube.com/watch?v=Drkapd21rqg>.
**Evidências (antes × depois):** mantidas em `docs/RESULTADO/evidencias/` (fora do repositório de código).

## Estrutura de código (referência)

```
src/
├── controllers/   # C — requisições e renderização das views
├── models/        # M — services (regras de negócio)
├── views/         # V — templates Handlebars
├── database/      # schema Drizzle, DatabaseService e seed
├── common/        # guards, pipes, filters, decorators, dto, strategies
└── styles/        # entrada do Tailwind
```

Detalhes de arquitetura, rotas e comandos: [`manual-de-uso.md`](manual-de-uso.md) e [`README.md`](../README.md).
