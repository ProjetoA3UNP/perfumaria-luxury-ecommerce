describe('Fluxo de Carrinho/Sacola E2E', () => {
  it('Deve abrir o site e tentar navegar pela vitrine', () => {
    cy.visit('/');
    
    // Opcional: tentar buscar o elemento de perfume e clicar nele
    // Como a renderização dos produtos depende do banco de dados estar populado
    // Vamos apenas testar se a vitrine existe no frontend
    cy.get('body').should('contain', 'Aproveite');
  });

  it('Deve mostrar carrinho vazio para usuario nao logado na aba /sacola', () => {
    // Simulamos a resposta do Backend bloqueando o acesso (401)
    cy.intercept('GET', '**/api/cart', {
      statusCode: 401,
      body: { error: 'Não autorizado' }
    }).as('getCart');

    // Aceita automaticamente o alert nativo do navegador
    cy.on('window:alert', () => true);

    cy.visit('/sacola');
    cy.wait('@getCart');

    cy.url().should('include', '/login');
  });
});
