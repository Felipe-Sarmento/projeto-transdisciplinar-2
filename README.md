# 🧁 Cupcake Gourmet

Loja virtual de cupcakes gourmet — solução do **Projeto Integrador Transdisciplinar em Engenharia de Software II**. Clientes navegam pelo catálogo, montam o carrinho e finalizam o pedido como convidados (pagamento via PIX fictício); administradores gerenciam catálogo e pedidos.

## 📚 Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | NestJS (modo MVC) |
| Linguagem | TypeScript (estrito) |
| Views | Handlebars (`express-handlebars`) |
| Estilização | Tailwind CSS v4 |
| Banco | SQLite (`better-sqlite3`) |
| ORM | Drizzle ORM + drizzle-kit |
| Autenticação | JWT (Passport) em cookie `httpOnly` |
| Testes | Jest + Supertest |

## ✨ Funcionalidades

- **Catálogo** público: listar, filtrar por categoria e ver detalhe (só produtos ativos).
- **Carrinho** em cookie: adicionar, alterar quantidade, remover e subtotal (estoque enforced).
- **Checkout como convidado**: nome + endereço → pedido `PENDENTE` + tela de pagamento PIX (fictício).
- **Baixa de estoque** no checkout e **restauração** ao cancelar.
- **Confirmação de pagamento** pelo admin → cliente vê o comprovante.
- **Admin**: login (JWT), CRUD de produtos/categorias e gestão de pedidos (confirmar/cancelar).
- Página 404 e acessibilidade básica.

## 🚀 Como rodar

Pré-requisitos: **Node.js 22+** e **pnpm**.

```bash
pnpm install          # dependências
cp .env.example .env  # variáveis de ambiente
pnpm db:push          # cria/atualiza o schema no SQLite
pnpm db:seed          # dados de exemplo (admin + categorias + cupcakes)
pnpm build:css        # gera o CSS do Tailwind

pnpm start:dev        # roda em http://localhost:3000 (watch)
```

> Durante o desenvolvimento, rode `pnpm watch:css` em outro terminal para o Tailwind recompilar junto.

### Credenciais de desenvolvimento (seed)

- **E-mail:** `admin@cupcake.local`
- **Senha:** `admin123`

### Variáveis de ambiente (`.env.example`)

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `NODE_ENV` | Ambiente | `development` |
| `PORT` | Porta do servidor | `3000` |
| `DATABASE_URL` | Caminho do arquivo SQLite | `./database/sqlite.db` |
| `JWT_SECRET` | Segredo do JWT | fallback de dev |

## 🗺️ Rotas

**Público / cliente**

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/` | Catálogo (filtro `?categoria=slug`) |
| GET | `/produtos/:id` | Detalhe do produto |
| GET | `/carrinho` | Carrinho + formulário de checkout |
| POST | `/carrinho/itens` | Adicionar item |
| POST | `/carrinho/itens/:id` | Atualizar quantidade |
| POST | `/carrinho/itens/:id/remover` | Remover item |
| POST | `/carrinho/confirmar` | Finalizar pedido (convidado) |
| GET | `/pedido/:id` | Status do pedido (PIX / comprovante / cancelado) |

**Administração** (requer login `ADMIN`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET/POST | `/login`, `/logout` | Autenticação |
| GET | `/admin` | Painel |
| GET/POST | `/admin/produtos`, `/admin/produtos/:id` | CRUD de produtos |
| POST | `/admin/produtos/:id/ativar` | Ativar/desativar |
| GET/POST | `/admin/categorias`, `/admin/categorias/:id` | CRUD de categorias |
| GET | `/admin/pedidos` | Lista de pedidos |
| POST | `/admin/pedidos/:id/status` | Confirmar pagamento / cancelar |

## 🏗️ Arquitetura (MVC)

```
src/
├── controllers/   # C — recebem requisições e renderizam views
├── models/        # M — services (regras de negócio) e acesso a dados
├── views/         # V — templates Handlebars (layouts/partials)
├── database/      # schema Drizzle, DatabaseService e seed
├── common/        # guards, pipes, filters, decorators, dto, strategies
├── styles/        # entrada do Tailwind
├── app.module.ts  # módulo único
├── app.setup.ts   # configurações da app (view engine, cookies, filtros)
└── main.ts        # bootstrap
```

- **Model**: `DatabaseService` expõe o Drizzle; services em `src/models`.
- **View**: `src/views` (layout `main.hbs` + partials).
- **Controller**: `src/controllers` (MVC server-side, `@Render`).
- **Auth**: JWT em cookie `httpOnly`; guards por perfil (`ADMIN`).

## 🧪 Testes

```bash
pnpm test       # unitários (Jest)
pnpm test:e2e   # HTTP (Jest + Supertest)
```

## 🛠️ Scripts

| Script | Descrição |
| --- | --- |
| `pnpm start:dev` | Servidor em watch |
| `pnpm build` / `pnpm start:prod` | Build e execução de produção |
| `pnpm lint` | ESLint |
| `pnpm build:css` / `pnpm watch:css` | Gera/observa o CSS |
| `pnpm db:push` | Sincroniza o schema com o SQLite |
| `pnpm db:seed` | Popula dados de exemplo |
| `pnpm db:studio` | UI de inspeção do banco |
| `pnpm test` / `pnpm test:e2e` | Testes |

## 📌 Observações

- **Sem login de cliente**: o checkout é feito como convidado (nome + endereço).
- **PIX fictício**: sem integração real; apenas exemplificação.
- **Carrinho em cookie** (`httpOnly`), revalidado contra o banco a cada request.
- Documentação de planejamento em `Projeto-Integrador-Disciplinar/software/` (`project.md`, `requirements.md`, `rules.md`).
