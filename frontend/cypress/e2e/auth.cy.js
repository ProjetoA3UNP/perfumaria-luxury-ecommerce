describe('Fluxo de Autenticação E2E', () => {
  it('Deve carregar a página inicial', () => {
    cy.visit('/');
    cy.contains('Aproveite').should('be.visible');
  });

  it('Deve tentar fazer login e falhar com credenciais inválidas', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('email_falso_cypress@teste.com');
    cy.get('input[type="password"]').type('senhaincorreta123');
    cy.get('button[type="submit"]').click();

    // Como o backend vai retornar um erro (toast), o cypress pode procurar pelo texto "Credenciais inválidas" ou similar
    // Ou podemos apenas verificar que continuamos na página de login
    cy.url().should('include', '/login');
  });

  // Nota: Não faremos o login com sucesso real aqui pois a conta de teste precisaria existir no banco, 
  // mas em um ambiente E2E estruturado criaríamos um seed/fixture só pra ele.
});
