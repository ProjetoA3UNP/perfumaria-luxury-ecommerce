-- 1. Injetando no mínimo 10 Categorias
INSERT IGNORE INTO categorias (id, nome) VALUES 
(1, 'Alta Perfumaria'), (2, 'Nicho'), (3, 'Designer'), (4, 'Indie'), (5, 'Celebrity'), 
(6, 'Natural/Orgânico'), (7, 'Exótico'), (8, 'Vintage'), (9, 'Esportivo'), (10, 'Casual');

-- 2. Injetando no mínimo 10 Marcas
INSERT IGNORE INTO marcas (id, nome) VALUES 
(1, 'Chanel'), (2, 'Dior'), (3, 'Tom Ford'), (4, 'Creed'), (5, 'Amouage'), 
(6, 'Parfums de Marly'), (7, 'Xerjoff'), (8, 'Bvlgari'), (9, 'Hermès'), (10, 'Guerlain');

-- 3. Injetando no mínimo 10 Famílias Olfativas
INSERT IGNORE INTO familias_olfativas (id, nome) VALUES 
(1, 'Amadeirado Escuro'), (2, 'Floral Branco'), (3, 'Cítrico Aromático'), (4, 'Chipre'), 
(5, 'Oriental Especiado'), (6, 'Gourmand'), (7, 'Fougère'), (8, 'Aquático'), 
(9, 'Couro'), (10, 'Herbal/Verde');

-- 4. Injetando Usuários (Originais + Matheus e Admin 2)
-- Senha de todos é 'senha1234' em hash
INSERT IGNORE INTO usuarios (id, nome, email, cpf, senha_hash, data_nascimento, tipo_perfil) VALUES 
(1, 'Admin Supremo', 'admin@essence.com', '11111111111', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1980-01-01', 'ADMIN'),
(2, 'Cliente Teste', 'cliente1@mail.com', '22222222222', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1990-05-15', 'CLIENTE'),
(3, 'João Silva', 'joao@mail.com', '33333333333', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1985-06-20', 'CLIENTE'),
(4, 'Maria Costa', 'maria@mail.com', '44444444444', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1992-07-21', 'CLIENTE'),
(5, 'Carlos Alberto', 'carlos@mail.com', '55555555555', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1988-12-01', 'CLIENTE'),
(6, 'Ana Beatriz', 'ana@mail.com', '66666666666', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1995-11-10', 'CLIENTE'),
(7, 'Felipe Santos', 'felipe@mail.com', '77777777777', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1982-03-30', 'CLIENTE'),
(8, 'Julia Mendes', 'julia@mail.com', '88888888888', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1998-04-12', 'CLIENTE'),
(9, 'Roberto Alves', 'roberto@mail.com', '99999999999', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1979-08-08', 'CLIENTE'),
(10, 'Sabrina Sato', 'sabrina@mail.com', '10101010101', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1991-09-09', 'CLIENTE'),
(11, 'Admin Secundário', 'admin2@essence.com', '12121212121', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1985-05-15', 'ADMIN'),
(12, 'Matheus Rens', 'matheusrens@gmail.com', '13131313131', '$2a$10$7VWhRhQNY2CTuHM91tx3d.hyxNoSzn7uiRpZC8SqBjaQuo6/4LbUy', '1998-08-20', 'CLIENTE');

-- 5. Injetando 10 Perfumes Espetaculares (Sem preço e estoque, que foram para as variações)
INSERT IGNORE INTO produtos (id, nome, marca_id, categoria_id, familia_olfativa_id, ativo, descricao, ingredientes, ocasiao_ideal) VALUES 
(1, 'Bleu de Chanel', 1, 3, 1, TRUE, 'Fragrância marcante e limpa', 'Álcool, Água, Parfum', 'Trabalho / Eventos'),
(2, 'Sauvage Dior', 2, 3, 7, TRUE, 'O poder selvagem Fougère', 'Ambroxan, Pimenta', 'Noite / Balada'),
(3, 'Oud Wood', 3, 2, 1, TRUE, 'Sedutor e exclusivo Tom Ford', 'Oud, Sândalo', 'Encontros'),
(4, 'Aventus', 4, 2, 4, TRUE, 'O rei da perfumaria de nicho', 'Abacaxi, Bétula', 'Reuniões de Negócios'),
(5, 'Reflection Man', 5, 2, 2, TRUE, 'Elegância floral masculina', 'Jasmim, Néroli', 'Casamentos'),
(6, 'Layton', 6, 2, 5, TRUE, 'Maçã cremosa e baunilha', 'Maçã, Lavanda', 'Encontros'),
(7, 'Naxos', 7, 2, 6, TRUE, 'Tabaco e mel siciliano', 'Mel, Tabaco, Limão', 'Dias Frios'),
(8, 'Aqva Pour Homme', 8, 3, 8, TRUE, 'As profundezas do oceano', 'Algas, Mandarina', 'Dias Quentes / Praia'),
(9, 'Terre d''Hermès', 9, 3, 1, TRUE, 'Terra, água e céu unidos', 'Laranja, Vetiver', 'Uso Assinatura'),
(10, 'L''Homme Idéal', 10, 3, 6, TRUE, 'Amêndoas licorosas', 'Amêndoa, Couro', 'Dias Frios'),
(11, 'Allure Homme Sport', 1, 3, 3, TRUE, 'Frescor extremo e elegância', 'Laranja, Notas Oceânicas', 'Esportes / Casual'),
(12, 'Baccarat Rouge 540', 6, 2, 5, TRUE, 'Brilho âmbar floral inconfundível', 'Jasmim, Açafrão, Cedro', 'Eventos Especiais'),
(13, 'Black Orchid', 3, 2, 5, TRUE, 'Luxuoso, escuro e envolvente', 'Trufa, Orquídea Negra', 'Noite / Inverno'),
(14, 'Blue Seduction', 8, 3, 8, TRUE, 'Ousado e refrescante', 'Menta, Melão', 'Dias Quentes'),
(15, 'Chanel N°5', 1, 1, 2, TRUE, 'O clássico absoluto da perfumaria', 'Aldeídos, Rosa, Ylang-Ylang', 'Uso Assinatura'),
(16, 'CK One', 9, 3, 3, TRUE, 'A pureza unissex cítrica', 'Limão, Bergamota', 'Casual / Academia'),
(17, 'Verveine', 10, 6, 3, TRUE, 'A energia da verbena fresca', 'Verbena, Limão', 'Dias Quentes');

-- 5.5 Injetando Variações (SKUs) de ML para os perfumes
INSERT IGNORE INTO produto_variacoes (produto_id, volume_ml, preco, estoque_qtd) VALUES
(1, 50, 850.00, 30),
(1, 100, 1250.00, 20),
(2, 60, 750.00, 50),
(2, 100, 1100.00, 50),
(3, 50, 1800.00, 10),
(3, 100, 2490.00, 5),
(4, 50, 2200.00, 2),
(4, 100, 3200.00, 3),
(5, 50, 1900.00, 10),
(5, 100, 2800.00, 10),
(6, 75, 2100.00, 15),
(6, 125, 2600.00, 15),
(7, 50, 2000.00, 5),
(7, 100, 2900.00, 5),
(8, 50, 550.00, 40),
(8, 100, 850.00, 40),
(9, 50, 900.00, 30),
(9, 100, 1400.00, 30),
(10, 50, 650.00, 20),
(10, 100, 950.00, 25),
(11, 50, 800.00, 30),
(11, 100, 1200.00, 20),
(12, 70, 2500.00, 15),
(12, 200, 4800.00, 5),
(13, 50, 1500.00, 15),
(13, 100, 2100.00, 10),
(14, 50, 250.00, 50),
(14, 100, 350.00, 45),
(15, 50, 1100.00, 20),
(15, 100, 1600.00, 15),
(16, 50, 300.00, 40),
(16, 100, 450.00, 35),
(17, 100, 450.00, 25);

-- 6. Injetando 10 Pirâmides Olfativas
INSERT IGNORE INTO notas_olfativas (id, produto_id, topo, coracao, base) VALUES 
(1, 1, 'Limão, Hortelã, Pimenta', 'Gengibre, Jasmim', 'Incenso, Cedro, Sândalo'),
(2, 2, 'Bergamota da Calábria', 'Pimenta de Sichuan', 'Ambroxan'),
(3, 3, 'Cardamomo, Pimenta Chinesa', 'Madeira de Oud', 'Fava Tonka, Baunilha'),
(4, 4, 'Abacaxi, Cassis, Maçã', 'Bétula, Patchouli', 'Musgo de Carvalho'),
(5, 5, 'Alecrim, Pimenta Vermelha', 'Néroli, Jasmim', 'Sândalo, Cedro'),
(6, 6, 'Maçã, Bergamota, Lavanda', 'Jasmim, Violeta', 'Baunilha, Pimenta'),
(7, 7, 'Mel, Limão, Bergamota', 'Tabaco, Canela', 'Fava Tonka, Baunilha'),
(8, 8, 'Mandarina, Petitgrain', 'Posidônia Oceânica', 'Âmbar Mineral'),
(9, 9, 'Laranja, Toranja', 'Pimenta, Pelargonium', 'Vetiver, Cedro'),
(10, 10, 'Cítricos, Flor de Laranjeira', 'Amêndoa, Fava Tonka', 'Couro, Alecrim, Vetiver');

-- 7. Injetando as Imagens dos Produtos
INSERT IGNORE INTO imagens_produto (produto_id, url, ordem, principal) VALUES 
(1, '/products/perfume_bleu.png', 1, TRUE),
(2, '/products/sauvage_dior.jpg', 1, TRUE),
(3, '/products/perfume_wood.png', 1, TRUE),
(4, '/products/perfume_gold.png', 1, TRUE),
(5, '/products/reflection_man.jpg', 1, TRUE),
(6, '/products/layton.jpg', 1, TRUE),
(7, '/products/naxos.jpg', 1, TRUE),
(8, '/products/perfume_fresh.png', 1, TRUE),
(9, '/products/terre_d_hermes.jpg', 1, TRUE),
(10, '/products/l_homme_ideal.jpg', 1, TRUE),
(11, '/products/allure_sport.jpg', 1, TRUE),
(12, '/products/baccarat_rouge.jpg', 1, TRUE),
(13, '/products/black_orchid.jpg', 1, TRUE),
(14, '/products/blue_seduction.jpg', 1, TRUE),
(15, '/products/chanel_5.jpg', 1, TRUE),
(16, '/products/ck_one.jpg', 1, TRUE),
(17, '/products/verveine.jpg', 1, TRUE);
