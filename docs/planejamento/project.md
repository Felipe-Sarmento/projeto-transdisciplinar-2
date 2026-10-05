# Cupcake Gourmet — Definições do Projeto e Stack

## 1. Visão Geral

Aplicação web para uma **loja virtual de cupcakes gourmet**, evolução do planejamento realizado no Projeto Integrador Transdisciplinar em Engenharia de Software I (PIT I). O sistema permite que clientes naveguem por um catálogo de cupcakes, montem um carrinho e finalizem pedidos; e que administradores gerenciem o catálogo e acompanhem os pedidos.

## 2. Objetivo

Transformar a documentação inicial (histórias de usuário, backlog e critérios de aceitação) em uma **solução de software funcional**, aplicando levantamento de requisitos ágeis, modelagem de dados, padrão MVC e testes de software.

## 3. Escopo

### 3.1 Dentro do escopo
- Catálogo de cupcakes (listagem e detalhe do produto)
- Carrinho de compras
- Finalização de pedido (checkout simplificado)
- Cadastro/login de cliente
- Painel administrativo para gerenciar catálogo e pedidos

### 3.2 Fora do escopo
- Integração com gateway de pagamento real
- Cálculo de frete / rastreamento de entrega
- Notificações por e-mail/SMS
- Aplicativo mobile nativo

## 4. Perfis de Usuário

| Perfil | Descrição | Principais ações |
| --- | --- | --- |
| **Cliente** | Usuário final que compra cupcakes | Navegar catálogo, gerenciar carrinho, finalizar pedido, ver histórico |
| **Admin** | Responsável pela loja | CRUD de produtos/categorias, visualizar e atualizar status de pedidos |

## 5. Funcionalidades

1. **Catálogo** — listagem de cupcakes com nome, descrição, preço e imagem; filtro por categoria.
2. **Carrinho** — adicionar, alterar quantidade e remover itens; cálculo de subtotal.
3. **Pedido** — checkout com dados de entrega; registro do pedido e dos itens.
4. **Autenticação** — cadastro e login de cliente.
5. **Administração** — gestão de produtos/categorias e acompanhamento de pedidos.

## 6. Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| Framework | **NestJS** (modo MVC) |
| Linguagem | **TypeScript** |
| Banco de dados | **SQLite** |
| ORM | **Prisma** |
| Views (templates) | **Handlebars** (`hbs`) |
| Estilização | **Tailwind CSS** |
| Autenticação | **JWT** (Passport) em cookie `httpOnly` |
| Testes | **Jest** + Supertest |
| Gerenciador de pacotes | npm |
| Controle de versão | Git / GitHub |

## 7. Arquitetura (MVC no NestJS)

- **Model** — entidades de domínio e camada de acesso a dados via `PrismaService` (`src/prisma`).
- **View** — templates Handlebars (`.hbs`) em `src/views`, renderizados pelos controllers com `@Render()`.
- **Controller** — controllers Nest que recebem a requisição, delegam aos services e retornam a view correspondente.
- **Service** — regras de negócio (`RN01`–`RN12`), desacopladas da camada de apresentação.
- **Módulos** — um módulo Nest por domínio (catálogo, carrinho, pedidos, auth, admin).

> **Autenticação:** o JWT é emitido no login e trafega em cookie `httpOnly`; `JwtAuthGuard` e guards de perfil (`ADMIN`/`CLIENTE`) protegem as rotas MVC.

## 8. Estrutura de Pastas (proposta)

```
cupcake-gourmet/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts                 # bootstrap, view engine (hbs) e assets estáticos
│   ├── app.module.ts
│   ├── modules/
│   │   ├── catalog/            # produtos e categorias
│   │   │   ├── catalog.controller.ts
│   │   │   ├── catalog.service.ts
│   │   │   └── catalog.module.ts
│   │   ├── cart/               # carrinho
│   │   ├── orders/             # pedidos
│   │   ├── auth/               # autenticação (JWT/Passport)
│   │   └── admin/              # gestão de produtos e pedidos
│   ├── common/                 # guards, pipes, filtros e decorators
│   ├── prisma/                 # PrismaService (Model)
│   └── views/                  # templates Handlebars (View)
│       ├── layouts/
│       ├── partials/
│       ├── catalog/
│       ├── cart/
│       ├── orders/
│       ├── auth/
│       └── admin/
├── public/                     # assets estáticos (CSS gerado, imagens)
├── test/                       # testes e2e (Jest + Supertest)
├── tailwind.config.js
├── .env.example
├── project.md
├── requirements.md
└── rules.md
```

## 9. Entregáveis do PIT II

- Código-fonte (front-end + back-end) versionado no Git
- Documentação do projeto (`project.md`, `requirements.md`, `rules.md`)
- Projeto físico do banco de dados e dicionário de dados
- Testes (verificação e validação) documentados
- PDF com 5 avaliações de terceiros + vídeo com as mudanças adotadas
- Vídeo demonstrativo da solução em funcionamento (até 5 minutos)
