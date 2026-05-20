# Roteiro de Apresentação AV3 (Backend)

Este guia foi desenhado para você seguir na ordem **exata** durante a apresentação com o professor, usando o **LiteClient** (ou Postman). Deixe todos os endpoints já salvos nas abas do cliente para agilizar!

> [!WARNING]
> A partir do passo 6, os endpoints exigem o **Token JWT**. Lembre-se de colar o Token gerado no Passo 2 na aba `Headers` do LiteClient (Chave: `Authorization`, Valor: `Bearer SEU_TOKEN_AQUI`).

---

### Passo 1: Cadastro do Usuário
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/auth/register`
- **Body (JSON):**
```json
{
  "nome": "Diogo Ferreira",
  "email": "diogo.ferreira@unp.br",
  "cpf": "12345678900",
  "data_nascimento": "1988-08-15",
  "senha": "senhaSeguraBanca"
}
```

### Passo 2: Login
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "diogo.ferreira@unp.br",
  "senha": "senhaSeguraBanca"
}
```

### Passo 3: Catálogo Geral
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/products`

### Passo 4: Detalhe de um Perfume Específico
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/products/1`

### Passo 5: Criando um Novo Perfume
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/products`
- **Body (JSON):**
```json
{
  "nome": "Tom Ford Ombré Leather",
  "marca_id": 2,
  "categoria_id": 2,
  "familia_olfativa_id": 2,
  "preco": 1250.00,
  "estoque_qtd": 15,
  "descricao": "Uma fragrância tátil, sensual e envolvente, que invoca a textura do couro negro.",
  "ingredientes": "Couro, Especiarias",
  "ocasiao_ideal": "Noites elegantes",
  "topo": "Cardamomo",
  "coracao": "Jasmim Sambac, Couro Negro",
  "base": "Patchouli, Musgo Branco"
}
```

### Passo 6: Carrinho Vazio
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/cart`

### Passo 7: Adicionar Perfume ao Carrinho
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/cart/add`
- **Body (JSON):**
```json
{
  "variacao_id": 1,
  "quantidade": 3
}
```

### Passo 8: Carrinho Cheio
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/cart`

### Passo 9: Histórico de Pedidos Vazio
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/orders`

### Passo 10: Cadastrar Endereço
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/addresses`
- **Body (JSON):**
```json
{
  "titulo": "Campus Salgado Filho",
  "cep": "59056000",
  "bairro": "Lagoa Nova",
  "rua": "Av. Senador Salgado Filho",
  "numero": "1610",
  "principal": true
}
```

### Passo 11: Iniciar Integração com a Stripe
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/orders/create-payment-intent`
- **Body:** `{}`

### Passo 12: Finalizar a Compra
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/orders/checkout`
- **Body (JSON):**
```json
{
  "stripe_payment_id": "pi_pagamentoAprovadoTomFord123",
  "forma_pagamento": "CARTAO_CREDITO"
}
```

### Passo 13: Verificando o Sucesso no Histórico de Pedidos
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/orders`
