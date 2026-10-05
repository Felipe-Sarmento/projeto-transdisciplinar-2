# Manual de Uso — Cupcake Gourmet

Manual de uso da aplicação **Cupcake Gourmet** (Situação 2 do PIT II). Descreve como instalar, executar e operar o sistema nos perfis de **cliente** e **administrador**.

## 1. Visão geral

O Cupcake Gourmet é uma loja virtual de cupcakes gourmet desenvolvida em **NestJS (MVC)**, com telas em **Handlebars + Tailwind CSS** e banco de dados **SQLite** via **Drizzle ORM**. Há dois perfis:

| Perfil | O que pode fazer |
| --- | --- |
| **Cliente** | Navegar no catálogo público, criar conta, montar o carrinho e finalizar o pedido (pagamento via PIX fictício). |
| **Administrador** | Gerenciar categorias, produtos e acompanhar/atualizar pedidos. |

## 2. Requisitos

- **Node.js 22+**
- **pnpm** (gerenciador de pacotes)
- Navegador web atualizado

## 3. Instalação e execução local

```bash
# 1. Instalar dependências
pnpm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env

# 3. Criar/atualizar o schema do banco (SQLite)
pnpm db:push

# 4. Popular dados de exemplo (admin + cliente + catálogo)
pnpm db:seed

# 5. Gerar o CSS do Tailwind
pnpm build:css

# 6. Subir a aplicação em modo desenvolvimento
pnpm start:dev
```

Acesse **http://localhost:3000**.

> Durante o desenvolvimento, rode `pnpm watch:css` em outro terminal para o Tailwind recompilar automaticamente ao alterar estilos.

### Variáveis de ambiente

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta do servidor | `3000` |
| `DATABASE_URL` | Caminho do arquivo SQLite | `./database/sqlite.db` |
| `JWT_SECRET` | Segredo usado para assinar o JWT | — (defina um valor forte) |

## 4. Credenciais de desenvolvimento (seed)

| Perfil | E-mail | Senha |
| --- | --- | --- |
| **Administrador** | `admin@cupcake.local` | `admin123` |
| **Cliente** | `cliente@cupcake.local` | `cliente123` |

> As credenciais são apenas para desenvolvimento/demonstração. Em produção, use um `JWT_SECRET` forte e remova/altere o seed.

## 5. Uso — perfil Cliente

1. **Catálogo** — abra `/`. A lista mostra apenas cupcakes **ativos**, com nome, imagem e preço. Use o filtro por categoria.
2. **Detalhe do produto** — clique em um cupcake para ver descrição completa e preço (`/produtos/:id`).
3. **Adicionar ao carrinho** — clique em **Adicionar**. O sistema valida o estoque e mostra um *toast* de confirmação.
4. **Carrinho** — em `/carrinho`, revise os itens, altere quantidades (1–99) ou remova itens. O subtotal é recalculado automaticamente.
5. **Criar conta / entrar** — para finalizar a compra é preciso estar autenticado como `CLIENTE`. Use **Criar conta** (`/cadastro`) ou **Entrar** (`/login`).
6. **Finalizar pedido** — já autenticado, informe o **nome** e o **endereço** de entrega e clique em **Confirmar pedido**. O pedido nasce com status **PENDENTE** e o estoque é decrementado.
7. **Pagamento (PIX fictício)** — a tela `/pedido/:id` exibe o PIX simulado. O pagamento é confirmado pelo administrador.
8. **Comprovante** — após a confirmação, o pedido aparece como **PAGAMENTO_REALIZADO** com nome, endereço, itens e total.

> **Pedido privado:** a tela do pedido (`/pedido/:id`) só é acessível pelo **dono do pedido** ou pelo **administrador**. Outros usuários recebem uma página 404.

## 6. Uso — perfil Administrador

1. **Login** — acesse `/login` com as credenciais de admin.
2. **Painel** — `/admin` reúne atalhos para Produtos, Categorias e Pedidos.
3. **Categorias** — em `/admin/categorias`, crie, edite e remova categorias (nome + slug).
4. **Produtos** — em `/admin/produtos`:
   - **Criar/editar** produto: nome, descrição, preço (> 0), imagem (URL), quantidade disponível, categoria e situação.
   - **Ativar/desativar:** produtos inativos somem do catálogo, mas permanecem nos pedidos já realizados.
5. **Pedidos** — em `/admin/pedidos`, visualize os pedidos e:
   - **Confirmar** o pagamento (`PENDENTE` → `PAGAMENTO_REALIZADO`); ou
   - **Cancelar** o pedido (`PENDENTE` → `CANCELADO`), devolvendo os itens ao estoque.

## 7. Rotas principais

**Público / cliente**

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/` | Catálogo (filtro `?categoria=slug`) |
| GET | `/produtos/:id` | Detalhe do produto |
| GET | `/carrinho` | Carrinho + checkout |
| POST | `/carrinho/itens` | Adicionar item |
| POST | `/carrinho/itens/:id` | Atualizar quantidade |
| POST | `/carrinho/itens/:id/remover` | Remover item |
| GET/POST | `/cadastro` | Criar conta de `CLIENTE` |
| POST | `/carrinho/confirmar` | Finalizar pedido (requer login `CLIENTE`) |
| GET | `/pedido/:id` | Status do pedido (apenas dono ou `ADMIN`) |

**Administração** (requer login `ADMIN`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET/POST | `/login`, `/logout` | Autenticação |
| GET | `/admin` | Painel |
| GET/POST | `/admin/produtos`, `/admin/produtos/:id` | CRUD de produtos |
| POST | `/admin/produtos/:id/ativar` | Ativar/desativar produto |
| GET/POST | `/admin/categorias`, `/admin/categorias/:id` | CRUD de categorias |
| GET | `/admin/pedidos` | Lista de pedidos |
| POST | `/admin/pedidos/:id/status` | Confirmar pagamento / cancelar |

## 8. Testes

```bash
pnpm test        # testes unitários (Jest)
pnpm test:e2e    # testes de integração HTTP (Jest + Supertest)
pnpm test:cov    # cobertura
```

## 9. Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `pnpm start:dev` | Servidor em modo watch |
| `pnpm build` / `pnpm start:prod` | Build e execução de produção |
| `pnpm lint` | ESLint |
| `pnpm build:css` / `pnpm watch:css` | Gera/observa o CSS do Tailwind |
| `pnpm db:push` | Sincroniza o schema com o SQLite |
| `pnpm db:seed` | Popula dados de exemplo |
| `pnpm db:studio` | Interface de inspeção do banco |
| `pnpm test` / `pnpm test:e2e` | Testes |

## 10. Deploy (Docker + Nginx/HTTPS)

```bash
# 1. Subir a stack na VPS (build da imagem + docker compose)
./vps/scripts/deploy.sh --app cupcake-gourmet --src . --port 18080

# 2. Publicar o domínio com HTTPS (proxy reverso + certificado)
./vps/scripts/setup-https.sh --domain app.exemplo.com --port 18080
```

Referências: `Dockerfile`, `docker-compose.yml` e `vps/README.md`. O `docker-compose.yml` publica o app em `127.0.0.1:18080` e o `deploy` faz o proxy reverso pelo Nginx com certificado Let's Encrypt.

## 11. Solução de problemas

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Página sem estilo | CSS do Tailwind não gerado | Rode `pnpm build:css`. |
| Erro de tabela inexistente | Schema não aplicado | Rode `pnpm db:push` e `pnpm db:seed`. |
| Login falha | Sem usuário no banco | Rode `pnpm db:seed` novamente. |
| Porta ocupada | Outro processo em `:3000` | Altere `PORT` no `.env`. |
| Sessão compartilhada entre abas | Cookie `httpOnly` é compartilhado | Use janelas anônimas separadas para testar cliente e admin. |
