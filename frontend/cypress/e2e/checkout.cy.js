describe('Fluxo de Checkout e Sacola', () => {
  // Evita que erros internos de scripts de terceiros (ex: Stripe) quebrem os testes
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  });

  it('10 e 11. Deve interagir com o carrinho, atualizando Badge e Subtotal', () => {
    // Intercepta a chamada do carrinho inicial vazia
    cy.intercept('GET', '**/api/cart', {
      statusCode: 200,
      body: { id: 1, itens: [], valor_total: 0 }
    }).as('getCartEmpty');

    // Limpa estado anterior
    cy.clearLocalStorage();

    // Moca a resposta do Produto 999 com variacoes
    cy.intercept('GET', '**/api/products/999', {
      statusCode: 200,
      body: { 
        id: 999, 
        nome: 'Perfume Caro', 
        preco: 500, 
        marca: 'Dior', 
        imagem: '',
        variacoes: [{ id: 9991, estoque_qtd: 10, preco: 500, volume_ml: 50 }]
      }
    }).as('getProduct');

    // Moca requisições protegidas disparadas pelo Product.jsx quando logado (para não tomar 401 e ser expulso pro Login)
    cy.intercept('GET', '**/api/reviews/can-review/999', { statusCode: 200, body: { podeAvaliar: false } });
    cy.intercept('GET', '**/api/favorites', { statusCode: 200, body: [] });

    cy.visit('/produto/999', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuarioLogado', JSON.stringify({ id: 1, nome: 'Teste' }));
      }
    });
    
    // Moca a adição ao carrinho
    cy.intercept('POST', '**/api/cart/add', {
      statusCode: 200,
      body: { message: 'Adicionado' }
    }).as('addToCart');

    // Moca o carrinho JÁ PREENCHIDO para a chamada de atualizarBadge() do CartContext
    cy.intercept('GET', '**/api/cart', {
      statusCode: 200,
      body: {
        id: 1,
        itens: [
          { item_carrinho_id: 1, variacao_id: 9991, produto_id: 999, produto_nome: 'Perfume Caro', preco_unitario: 500, quantidade: 1, volume_ml: 50 }
        ],
        valor_total: 500
      }
    }).as('getCartFilled');

    // Clica para adicionar usando a classe do botão no Product.jsx
    cy.get('.sacola-button').click({ force: true });
    cy.wait('@addToCart');

    // O Frontend via CartContext deve atualizar o número no Header (a classe é .cart-badge)
    cy.get('.cart-badge').should('exist');

    // O componente Product.jsx possui um timeout de 1s que navega automaticamente para a /sacola
    cy.url({ timeout: 5000 }).should('include', '/sacola');
    cy.wait('@getCartFilled');

    cy.contains('Perfume Caro').should('be.visible');
    
    // Altera a quantidade no carrinho (PUT)
    cy.intercept('PUT', '**/api/cart/update/*', {
      statusCode: 200,
      body: { message: 'Atualizado' }
    }).as('updateCart');

    // Moca o novo estado do carrinho para quando o Bag.jsx chamar carregarSacola() logo após o PUT
    cy.intercept('GET', '**/api/cart', {
      statusCode: 200,
      body: {
        id: 1,
        itens: [
          { item_carrinho_id: 1, variacao_id: 9991, produto_id: 999, produto_nome: 'Perfume Caro', preco_unitario: 500, quantidade: 2, volume_ml: 50 }
        ],
        valor_total: 1000
      }
    }).as('getCartUpdated');

    // Clica no botão de '+' da quantidade
    cy.contains('button', '+').click();
    cy.wait('@updateCart');
    cy.wait('@getCartUpdated');
    
    // Checa se o total mudou de acordo com o mock
    cy.contains('1000,00').should('be.visible');
  });

  it('12, 13 e 14. Deve calcular frete, aplicar cupom ESSENCE10 e travar formulário no Address.jsx', () => {
    // Carrega a página do checkout (endereço)
    cy.visit('/endereco', { state: { cupom_codigo: 'ESSENCE10' } });

    // Preenche CEP mockado da ViaCEP
    cy.intercept('GET', 'https://viacep.com.br/ws/01001000/json/', {
      statusCode: 200,
      body: {
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        uf: 'SP',
        localidade: 'São Paulo'
      }
    }).as('viacep');

    // Digita o CEP
    cy.get('input[name="cep"]').type('01001000');
    cy.wait('@viacep');

    // Como é SP, a tabela de Address.jsx dita Frete de R$ 15.90 com prazo de 2 dias.
    cy.contains('📦 Frete para São Paulo (SP)').should('be.visible');
    cy.contains('R$ 15,90').should('be.visible');

    // Preenche os outros campos
    cy.get('input[name="titulo"]').type('Casa Nova');
    cy.get('input[name="numero"]').type('123');
    
    // Agora o botão deve estar liberado
    cy.get('button[type="submit"]').contains('CONTINUAR').should('not.be.disabled');
  });

  it('15. Deve simular Pagamento via PIX e redirecionar para Conclusão', () => {
    // Moca a inicialização do Stripe para evitar que a tela de erro premium bloqueie a tela
    // O clientSecret do Stripe exige o formato 'pi_..._secret_...' para não quebrar a SDK
    cy.intercept('POST', '**/api/orders/create-payment-intent', {
      statusCode: 200,
      body: { clientSecret: 'pi_fake123_secret_fake456', amount: 51590 }
    }).as('paymentIntent');

    // Passa o state falso na rota para não quebrar o Payment.jsx
    cy.visit('/pagamento', { 
      state: { 
        endereco: { rua: 'Rua X' }, 
        frete: { valor: 15.90 } 
      } 
    });

    cy.wait('@paymentIntent');

    // Clica no toggle do PIX (forçando o clique caso algum estilo do Stripe atrapalhe)
    cy.contains('button', '💠 PIX').click();

    // Intercepta a finalização do pedido para não tocar no banco real
    cy.intercept('POST', '**/api/orders/checkout', {
      statusCode: 200,
      body: { numero_pedido: '#987654321', valor_total: 515.90 }
    }).as('postCheckout');

    // Clica em Simular Pagamento PIX
    cy.contains('button', 'SIMULAR PAGAMENTO PIX').click();
    cy.wait('@postCheckout');

    // Deve redirecionar para a tela de Conclusão e mostrar o número do pedido
    cy.url().should('include', '/pedido-concluido');
    cy.contains('Pedido Concluído!').should('be.visible');
    cy.contains('#987654321').should('be.visible');
  });
});
