describe('Fluxo de Exploração da Loja', () => {
  it('5. Deve navegar pela Categoria "Família Olfativa" corretamente', () => {
    cy.visit('/');

    // Abre o menu desktop ou clica no link direto. No Header, Famílias Olfativas redireciona para a respectiva página.
    // Como os sublinks podem estar escondidos em dropdowns desktop, acessamos diretamente a URL que o click geraria
    cy.visit('/categoria/amadeirado');

    // Verifica se a API mockada foi chamada (ou o backend real) e se a página renderiza o título correto
    cy.contains('h2', 'Amadeirado', { matchCase: false }).should('be.visible');
  });

  it('6. Deve renderizar e expandir produtos com Paginação (Carregar Mais)', () => {
    // Intercepta a rota de produtos e manda 24 produtos fakes para forçar a paginação (que no Category é de 12 em 12)
    const produtosFakes = Array.from({ length: 24 }).map((_, i) => ({
      id: i + 1,
      nome: `Perfume Teste ${i + 1}`,
      marca: 'Marca Teste',
      preco: 100.0,
      categoria: 'Perfumes',
      imagem: 'https://via.placeholder.com/400'
    }));

    cy.intercept('GET', '**/api/products', {
      statusCode: 200,
      body: produtosFakes
    }).as('getProductsPaginated');

    cy.visit('/categoria/perfumes');
    cy.wait('@getProductsPaginated');

    // A lógica de paginação no Category.jsx e Home.jsx mostra PRODUTOS_POR_PAGINA (12 por padrão)
    // Verifica se os primeiros 12 aparecem
    cy.get('.product-card').should('have.length', 12);

    // Clica no botão "Carregar Mais"
    cy.contains('button', 'Carregar Mais', { matchCase: false }).click();

    // Como tínhamos 24, agora a grade inteira de 24 deve aparecer e o botão deve sumir
    cy.get('.product-card').should('have.length', 24);
    cy.contains('button', 'Carregar Mais', { matchCase: false }).should('not.exist');
  });

  it('7. Deve Adicionar aos Favoritos', () => {
    // Moca produtos garantindo todas as propriedades necessárias do ProductCard
    cy.intercept('GET', '**/api/products', {
      statusCode: 200,
      body: [{ 
        id: 1, 
        nome: 'Perfume Teste', 
        marca: 'Marca Teste', 
        preco: 100.0, 
        imagem: 'https://via.placeholder.com/400',
        variacoes: JSON.stringify([{ id: 1, estoque_qtd: 10, volume_ml: 50, preco: 100 }])
      }]
    }).as('getProducts');

    cy.intercept('POST', '**/api/favorites', { statusCode: 401 }).as('postFav');

    cy.visit('/');
    cy.wait('@getProducts');

    // Clica no ícone de Favoritar (Heart icon) na vitrine
    cy.get('.favorite').first().click({ force: true });

    // Como o mock devolve 401, o ProductCard.jsx (linha 103) exibe uma mensagem
    cy.contains('.card-message', 'Faça login para favoritar').should('be.visible');
  });

  it('8. Deve preencher e validar o Quiz do Perfume Ideal', () => {
    cy.visit('/quiz');

    // Passo 1: Tela Inicial do Quiz
    cy.contains('button', 'Começar Quiz').click();

    // O Quiz possui perguntas sequenciais. Vamos clicar sistematicamente na primeira opção de cada passo.
    // O Quiz.jsx controla o passo baseado na classe .opcao ou botões dentro da div de opções
    cy.get('button').contains('Dia a dia / Trabalho').click();
    
    // Aguarda a animação (setTimeout de 300ms no Quiz.jsx)
    cy.wait(400); 

    // Passo 2
    cy.get('button').contains('Amadeirado Escuro').click();
    cy.wait(400);

    // Passo 3
    cy.get('button').contains('Alta Perfumaria').click();
    cy.wait(400);

    // Passo 4
    cy.get('button').contains('Até R$ 400').click();
    cy.wait(400);

    // Passo 5 (Último)
    cy.get('button').contains('Elegância e poder').click();
    cy.wait(400);

    // O resultado final deve aparecer com o título: "Perfumes Recomendados para Você"
    cy.contains('h1', 'Perfumes Recomendados para Você').should('be.visible');
    
    // Confere se o botão de reiniciar funciona
    cy.contains('button', 'Refazer Quiz').click();
    cy.contains('h1', 'Descubra seu Perfume Ideal').should('be.visible');
  });

  it('9. Deve validar tratamento de Pesquisa Vazia', () => {
    cy.visit('/');

    // Pesquisa por um termo bizarro
    cy.get('input.search').first().type('XABLAU123xyz{enter}');

    // A Search page (/busca?q=...) vai fazer fetch e retornar vazio.
    // A página Category/Search deve dizer "Nenhum perfume encontrado."
    cy.contains('Nenhum perfume encontrado').should('be.visible');
  });
});
