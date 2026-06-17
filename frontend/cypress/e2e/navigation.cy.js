describe('Fluxo de Navegação e Busca E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Deve navegar pelo menu horizontal principal', () => {
    // Clica no link "Corpo e Banho" (forçando o clique caso esteja oculto no modo desktop)
    cy.contains('.menu-horizontal-link', 'Corpo e Banho').click({ force: true });
    
    // Verifica se a URL mudou para a categoria correta
    cy.url().should('include', '/categoria/corpo-e-banho');
  });

  it('Deve buscar por um perfume na barra de pesquisa', () => {
    // Digita "Sauvage" no input de busca (apenas no modo desktop para facilitar a visibilidade do teste)
    cy.get('input.search').first().type('Sauvage{enter}');
    
    // Verifica se a URL contém os parâmetros de busca
    cy.url().should('include', '/busca?q=Sauvage');
  });
});
