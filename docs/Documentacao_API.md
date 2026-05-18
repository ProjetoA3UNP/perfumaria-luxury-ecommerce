# 📚 Documentação da API - Essence (AV3)

Conforme a documentação exigida (Documento Descritivo de Endpoints), seguem os mapeamentos atuais da API implementada em **Node.js/Express**. Base URL: `http://localhost:3001`

---

## 🔐 1. Módulo de Autenticação (`/api/auth`)

### 📌 `POST /api/auth/register`
Cadastra um novo usuário no sistema. Possui validações matemáticas (Mínimo 8 caracteres e E-mail Válido).
- **Acesso:** Público
- **Parâmetros de Corpo (JSON):**
  - `nome` (String, obrigatório)
  - `email` (String, obrigatório)
  - `cpf` (String: 11 chars, obrigatório)
  - `senha` (String: >= 8 chars, obrigatório)
  - `data_nascimento` (Date: YYYY-MM-DD, obrigatório)
- **Respostas Esperadas:**
  - `201 Created`: "Usuário cadastrado com sucesso!"
  - `400 Bad Request`: "Por motivos de segurança, a senha deve ter..."
  - `409 Conflict`: "E-mail ou CPF já cadastrado."

### 📌 `POST /api/auth/login`
Autentica o usuário validando a criptografia Bcrypt e devolvendo o Passport de acesso Privado.
- **Acesso:** Público
- **Parâmetros de Corpo (JSON):**
  - `email` (String, obrigatório)
  - `senha` (String, obrigatório)
- **Respostas Esperadas:**
  - `200 OK`: `{ "token": "eyJhb...", "user": {...} }`
  - `401 Unauthorized`: "Credenciais inválidas."

---

## 🧴 2. Módulo de Catálogo (`/api/products`)

### 📌 `GET /api/products`
Lista todos os perfumes ativos no banco de dados, aplicando JOINs relacionais de Banco de Dados.
- **Acesso:** Público
- **Respostas Esperadas:**
  - `200 OK`: Lista de objetos JSON contendo atributos nativos e satélites (`marca`, `categoria`, `familia`, `topo`, `coracao`, `base`).

### 📌 `POST /api/products`
Cadastra um perfume e suas respectivas Notas Olfativas sob Transação (Tudo ou Nada).
- **Acesso:** Público (Temporário para testes locais AV3)
- **Parâmetros Especiais:** Requer passagem das Chaves Estrangeiras válidas (`marca_id`, etc) e as 3 notas (`topo`, `coracao`, `base`).
- **Respostas Esperadas:**
  - `201 Created`: "Perfume cadastrado com sucesso!"
  - `500 Server Error`: "Erro ao cadastrar o Perfume..." (Rollback invocado).

---

## 🛒 3. Módulo de Carrinho (`/api/cart`)

*(Nota Técnica: Todos os endpoints do carrinho passam obrigatoriamente pela barreira `AuthMiddleware`. É necessário injetar o Token no header de `Authorization`)*.

### 📌 `GET /api/cart`
Lista os itens na sacola do usuário e calcula automaticamente o subtotal.
- **Acesso:** Privado (Requer Token JWT)
- **Respostas Esperadas:**
  - `200 OK`: `{ "itens": [...], "total": 2490.00 }`

### 📌 `POST /api/cart/add`
Insere um item ou incrementa a quantidade caso o mesmo produto seja inserido novamente. Possui trava lógica de Estoque (US20).
- **Acesso:** Privado
- **Parâmetros de Corpo (JSON):**
  - `produto_id` (Number, obrigatório)
  - `quantidade` (Number, obrigatório)
- **Respostas Esperadas:**
  - `200 OK`: "Item adicionado ao carrinho com sucesso!"
  - `400 Bad Request`: "Quantidade excede o estoque. Só temos..."
  - `404 Not Found`: "Produto não encontrado ou inativo."
