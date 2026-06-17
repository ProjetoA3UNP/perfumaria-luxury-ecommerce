describe('Fluxo de Página de Produto Isolado E2E', () => {
  it('Deve renderizar os detalhes de um produto mockado', () => {
    // Intercepta a chamada para o produto de ID 9999
    cy.intercept('GET', '**/api/products/9999', {
      statusCode: 200,
      body: {
        id: 9999,
        nome: 'Perfume Teste Cypress',
        descricao: 'Um perfume com aroma de código verde e sucesso.',
        marca: 'Cypress',
        categoria: 'Perfumes',
        familia_olfativa: 'Amadeirado',
        imagem: 'https://via.placeholder.com/400',
        variacoes: [
          {
            id: 1,
            volume_ml: 100,
            preco: 299.90,
            estoque_qtd: 10
          }
        ]
      }
    }).as('getProduct');

    // Visita a página do produto 9999
    cy.visit('/produto/9999');
    
    // Aguarda o Mock responder
    cy.wait('@getProduct');

    // Verifica se os textos renderizaram na tela
    cy.contains('Perfume Teste Cypress').should('be.visible');
    cy.contains('Cypress').should('be.visible');
    cy.contains('Um perfume com aroma de código verde e sucesso.').should('be.visible');
    cy.contains('R$ 299,90').should('be.visible'); // Formato pode variar dependendo da máscara do frontend

    // Verifica se o botão de adicionar à sacola existe (o texto renderizado é "SACOLA")
    cy.get('button').contains(/SACOLA/i).should('be.visible');
  });
});
