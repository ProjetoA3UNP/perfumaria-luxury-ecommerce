describe('Fluxo de Validação de Cadastro E2E', () => {
  beforeEach(() => {
    cy.visit('/cadastro');
  });

  it('Deve desabilitar o botão de envio se os dados forem inválidos (Validação Frontend)', () => {
    // Preenche os dados com um CPF propositalmente incompleto
    cy.get('.auth-form input[type="text"]').eq(0).type('Teste Cypress'); // Nome
    cy.get('.auth-form input[type="email"]').type('teste@cypress.com');
    cy.get('.auth-form input[type="text"]').eq(1).type('123456'); // CPF incompleto (o botão deve ficar disabled)
    cy.get('.auth-form input[type="text"]').eq(2).type('10101990'); // Data
    cy.get('.auth-form input[type="password"]').type('senha123');
    
    // Como o formulário é inválido, o botão CRIAR CONTA deve estar desabilitado
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('Deve mostrar erro se o e-mail já existir (Validação Backend com Mock)', () => {
    // Intercepta a chamada para o backend de registro
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 400,
      body: { error: 'E-mail já cadastrado no sistema' }
    }).as('postRegister');

    // Preenche com dados VÁLIDOS para habilitar o botão
    cy.get('.auth-form input[type="text"]').eq(0).type('Novo Usuario');
    cy.get('.auth-form input[type="email"]').type('existente@email.com');
    cy.get('.auth-form input[type="text"]').eq(1).type('12345678901'); // CPF 11 digitos
    cy.get('.auth-form input[type="text"]').eq(2).type('10101990'); // Data
    cy.get('.auth-form input[type="password"]').type('senha123');
    
    // O botão deve estar habilitado, então clicamos
    cy.get('button[type="submit"]').should('not.be.disabled').click();
    
    // Aguarda o intercept
    cy.wait('@postRegister');

    // Verifica se o popup de erro (que escrevemos "Falha no Cadastro") apareceu
    cy.contains('Falha no Cadastro').should('be.visible');
    cy.contains('E-mail já cadastrado no sistema').should('be.visible');
  });
});
