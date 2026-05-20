# Roteiro de Apresentação AV3 (Backend)

Este guia foi desenhado para você seguir na ordem **exata** durante a apresentação com o professor, usando o **LiteClient** (ou Postman). Deixe todos os endpoints já salvos nas abas do cliente para agilizar!

> [!WARNING]
> A partir do passo 6, os endpoints exigem o **Token JWT**. Lembre-se de colar o Token gerado no Passo 2 na aba `Headers` do LiteClient (Chave: `Authorization`, Valor: `Bearer SEU_TOKEN_AQUI`).

---

### Passo 1: Cadastro do Usuário (Mostrando Criptografia)
Vamos criar a conta do professor avaliador no banco.
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/auth/register`
- **Body (JSON):**
```json
{
  "nome": "Professor Avaliador",
  "email": "professor@unp.br",
  "cpf": "00011122233",
  "data_nascimento": "1985-05-20",
  "senha": "senhaAvaliador123"
}
```

### Passo 2: Login (Mostrando Geração do Token JWT)
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "professor@unp.br",
  "senha": "senhaAvaliador123"
}
```
**Ação Imediata:** Copie a string gigante que vem no campo `"token"` na resposta. Vá na aba "Headers" de todas as próximas abas do LiteClient e configure: `Authorization: Bearer <seu_token_aqui>`.

### Passo 3: Catálogo Geral (Mostrando os JOINs e a Rapidez)
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/products`
- **Explicação:** Mostre que as notas olfativas e variações vieram sem aquele problema das "N+1 queries" (banco otimizado).

### Passo 4: Detalhe de um Perfume Específico
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/products/1`
- **Explicação:** Mostra detalhes avançados do perfume ID 1, como a pirâmide olfativa completa (Topo, Coração, Base).

### Passo 5: Criando um Novo Perfume (Transação SQL Segura)
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/products`
- **Body (JSON):**
```json
{
  "nome": "Perfume AV3 Ouro",
  "marca_id": 1,
  "categoria_id": 1,
  "familia_olfativa_id": 1,
  "preco": 450.00,
  "estoque_qtd": 50,
  "descricao": "Criado exclusivamente para garantir a nota máxima na AV3.",
  "ingredientes": "Álcool, Essência da Vitória",
  "ocasiao_ideal": "Apresentação de Projetos",
  "topo": "Bergamota",
  "coracao": "Jasmim",
  "base": "Sândalo"
}
```

### Passo 6: Carrinho Vazio (Mostrando Segurança)
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/cart`
- **Header:** Lembre-se do Token JWT!
- **Resultado esperado:** Ele deve trazer a lista de `itens: []` vazia, provando que é um carrinho isolado só para este usuário logado.

### Passo 7: Adicionar Perfume ao Carrinho (Trava de Estoque)
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/cart/add`
- **Body (JSON):**
```json
{
  "variacao_id": 1,
  "quantidade": 2
}
```

### Passo 8: Carrinho Cheio (Mostrando a Lógica Matemática)
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/cart`
- **Explicação:** Mostre pro professor que o Node.js já fez a multiplicação de Quantidade x Preço e gerou o subtotal no JSON perfeitamente.

### Passo 9: Histórico de Pedidos Vazio
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/orders`
- **Resultado:** Array vazio `[]`, pois o avaliador acabou de criar a conta e não comprou nada.

### Passo 10: Cadastrar Endereço (Pré-Requisito do Checkout)
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/addresses`
- **Body (JSON):**
```json
{
  "titulo": "Universidade Potiguar",
  "cep": "59056000",
  "bairro": "Lagoa Nova",
  "rua": "Av. Senador Salgado Filho",
  "numero": "1610",
  "principal": true
}
```

### Passo 11: Iniciar Integração com a Stripe (Geração de Intent)
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/orders/create-payment-intent`
- **Body:** `{}` (Vazio)
- **Explicação:** O backend vai ler o carrinho automaticamente, converter o total para centavos e bater na porta da Stripe para pegar a chave secreta de pagamento (`clientSecret`).

### Passo 12: Finalizar a Compra (Transação de Checkout)
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/orders/checkout`
- **Body (JSON):**
```json
{
  "stripe_payment_id": "pi_12345mockado_pagamento",
  "forma_pagamento": "CARTAO_CREDITO"
}
```
- **Explicação Crucial:** Fale para o professor: "Nesse exato momento, o banco abriu uma Transaction bloqueante, transferiu os produtos do carrinho para o pedido, reduziu o estoque real de forma segura e encerrou a Transaction!"

### Passo 13: Verificando o Sucesso no Histórico de Pedidos
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/orders`
- **Resultado:** Mostre o belíssimo pedido formatado com "status: PAGO" contendo todos os detalhes dos itens e do endereço do Avaliador. Fim de apresentação!
