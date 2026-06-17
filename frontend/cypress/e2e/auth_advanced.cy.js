describe('Fluxo de Autenticação Avançada', () => {
  it('1 e 2. Deve fazer login com sucesso, e em seguida realizar logout limpando o localStorage', () => {
    // Intercepta a chamada de login e moca uma resposta de sucesso
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: { id: 1, nome: 'Test User', email: 'test@user.com' }
      }
    }).as('loginSuccess');

    // Intercepta requisições feitas pelo Header após o login para evitar 401 por causa do fake-jwt-token
    cy.intercept('GET', '**/api/products*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/products/menu-filters', { statusCode: 200, body: { categorias: [], familias: [], marcas: [] } });

    cy.visit('/login');

    // Preenche credenciais usando a classe .auth-form
    cy.get('.auth-form input[type="email"]').type('test@user.com');
    cy.get('.auth-form input[type="password"]').type('SenhaSegura123');
    
    cy.get('.auth-form button[type="submit"]').click();

    cy.wait('@loginSuccess');

    // Verifica se redirecionou para a home
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Verifica se o Header atualizou checando se o ícone de Meu Perfil renderizou (title="Meu Perfil")
    cy.get('svg[title="Meu Perfil"]').should('exist');

    // Agora, realiza a ação de Logout clicando no botão que acabou de aparecer
    // O Header renderiza o botão duas vezes (mobile/desktop), então usamos o .first()
    cy.get('.logout-btn').first().click({ force: true });

    // Valida se o localStorage foi limpo (no Header/Profile.jsx o localStorage é removido)
    cy.window().its('localStorage.usuarioLogado').should('be.undefined');
    
    // Valida se voltou pra Home e o ícone de login (title="Fazer Login") existe
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('svg[title="Fazer Login"]').should('exist');
  });

  it('3. Deve interceptar 401 em rota protegida, limpar a sessão e redirecionar para Login', () => {
    // Configura localStorage com um usuário, simulando um token expirado
    const fakeUser = { id: 1, nome: 'Test User', email: 'test@user.com', token: 'expired-token' };
    
    // Moca a resposta 401 para a chamada que o /perfil faz
    cy.intercept('GET', '**/api/auth/me', { statusCode: 401 }).as('authMe');

    cy.visit('/perfil', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuarioLogado', JSON.stringify(fakeUser));
      }
    });

    cy.wait('@authMe');

    // O interceptador global do axios deve remover do localStorage e redirecionar para login
    cy.window().its('localStorage.usuarioLogado').should('be.undefined');
    cy.url().should('include', '/login');

    // O Login.jsx exibe um popup ao detectar session_expired na URL (apagando a query depois via replace: true)
    cy.contains('Sua sessão expirou', { matchCase: false }).should('be.visible');
  });
});
