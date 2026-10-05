# Cupcake Gourmet — Regras de Negócio e Especificação

Complementa o [project.md](project.md). Aqui ficam as regras de negócio, requisitos e a modelagem inicial do sistema.

## 1. Regras de Negócio

| Código | Regra |
| --- | --- |
| **RN01** | Um produto só pode ser exibido no catálogo se estiver com status **ativo**. |
| **RN02** | Todo produto deve pertencer a **uma** categoria e ter preço maior que zero. |
| **RN03** | A quantidade de um item no carrinho deve ser um inteiro entre 1 e 99. |
| **RN04** | Adicionar um produto já existente no carrinho aumenta a quantidade, sem duplicar o item. |
| **RN05** | O subtotal do carrinho é a soma de `preço × quantidade` de cada item. |
| **RN06** | Um pedido só pode ser finalizado com carrinho não vazio e com **nome e endereço** de entrega informados. O checkout é feito como **convidado** (não exige login). |
| **RN07** | O valor total do pedido é congelado no momento do checkout (não muda se o preço do produto mudar depois). |
| **RN08** | Todo pedido inicia com status **`PENDENTE`**. |
| **RN09** | Os status possíveis do pedido são: `PENDENTE` (aguardando pagamento), `PAGAMENTO_REALIZADO` e `CANCELADO`. O admin pode apenas **confirmar o pagamento** ou **cancelar** o pedido. |
| **RN10** | Somente o perfil **Admin** pode criar, editar, ativar/desativar produtos e alterar status de pedidos. |
| **RN11** | Um cliente só pode visualizar os **próprios** pedidos. |
| **RN12** | Produtos inativos permanecem nos pedidos já realizados, mas não podem ser adicionados a novos carrinhos. |
| **RN13** | Um produto com quantidade disponível (`availableQuantity`) igual a zero é considerado **esgotado** e não pode ser adicionado ao carrinho. |
| **RN14** | A quantidade de um item no carrinho não pode exceder a quantidade disponível do produto (além do limite 1–99 da RN03). |
| **RN15** | Ao finalizar o pedido (checkout), a quantidade disponível (`availableQuantity`) de cada produto é decrementada conforme os itens do pedido. |
| **RN16** | O pedido nasce `PENDENTE` (aguardando pagamento). O cliente efetua o pagamento via PIX (fictício); o admin confirma marcando `PAGAMENTO_REALIZADO`, e só então o cliente visualiza o comprovante. |
| **RN17** | Ao cancelar um pedido, a quantidade de cada item é devolvida ao estoque (`availableQuantity`). |

## 2. Requisitos Funcionais

| Código | Requisito |
| --- | --- |
| **RF01** | O cliente deve poder listar e filtrar cupcakes por categoria. |
| **RF02** | O cliente deve poder ver os detalhes de um produto. |
| **RF03** | O cliente deve poder adicionar, alterar a quantidade e remover itens do carrinho. |
| **RF04** | O cliente deve poder se cadastrar e autenticar. |
| **RF05** | O cliente deve poder finalizar um pedido com dados de entrega (nome e endereço), como convidado. |
| **RF06** | ~~O cliente deve poder consultar seu histórico de pedidos.~~ (Fora do escopo: não há conta de cliente.) |
| **RF07** | O admin deve poder gerenciar (CRUD) produtos e categorias. |
| **RF08** | O admin deve poder listar pedidos e atualizar seus status. |

## 3. Requisitos Não Funcionais

| Código | Requisito |
| --- | --- |
| **RNF01** | Interface responsiva (desktop e mobile). |
| **RNF02** | Tempo de resposta das páginas de catálogo abaixo de 2 segundos em ambiente local. |
| **RNF03** | Senhas armazenadas com hash; nenhum dado sensível versionado. |
| **RNF04** | Código em TypeScript com tipagem consistente e lint sem erros. |
| **RNF05** | Cobertura de testes nas regras de negócio (RN01–RN12). |
| **RNF06** | Acessibilidade básica (contraste, navegação por teclado e textos alternativos). |

## 4. Histórias de Usuário

> Padrão: **Como** [persona], **quero** [ação], **para que** [benefício].

### HU01 — Navegar no catálogo
**Como** cliente, **quero** ver a lista de cupcakes com nome, foto e preço, **para que** eu escolha o que comprar.

- **Critérios de aceitação:**
  - [ ] Apenas produtos ativos aparecem (RN01).
  - [ ] É possível filtrar por categoria.
  - [ ] Cada item exibe nome, imagem e preço.

### HU02 — Ver detalhe do produto
**Como** cliente, **quero** abrir a página de um cupcake, **para que** eu veja sua descrição completa e preço.

- **Critérios de aceitação:**
  - [ ] Descrição, preço e imagem são exibidos.
  - [ ] Há botão "Adicionar ao carrinho".

### HU03 — Gerenciar carrinho
**Como** cliente, **quero** adicionar/remover itens e ajustar quantidades, **para que** eu monte meu pedido.

- **Critérios de aceitação:**
  - [ ] Quantidade entre 1 e 99 (RN03).
  - [ ] Adicionar item repetido soma a quantidade (RN04).
  - [ ] Subtotal recalculado a cada alteração (RN05).

### HU04 — Finalizar pedido
**Como** cliente autenticado, **quero** finalizar meu pedido com endereço de entrega, **para que** eu receba os cupcakes.

- **Critérios de aceitação:**
  - [ ] Bloqueado se não autenticado ou carrinho vazio (RN06).
  - [ ] Total congelado no checkout (RN07).
  - [ ] Pedido criado com status `PENDENTE` (RN08).

### HU05 — Gerenciar produtos (Admin)
**Como** admin, **quero** criar, editar e ativar/desativar produtos e categorias, **para que** o catálogo esteja sempre atualizado.

- **Critérios de aceitação:**
  - [ ] Acesso restrito ao perfil Admin (RN10).
  - [ ] Produto exige categoria e preço > 0 (RN02).

### HU06 — Gerenciar pedidos (Admin)
**Como** admin, **quero** listar pedidos e atualizar seus status, **para que** eu acompanhe a operação da loja.

- **Critérios de aceitação:**
  - [ ] Status limitado aos valores definidos (RN09).
  - [ ] Alteração reflete na visão do cliente.

## 5. Modelo de Dados (inicial)

| Entidade | Campos principais |
| --- | --- |
| **User** | `id`, `name`, `email` (único), `passwordHash`, `role` (`CLIENTE` \| `ADMIN`), `createdAt` |
| **Category** | `id`, `name` (único), `slug` |
| **Product** | `id`, `name`, `description`, `price`, `imageUrl`, `active`, `availableQuantity` (estoque, admin-only), `categoryId` → Category |
| **Order** | `id`, `userId` → User (**opcional**), `customerName`, `status`, `total`, `deliveryAddress`, `createdAt` |
| **OrderItem** | `id`, `orderId` → Order, `productId` → Product, `quantity`, `unitPrice` |

### Relacionamentos
- `Category 1 — N Product`
- `User 1 — N Order`
- `Order 1 — N OrderItem`
- `Product 1 — N OrderItem`

## 6. Mapa de Telas

| Rota | Tela | Perfil |
| --- | --- | --- |
| `/` | Catálogo de cupcakes | Público |
| `/produtos/[id]` | Detalhe do produto | Público |
| `/carrinho` | Carrinho de compras | Público |
| `/checkout` | Finalização do pedido | Cliente |
| `/login` · `/cadastro` | Autenticação | Público |
| `/meus-pedidos` | Histórico do cliente | Cliente |
| `/admin/produtos` | CRUD de produtos | Admin |
| `/admin/pedidos` | Gestão de pedidos | Admin |
