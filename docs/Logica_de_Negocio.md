# Documento Técnico: Lógica de Negócio - Essence E-commerce

Este documento descreve as principais lógicas de negócio, algoritmos e validações implementadas no sistema **Essence** (E-commerce de Alta Perfumaria), atendendo aos requisitos da disciplina.

Embora o exemplo do roteiro da faculdade mencione "agendamentos e conflitos de horário" (típico de sistemas de clínicas/serviços), a nossa aplicação possui **lógicas equivalentes voltadas para o e-commerce**, focadas em cálculos matemáticos de carrinho, validação de segurança e controle de concorrência (estoque).

---

## 1. Algoritmo de Cálculo do Carrinho (Sacola)

O coração financeiro do e-commerce reside na página da Sacola. O algoritmo responsável pelo processamento do pagamento realiza os seguintes passos lógicos em tempo real:

1. **Cálculo de Subtotal:** O sistema itera sobre o array de itens no carrinho, multiplicando o `preco` unitário de cada produto pela sua respectiva `quantidade`.
2. **Cálculo de Frete:** Baseado no CEP inserido, o sistema possui uma lógica que define um valor fixo ou dinâmico de frete.
3. **Aplicação de Cupons de Desconto:** 
   - O usuário pode inserir um cupom promocional (ex: `DESC10` ou `BEMVINDO`).
   - O algoritmo valida se o código do cupom existe no banco de dados e se ainda está no prazo de validade (status ativo).
   - Sendo válido, o sistema aplica a regra matemática do desconto (seja um percentual absoluto como 10% off, ou um valor fixo como o `FRETE0`) sobre o **Subtotal**.
4. **Cálculo Total:** O algoritmo retorna o montante final através da fórmula: `Total = (Subtotal - Desconto) + Frete`.

---

## 2. Validação de Estoque ("Conflito de Disponibilidade")

Assim como um sistema de agendamento precisa evitar que dois clientes marquem o mesmo horário (conflito de horário), o e-commerce precisa **evitar conflitos de disponibilidade de estoque**.

A lógica de negócio atua em duas frentes:
*   **Front-end:** A interface não permite que o usuário adicione ao carrinho uma quantidade maior do que a `quantidade_estoque` declarada para aquele produto.
*   **Back-end (Checkout):** Antes de concluir a inserção da tabela `pedidos` no banco de dados, a API verifica novamente o saldo do estoque no banco de dados. Se dois usuários tentarem comprar a última unidade do mesmo perfume simultaneamente, a transação que chegar mais tarde será abortada e retornará a exceção *"Quantidade solicitada excede o estoque disponível"*. Após o pagamento, o sistema dá baixa no estoque.

---

## 3. Validação e Controle de Identidade (Auth)

Para garantir que apenas pessoas reais façam pedidos, a API implementa regras rígidas de negócio no cadastro (registro) e acesso:

*   **Validação Estrita de Documentos:** A lógica impede o cadastro sem um CPF válido de 11 dígitos.
*   **Unicidade no Banco:** Ao tentar cadastrar, um algoritmo de busca verifica se o `E-mail` ou o `CPF` já constam na base de dados (chave única). Caso positivo, bloqueia o fluxo e avisa o usuário (evitando contas duplicadas).
*   **Criptografia Unidirecional:** Senhas nunca são guardadas em texto puro. A lógica de negócio utiliza a biblioteca `Bcrypt` para gerar um *Hash* da senha.
*   **Recuperação de Senha (Segurança):** Ao solicitar alteração de senha, a lógica consulta o banco em tempo real. Apenas se o e-mail existir na tabela `usuarios`, o sistema prossegue com o fluxo.

---

## 4. Algoritmo de Pesquisa Dinâmica (Filtro de Catálogo)

No cabeçalho do site, o sistema implementa uma busca em tempo real (*Live Search*).

*   Sempre que o usuário digita um caractere na lupa, a lógica filtra o banco de dados de produtos buscando por correspondências nas colunas `nome`, `marca` e `familia_olfativa`.
*   A lógica limita a exibição a no máximo 5 sugestões na tela, otimizando a performance e melhorando a UX (User Experience).

---

## 5. Gerenciamento de Status de Pedido

A lógica de negócio que rege o ciclo de vida de uma compra passa por uma "Máquina de Estados" (*State Machine*):

1. **Aguardando Pagamento:** Estado inicial assim que o botão "Finalizar Pedido" é pressionado. O sistema aguarda validação.
2. **Pagamento Aprovado / Processando:** O sistema atualiza o banco de dados e notifica o setor de separação logística.
3. **Enviado:** O código de rastreio é atrelado à tabela do banco.
4. **Entregue:** Ciclo de vida encerrado.

---

## 6. Motor de Recomendação (Quiz Perfume Ideal)

O sistema conta com um algoritmo gamificado de recomendação:
*   Através de um questionário iterativo, a lógica processa as respostas do usuário e calcula um "score" interno.
*   Ao final do quiz, o algoritmo cruza a pontuação com as famílias olfativas cadastradas no banco de dados e recomenda a categoria (ex: *Amadeirado*, *Cítrico*) que melhor se adequa ao perfil do cliente.

---

## 7. Sistema de Avaliações (Reviews)

A lógica de negócios das avaliações garante a confiabilidade das opiniões:
*   A interface e a API calculam dinamicamente a **média de estrelas** (de 1 a 5) de cada perfume baseado em todos os reviews já cadastrados.
*   Em um ambiente de produção completo, regras adicionais verificariam se o usuário que está comentando realmente possui o status do pedido como "Entregue".

---

## 8. Lista de Desejos (Favoritos)

Para melhorar a retenção de clientes, o e-commerce implementa a lógica de "Favoritar":
*   Um relacionamento *Muitos-para-Muitos* vincula o `ID_Produto` ao `ID_Usuario`.
*   A API fornece rotas dedicadas para adicionar ou remover da lista de desejos, permitindo que o cliente crie um catálogo pessoal para compras futuras sem ocupar espaço na tabela de sacola de compras.
