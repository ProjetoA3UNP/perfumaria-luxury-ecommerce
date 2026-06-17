# 💎 Essence - E-Commerce de Perfumaria de Luxo e Nicho

![Status](https://img.shields.io/badge/Status-Release_1.0-success)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql)
![Cypress](https://img.shields.io/badge/Cypress-E2E_Tests-17202C?logo=cypress)

## 📌 Sobre o Projeto
**Essence** é uma plataforma de e-commerce responsiva especializada em perfumaria de luxo e nicho. O projeto foi desenvolvido para oferecer uma experiência de compra sensorial e guiada, mitigando as barreiras de confiança através de uma curadoria técnica (Pirâmide Olfativa) e design focado em UX (Mobile-first).

---

## 🚀 Principais Funcionalidades

* **Catálogo Especializado:** Fichas técnicas detalhadas com notas de topo, coração e base. Filtros dinâmicos e sistema de busca ágil.
* **Quiz Olfativo:** Algoritmo lógico que recomenda perfumes com base nas preferências do usuário.
* **Carrinho e Checkout Seguros:** Trava de estoque em tempo real. Pagamentos via Cartão de Crédito (API Stripe nativa) e PIX Simulado.
* **Painel Administrativo:** Dashboard com indicadores de vendas, controle de inventário e exportação nativa de relatórios (CSV e PDF).
* **Segurança:** Autenticação via JWT, senhas hasheadas (Bcrypt), *Rate Limiting* contra força bruta e mitigação de injeções SQL.

---

## 🛠️ Stack Tecnológica

* **Frontend:** React, Vite, Axios, `@stripe/react-stripe-js`, Vanilla CSS.
* **Backend:** Node.js, Express, Stripe API.
* **Banco de Dados:** MySQL (Relacional).
* **Qualidade e Testes:** Jest, Supertest (Unitários e Integração) e Cypress (Testes End-to-End).

---

## ⚙️ Instalação e Configuração

Siga os passos abaixo para rodar a aplicação no seu ambiente local:

### 1. Pré-requisitos
* **Node.js** (v18 ou superior)
* **MySQL** (Servidor rodando localmente na porta padrão 3306)
* Git

### 2. Configuração do Banco de Dados
1. Abra seu SGBD preferido (ex: MySQL Workbench).
2. Execute o arquivo `database/schema.sql` para criar o banco de dados `essence_db` e suas 14 tabelas.
3. Execute o arquivo `database/seeds.sql` para popular o banco com categorias, marcas e perfumes.

### 3. Configuração do Backend
```bash
# Navegue até a pasta do servidor
cd backend

# Instale as dependências
npm install

# Crie um arquivo .env na raiz da pasta backend baseado no .env.example
# Preencha as credenciais do seu banco local, a chave JWT e a Secret Key da Stripe:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=essence_db
# JWT_SECRET=sua_chave_secreta
# STRIPE_SECRET_KEY=sk_test_sua_chave_stripe

# Inicie o servidor backend (rodará na porta 3000 por padrão)
npm run dev
```

### 4. Configuração do Frontend
```bash
# Abra um novo terminal e navegue até a pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor frontend (rodará na porta 5173 via Vite)
npm run dev
```

> **Acesso:** Abra seu navegador em `http://localhost:5173` para visualizar a loja.

---

## 🧪 Como rodar os Testes

O projeto conta com mais de **110 casos de teste**.

**Para testes de Backend (Unitários e Integração):**
```bash
cd backend
npm run test
```

**Para testes End-to-End (Simulação visual de usuário no Front):**
1. Certifique-se de que o backend e frontend estão rodando.
2. Abra um novo terminal na pasta do frontend:
```bash
cd frontend
npm run cypress:open
```
3. Selecione "E2E Testing" e clique no navegador escolhido para ver a suíte rodando visualmente.

---

## 📚 Documentação da API (Swagger)
Com o backend rodando, você pode acessar a documentação completa dos endpoints interativos através do Swagger UI em:
`http://localhost:3000/api-docs`
