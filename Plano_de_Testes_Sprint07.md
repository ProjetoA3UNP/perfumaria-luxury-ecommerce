# 📋 Plano de Testes — Sprint 07 · Essence E-commerce

**Projeto:** Essence — Loja Virtual de Perfumes  
**Sprint:** 07 — Qualidade e Estabilização  
**Data:** 16/06/2026  
**Responsável:** Matheus Monteiro  
**Ferramentas:** Jest (Unitários/Integração) · Cypress (E2E) · Supertest (HTTP)

---

## 1. Visão Geral

Este documento apresenta o **Plano de Testes** da Sprint 07 do projeto Essence, consolidando todos os casos de teste executados nas três camadas da pirâmide de testes:

| Camada | Framework | Qtd. Arquivos | Qtd. Casos |
|---|---|---|---|
| Testes Unitários (Backend) | Jest | 12 | 79 |
| Testes de Integração (Backend) | Jest + Supertest | 3 | 9 |
| Testes E2E (Frontend) | Cypress | 8 | 22 |
| **Total** | — | **23** | **110** |

---

## 2. Testes Unitários (Backend — Jest)

> Validam controllers e middlewares de forma isolada, com banco de dados **100% mockado** via `jest.mock()`.  
> **Comando:** `npx jest --testPathPattern=tests/unit`

---

### 2.1 Autenticação (`unit/auth.test.js`) — 16 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U01 | Registro com e-mail inválido | Retorna 400 com mensagem de formato inválido |
| U02 | Registro com senha curta (< 6 chars) | Retorna 400 |
| U03 | Registro com CPF < 11 dígitos | Retorna 400 |
| U04 | Registro com e-mail/CPF já existente | Retorna 409 — "E-mail ou CPF já cadastrado" |
| U05 | Registro com erro interno no banco | Retorna 500 |
| U06 | Registro com sucesso | Retorna 201 — `userId` retornado |
| U07 | Login com credenciais inexistentes | Retorna 401 — "Credenciais inválidas" |
| U08 | Login com senha incorreta | Retorna 401 — "Credenciais inválidas" |
| U09 | Login com erro no banco | Retorna 500 |
| U10 | Login com sucesso | Retorna 200 com `token` JWT e objeto `user` |
| U11 | Forgot password sem e-mail | Retorna 400 |
| U12 | Forgot password com erro no banco | Retorna 500 |
| U13 | Forgot password retorna 200 (segurança) | Retorna 200 independente de existir o e-mail |
| U14 | GetMe com usuário inexistente | Retorna 404 |
| U15 | GetMe com erro no banco | Retorna 500 |
| U16 | GetMe com sucesso | Retorna 200 com dados do usuário |

### 2.2 Atualização de Perfil (`unit/auth.test.js`) — 2 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U17 | UpdateMe com sucesso | Retorna 200 com perfil atualizado |
| U18 | UpdateMe com erro no banco | Retorna 500 |

### 2.3 Middleware de Autenticação (`unit/authMiddleware.test.js`)

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U19 | Requisição sem token | Retorna 401 — "Token não fornecido" |
| U20 | Token inválido ou expirado | Retorna 401 — "Token inválido" |
| U21 | Token válido | `next()` chamado, `req.user` populado |

### 2.4 Middleware de Admin (`unit/adminMiddleware.test.js`)

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U22 | Usuário CLIENTE tenta acessar rota admin | Retorna 403 — "Acesso negado" |
| U23 | Usuário ADMIN acessa rota protegida | `next()` chamado |

### 2.5 Carrinho (`unit/cart.test.js`) — 13 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U24 | Adicionar item — variação não encontrada | Retorna 404 |
| U25 | Adicionar item — quantidade excede estoque | Retorna 400 |
| U26 | Adicionar item — cria carrinho e insere | Retorna 200 |
| U27 | Adicionar item — soma quantidade se já existe | Retorna 200 — UPDATE executado |
| U28 | Adicionar item — soma excede estoque | Retorna 400 |
| U29 | Adicionar item — erro no banco | Retorna 500 |
| U30 | Atualizar quantidade — valor ≤ 0 | Retorna 400 |
| U31 | Atualizar quantidade — excede estoque | Retorna 400 |
| U32 | Atualizar quantidade — sucesso | Retorna 200 |
| U33 | Atualizar quantidade — erro no banco | Retorna 500 |
| U34 | Buscar carrinho — erro no banco | Retorna 500 |
| U35 | Buscar carrinho — retorna itens e total | Retorna 200 com cálculo correto |
| U36 | Remover item — erro no banco | Retorna 500 |
| U37 | Remover item — sucesso | Retorna 200 |

### 2.6 Cupom (`unit/coupon.test.js`) — 6 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U38 | Validar cupom — código não fornecido | Retorna 400 |
| U39 | Validar cupom — não encontrado | Retorna 404 |
| U40 | Validar cupom — inativo | Retorna 400 |
| U41 | Validar cupom — expirado | Retorna 400 |
| U42 | Validar cupom — válido | Retorna 200 com dados do desconto |
| U43 | Validar cupom — erro no banco | Retorna 500 |

### 2.7 Dashboard Admin (`unit/dashboard.test.js`) — 3 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U44 | GetMetrics — retorna todas as métricas | Retorna 200 com totais e faturamento |
| U45 | GetMetrics — erro no banco | Retorna 500 |
| U46 | GetMetrics — conversão numérica correta | Valores convertidos com `Number()` |

### 2.8 Favoritos (`unit/favorite.test.js`) — 7 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U47 | Adicionar favorito — sucesso | Retorna 201 |
| U48 | Adicionar favorito — já existe (ER_DUP_ENTRY) | Retorna 200 — idempotente |
| U49 | Adicionar favorito — erro no banco | Retorna 500 |
| U50 | Remover favorito — sucesso | Retorna 200 |
| U51 | Remover favorito — erro no banco | Retorna 500 |
| U52 | Listar favoritos — sucesso | Retorna 200 com array |
| U53 | Listar favoritos — erro no banco | Retorna 500 |

### 2.9 Pedidos (`unit/order.test.js`) — 18 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U54 | Histórico — retorna pedidos com itens | Retorna 200 agrupado por pedido |
| U55 | Histórico — sem pedidos | Retorna array vazio |
| U56 | Histórico — erro no banco | Retorna 500 |
| U57 | Admin: listar todos os pedidos | Retorna 200 |
| U58 | Admin: listar pedidos — erro no banco | Retorna 500 |
| U59 | Logs — sem filtro de venda_id | Retorna todos os logs |
| U60 | Logs — com filtro de venda_id | Retorna logs filtrados |
| U61 | Logs — erro no banco | Retorna 500 |
| U62 | Atualizar status — status inválido | Retorna 400 |
| U63 | Atualizar status — pedido não encontrado | Retorna 404 |
| U64 | Atualizar status — sucesso com log | Retorna 200 com mensagem de transição |
| U65 | Atualizar status — erro no banco | Retorna 500 |
| U66 | Payment Intent — carrinho não existe | Retorna 400 |
| U67 | Payment Intent — carrinho vazio | Retorna 400 |
| U68 | Payment Intent — criado com sucesso | Retorna 200 com `clientSecret` |
| U69 | Payment Intent — exceção interna | Retorna 500 |
| U70 | Checkout — carrinho vazio | Retorna erro |
| U71 | Checkout — estoque insuficiente | Retorna erro |
| U72 | Checkout PIX sem cupom — sucesso | Processa e retorna número do pedido |
| U73 | Checkout com cupom percentual | Aplica desconto corretamente |
| U74 | Checkout com endereço padrão | Busca endereço quando não informado |
| U75 | Checkout — exceção não mapeada | Retorna 500 |

### 2.10 Status de Pedido (`unit/orderStatus.test.js`) — 6 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U76 | Status inválido ou não fornecido | Retorna 400 |
| U77 | Pedido não encontrado | Retorna 404 |
| U78 | Status já é igual ao novo | Retorna 200 (sem alteração) |
| U79 | Bloqueio — status ENTREGUE é final | Retorna 400 |
| U80 | Bloqueio — status CANCELADO é final | Retorna 400 |
| U81 | Transição PAGO → ENVIADO com log | Retorna 200 com auditoria registrada |

### 2.11 Produto (`unit/product.test.js`) — 14 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U82 | Seed Dependencies — sucesso | Retorna 200 |
| U83 | Seed Dependencies — falha | Retorna 500 |
| U84 | Menu Filters — retorna categorias/marcas/famílias | Retorna 200 com arrays |
| U85 | Menu Filters — erro no banco | Retorna 500 |
| U86 | Listar produtos ativos | Retorna 200 |
| U87 | Listar todos (incluindo inativos) com `all=true` | Inclui inativos |
| U88 | Listar produtos — erro no banco | Retorna 500 |
| U89 | Buscar produto por ID — com variações | Retorna produto com array `variacoes` |
| U90 | Buscar produto inativo por ID com `all=true` | Retorna o produto |
| U91 | Buscar produto — não encontrado | Retorna 404 |
| U92 | Buscar produto — erro no banco | Retorna 500 |
| U93 | Criar produto com notas olfativas | Retorna 201 |
| U94 | Criar produto sem notas olfativas | Retorna 201 |
| U95 | Criar produto — rollback em falha | Retorna 500 |

### 2.12 Avaliações (`unit/review.test.js`) — 6 casos

| # | Caso de Teste | Resultado Esperado |
|---|---|---|
| U96 | Criar avaliação — dados inválidos | Retorna 400 |
| U97 | Criar avaliação — não comprou o produto | Retorna 403 |
| U98 | Criar avaliação — sucesso | Retorna 201 |
| U99 | Criar avaliação — erro no banco | Retorna 500 |
| U100 | canReview — nunca comprou | Retorna `podeAvaliar: false` |
| U101 | canReview — comprou e avaliou | Retorna `podeAvaliar: true, jaAvaliou: true` |

---

## 3. Testes de Integração (Backend — Jest + Supertest)

> Validam o fluxo completo **Rota → Middleware → Controller**, simulando requisições HTTP reais contra o `app.js` com banco mockado.  
> **Comando:** `npx jest --testPathPattern=tests/integration`

---

### 3.1 Integração de Cupons (`couponIntegration.test.js`) — 2 casos

| # | Caso de Teste | Método/Rota | Resultado Esperado |
|---|---|---|---|
| I01 | Validar cupom sem token JWT | `POST /api/coupons/validate` | 401 — Não autorizado |
| I02 | Validar cupom com token e código válido | `POST /api/coupons/validate` | 200 — `desconto_percentual: 10` |

### 3.2 Integração de Pedidos — Admin (`orderIntegration.test.js`) — 3 casos

| # | Caso de Teste | Método/Rota | Resultado Esperado |
|---|---|---|---|
| I03 | Atualizar status sem token | `PATCH /api/orders/admin/:id/status` | 401 |
| I04 | Atualizar status com token CLIENTE | `PATCH /api/orders/admin/:id/status` | 403 — Acesso negado |
| I05 | Atualizar status com token ADMIN | `PATCH /api/orders/admin/:id/status` | 200 — "PAGO → ENVIADO" |

### 3.3 Integração de Avaliações (`reviewIntegration.test.js`) — 4 casos

| # | Caso de Teste | Método/Rota | Resultado Esperado |
|---|---|---|---|
| I06 | Buscar avaliações sem token (público) | `GET /api/reviews/:id` | 200 — Lista com média e total |
| I07 | Criar avaliação sem token | `POST /api/reviews` | 401 — "Token não fornecido" |
| I08 | Criar avaliação sem ter comprado | `POST /api/reviews` | 403 — "Só pode avaliar produtos que já comprou" |
| I09 | Criar avaliação com compra confirmada | `POST /api/reviews` | 201 — "Avaliação registrada com sucesso" |

---

## 4. Testes E2E (Frontend — Cypress)

> Simulam interações reais de um usuário no navegador Chrome, com respostas da API interceptadas via `cy.intercept()` para isolamento total do backend.  
> **Comando:** `npx cypress open` ou `npx cypress run --headless`

---

### 4.1 Autenticação Básica (`auth.cy.js`) — 2 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E01 | Carregar página inicial | `/` | Texto "Aproveite" visível |
| E02 | Login com credenciais inválidas | `/login` | Permanece em `/login` |

### 4.2 Autenticação Avançada (`auth_advanced.cy.js`) — 2 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E03 | Login mockado + Logout completo | `/login` → `/` | Ícone "Meu Perfil" aparece, logout limpa `localStorage`, ícone "Fazer Login" reaparece |
| E04 | Guarda de rota (interceptor 401) | `/perfil` | Redireciona para `/login`, exibe popup "Sua sessão expirou" |

### 4.3 Cadastro (`register.cy.js`) — 2 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E05 | Botão desabilitado com CPF incompleto | `/cadastro` | `button[type=submit]` fica `disabled` |
| E06 | Erro de e-mail duplicado (mock 400) | `/cadastro` | Exibe popup "Falha no Cadastro" com mensagem do backend |

### 4.4 Navegação (`navigation.cy.js`) — 2 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E07 | Navegar pelo menu horizontal | `/` | URL muda para `/categoria/corpo-e-banho` |
| E08 | Buscar perfume na barra de pesquisa | `/` | URL contém `/busca?q=Sauvage` |

### 4.5 Produto Isolado (`product.cy.js`) — 1 caso

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E09 | Renderizar detalhes de produto mockado | `/produto/9999` | Nome, marca, descrição, preço e botão SACOLA visíveis |

### 4.6 Carrinho Básico (`cart.cy.js`) — 2 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E10 | Vitrine carrega na Home | `/` | Texto "Aproveite" presente |
| E11 | Sacola bloqueia acesso sem login (401) | `/sacola` | Redireciona para `/login` |

### 4.7 Exploração da Loja (`exploration.cy.js`) — 5 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E12 | Navegar por Família Olfativa | `/categoria/amadeirado` | Título "Amadeirado" visível |
| E13 | Paginação "Carregar Mais" (24 produtos) | `/categoria/perfumes` | 12 cards → clique → 24 cards, botão some |
| E14 | Adicionar aos Favoritos (sem login) | `/` | Mensagem "Faça login para favoritar" no card |
| E15 | Quiz do Perfume Ideal (5 passos) | `/quiz` | Resultado "Perfumes Recomendados para Você", botão "Refazer Quiz" funcional |
| E16 | Pesquisa vazia retorna feedback | `/busca` | Mensagem "Nenhum perfume encontrado" |

### 4.8 Checkout e Sacola (`checkout.cy.js`) — 3 casos

| # | Caso de Teste | Página | Resultado Esperado |
|---|---|---|---|
| E17 | Adicionar ao carrinho + Badge + Subtotal | `/produto/999` → `/sacola` | Badge `.cart-badge` aparece, nome do perfume visível na Sacola, total atualiza ao clicar "+" |
| E18 | Calcular frete por CEP + validar formulário | `/endereco` | Frete "R$ 15,90" para SP exibido, campos preenchidos habilitam o botão CONTINUAR |
| E19 | Pagamento PIX + Conclusão do Pedido | `/pagamento` → `/pedido-concluido` | Botão PIX funciona, pedido finalizado com nº `#987654321` exibido na tela de conclusão |

---

## 5. Estratégia de Mocking

### Backend (Jest)
- **`jest.mock('../../src/config/database')`** — Substitui todas as queries SQL por `jest.fn()`, eliminando dependência de MySQL real.
- **`jest.mock('bcryptjs')` / `jest.mock('jsonwebtoken')`** — Isola criptografia e autenticação.

### Frontend (Cypress)
- **`cy.intercept()`** — Intercepta chamadas HTTP do Axios e retorna respostas controladas (status + body).
- **`onBeforeLoad(win)`** — Injeta `localStorage` com dados de sessão fake antes da renderização do React.
- **`Cypress.on('uncaught:exception')`** — Suprime erros de scripts de terceiros (Stripe SDK) que não são bugs da aplicação.

---

## 6. Cobertura por Módulo

| Módulo | Unitário | Integração | E2E | Total |
|---|---|---|---|---|
| Autenticação | 18 | — | 4 | **22** |
| Cadastro | — | — | 2 | **2** |
| Produto | 14 | — | 1 | **15** |
| Carrinho | 13 | — | 3 | **16** |
| Favoritos | 7 | — | 1 | **8** |
| Cupom | 6 | 2 | 1 | **9** |
| Pedidos | 18 | 3 | 1 | **22** |
| Avaliações | 6 | 4 | — | **10** |
| Dashboard | 3 | — | — | **3** |
| Navegação/Busca | — | — | 4 | **4** |
| Quiz | — | — | 1 | **1** |
| Middleware (Auth/Admin) | 4 | — | — | **4** |

---

## 7. Critérios de Aceitação

| Critério | Meta | Status |
|---|---|---|
| Todos os testes unitários passam | 79/79 | ✅ Aprovado |
| Todos os testes de integração passam | 9/9 | ✅ Aprovado |
| Todos os testes E2E passam | 22/22 | ✅ Aprovado |
| Cobertura mínima de branches nos controllers | ≥ 80% | ✅ Aprovado |
| Nenhum teste depende de banco real | 100% mockado | ✅ Aprovado |
| Tempo de execução total < 60s | ~45s | ✅ Aprovado |

---

## 8. Como Executar

```bash
# ===== Backend: Testes Unitários + Integração =====
cd backend
npx jest --verbose

# ===== Frontend: Testes E2E (modo interativo) =====
cd frontend
npm run cypress:open

# ===== Frontend: Testes E2E (modo headless/CI) =====
cd frontend
npx cypress run --headless --browser chrome
```

---

## 9. Conclusão

A Sprint 07 consolida a qualidade do Essence com uma suíte de **110 casos de teste** distribuídos nas três camadas da pirâmide de testes. Os testes unitários garantem a correção lógica dos controllers. Os testes de integração validam o pipeline completo HTTP → Middleware → Controller. Os testes E2E asseguram que o usuário final consegue navegar, explorar, adicionar ao carrinho e finalizar compras sem falhas visuais ou funcionais.

> **Nota:** Todos os testes são executáveis sem conexão com banco de dados real, garantindo reprodutibilidade em qualquer ambiente (local, CI/CD, staging).
