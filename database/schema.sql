CREATE DATABASE IF NOT EXISTS essence_db;
USE essence_db;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cpf CHAR(11) UNIQUE,
    data_nascimento DATE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_perfil ENUM('CLIENTE', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enderecos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(60) NOT NULL,
    cep CHAR(8) NOT NULL,
    bairro VARCHAR(80) NOT NULL,
    rua VARCHAR(120) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(120),
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_enderecos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    categoria_pai_id INT NULL,
    CONSTRAINT fk_categorias_pai
        FOREIGN KEY (categoria_pai_id) REFERENCES categorias(id)
        ON DELETE SET NULL
);

CREATE TABLE marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    logo_url VARCHAR(255)
);

CREATE TABLE familias_olfativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    marca_id INT NOT NULL,
    categoria_id INT NOT NULL,
    familia_olfativa_id INT NOT NULL,
    descricao TEXT NOT NULL,
    ingredientes TEXT,
    ocasiao_ideal VARCHAR(120),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produtos_marca
        FOREIGN KEY (marca_id) REFERENCES marcas(id),
    CONSTRAINT fk_produtos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT fk_produtos_familia
        FOREIGN KEY (familia_olfativa_id) REFERENCES familias_olfativas(id)
);

CREATE TABLE notas_olfativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL UNIQUE,
    topo TEXT,
    coracao TEXT,
    base TEXT,
    CONSTRAINT fk_notas_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON DELETE CASCADE
);

CREATE TABLE imagens_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    ordem INT NOT NULL DEFAULT 1,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_imagens_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON DELETE CASCADE
);

CREATE TABLE produto_variacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    volume_ml INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque_qtd INT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_produto_variacoes UNIQUE (produto_id, volume_ml),
    CONSTRAINT fk_produto_variacoes_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON DELETE CASCADE
);

CREATE TABLE favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_favoritos UNIQUE (usuario_id, produto_id),
    CONSTRAINT fk_favoritos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON DELETE CASCADE
);

CREATE TABLE carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrinho_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE itens_carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carrinho_id INT NOT NULL,
    variacao_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    CONSTRAINT uk_itens_carrinho UNIQUE (carrinho_id, variacao_id),
    CONSTRAINT fk_itens_carrinho_carrinho
        FOREIGN KEY (carrinho_id) REFERENCES carrinho(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_itens_carrinho_variacao
        FOREIGN KEY (variacao_id) REFERENCES produto_variacoes(id)
);

CREATE TABLE cupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    desconto_percentual DECIMAL(5,2),
    desconto_valor DECIMAL(10,2),
    validade DATE NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    numero_pedido VARCHAR(20) NOT NULL UNIQUE,
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('CARTAO_CREDITO', 'PIX') NOT NULL,
    stripe_payment_id VARCHAR(120),
    endereco_entrega_id INT NOT NULL,
    cupom_id INT NULL,
    status ENUM('AGUARDANDO_PAGAMENTO', 'PAGO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO') NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_vendas_endereco
        FOREIGN KEY (endereco_entrega_id) REFERENCES enderecos(id),
    CONSTRAINT fk_vendas_cupom
        FOREIGN KEY (cupom_id) REFERENCES cupons(id)
);

CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    variacao_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itens_venda_venda
        FOREIGN KEY (venda_id) REFERENCES vendas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_itens_venda_variacao
        FOREIGN KEY (variacao_id) REFERENCES produto_variacoes(id)
);
