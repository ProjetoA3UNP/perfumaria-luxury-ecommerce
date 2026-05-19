-- ========================================================
-- SEEDS ADICIONAIS - Novos Produtos Essence
-- Cobre todas as categorias de Perfumaria (exceto Designer)
-- e todas as Famílias Olfativas (exceto Couro) com 3+ produtos
-- ========================================================

-- Novos Produtos (IDs 18-40)
INSERT IGNORE INTO produtos (id, nome, marca_id, categoria_id, familia_olfativa_id, ativo, descricao, ingredientes, ocasiao_ideal) VALUES
-- Alta Perfumaria (cat=1): J'adore + Miss Dior Blooming → total 3 com Chanel N°5
(18, 'J''adore',            2, 1,  2, TRUE, 'A elegância floral feminina da Dior',         'Rosa, Jasmim, Ylang-Ylang',          'Uso Assinatura'),
(19, 'Miss Dior Blooming',  2, 1,  2, TRUE, 'Leveza floral para o dia a dia',              'Peônia, Rosa, Musk',                 'Uso Diário'),

-- Indie (cat=4): L''Eau d''Issey + Fahrenheit + Kouros
(20, 'L''Eau d''Issey',     9, 4,  3, TRUE, 'Frescor cítrico aquático inconfundível',      'Limão, Pepino, Lótus',               'Dias Quentes'),
(21, 'Fahrenheit',          2, 4,  7, TRUE, 'Gasóleo e violeta num clássico cult',         'Violeta, Lírio, Cedro',              'Noite'),
(22, 'Kouros',              8, 4,  7, TRUE, 'O fougère masculino mais icônico',            'Basil, Aldeídos, Civet',             'Uso Assinatura'),

-- Celebrity (cat=5): Heat Elixir + Fantasy + Lovely
(23, 'Heat Elixir',         10, 5, 5, TRUE, 'Oriental irresistível e intenso',             'Orquídea, Âmbar, Néctar de Pêssego', 'Noite / Inverno'),
(24, 'Fantasy',              8, 5,  6, TRUE, 'Frutado gourmand com assinatura pop',        'Kiwi, Jasmim, Almizcle',             'Uso Casual'),
(25, 'Lovely',               4, 5,  2, TRUE, 'Feminilidade serena e elegante',             'Lavanda, Maçã, Musk',                'Dias Frios'),

-- Natural/Orgânico (cat=6): Amazônia + Green Tea + 4711
(26, 'Amazônia',             9, 6, 10, TRUE, 'A floresta amazônica em essência',           'Folha Verde, Cedro, Musgos',         'Uso Diário'),
(27, 'Green Tea',            8, 6, 10, TRUE, 'Chá verde fresco e sofisticado',             'Chá Verde, Bergamota, Bambu',        'Casual / Academia'),
(40, '4711 Original',        4, 6, 10, TRUE, 'O primeiro Eau de Cologne da história',      'Limão, Laranja, Alecrim, Neroli',    'Uso Diário'),

-- Exótico (cat=7): Oud Ispahan + Rose Oud + Tobacco Oud
(28, 'Oud Ispahan',          2, 7,  1, TRUE, 'Oud pérsico com rosas de damasco',           'Rosa, Oud, Patchouli',               'Noite / Inverno'),
(29, 'Rose Oud',             5, 7,  4, TRUE, 'Chipre floral de extrema sofisticação',      'Rosa, Oud, Resina',                  'Eventos Especiais'),
(30, 'Tobacco Oud',          3, 7,  5, TRUE, 'Tabaco e oud em fusão oriental densa',       'Oud, Tabaco, Baunilha',              'Noite / Inverno'),

-- Vintage (cat=8): Mitsouko + Habit Rouge + Eau Sauvage
(31, 'Mitsouko',            10, 8,  4, TRUE, 'O grande chipre de Guerlain desde 1919',     'Pêssego, Bergamota, Musgo de Carvalho', 'Uso Assinatura'),
(32, 'Habit Rouge',         10, 8,  5, TRUE, 'O Oriental mais famoso do mundo',            'Limão, Rosa, Baunilha',              'Noite / Formal'),
(33, 'Eau Sauvage',          2, 8,  7, TRUE, 'Fougère cítrico criado por Edmond Roudnitska','Limão, Jasmim, Vetiver',            'Uso Assinatura'),

-- Esportivo (cat=9): Cool Water + Polo Sport + Davidoff Adventure
(34, 'Cool Water',           5, 9,  8, TRUE, 'O aquático esportivo mais copiado do mundo', 'Menta, Algas, Sândalo',              'Academia / Praia'),
(35, 'Polo Sport',           6, 9,  3, TRUE, 'Cítrico esportivo vibrante',                 'Limão, Fresia, Cedro',               'Esportes / Casual'),
(36, 'Davidoff Adventure',   8, 9,  8, TRUE, 'Madeiras e especiarias para o aventureiro',  'Toranja, Cardamomo, Patchouli',      'Casual / Esportes'),

-- Casual (cat=10): Light Blue + Acqua di Gio + Boss Bottled
(37, 'Light Blue',           2, 10, 3, TRUE, 'O Mediterrâneo em cada spray',               'Granny Smith, Bambu, Cedro',         'Dias Quentes / Praia'),
(38, 'Acqua di Gio',         8, 10, 8, TRUE, 'O aquático mais vendido do planeta',         'Bergamota, Jasmim, Patchouli',       'Casual / Trabalho'),
(39, 'Boss Bottled',         9, 10, 6, TRUE, 'O clássico frutado amadeirado do homem moderno', 'Maçã, Canela, Baunilha',        'Trabalho / Casual');

-- Variações (SKUs) dos novos produtos
INSERT IGNORE INTO produto_variacoes (produto_id, volume_ml, preco, estoque_qtd) VALUES
(18, 50, 750.00, 25),   (18, 100, 1100.00, 20),
(19, 50, 650.00, 30),   (19, 100, 950.00, 20),
(20, 50, 520.00, 40),   (20, 100, 780.00, 30),
(21, 75, 700.00, 25),   (21, 200, 1300.00, 15),
(22, 50, 480.00, 30),   (22, 100, 750.00, 20),
(23, 50, 620.00, 20),   (23, 100, 890.00, 15),
(24, 50, 380.00, 40),   (24, 100, 580.00, 30),
(25, 50, 550.00, 25),   (25, 100, 820.00, 20),
(26, 75, 410.00, 35),   (26, 150, 650.00, 20),
(27, 50, 340.00, 45),   (27, 100, 520.00, 35),
(28, 75, 2200.00, 10),  (28, 125, 3100.00, 5),
(29, 50, 2400.00, 8),   (29, 100, 3400.00, 5),
(30, 50, 1600.00, 12),  (30, 100, 2400.00, 8),
(31, 75, 900.00, 20),   (31, 150, 1400.00, 12),
(32, 50, 780.00, 25),   (32, 100, 1150.00, 15),
(33, 100, 850.00, 30),  (33, 200, 1400.00, 15),
(34, 75, 480.00, 50),   (34, 125, 720.00, 35),
(35, 75, 620.00, 30),   (35, 125, 950.00, 20),
(36, 50, 520.00, 35),   (36, 100, 780.00, 25),
(37, 50, 580.00, 40),   (37, 100, 890.00, 30),
(38, 50, 450.00, 60),   (38, 100, 680.00, 45),
(39, 50, 420.00, 40),   (39, 100, 630.00, 30),
(40, 100, 280.00, 50),  (40, 200, 430.00, 30);

-- Imagens dos novos produtos (reutilizando assets existentes por categoria/família)
INSERT IGNORE INTO imagens_produto (produto_id, url, ordem, principal) VALUES
(18, '/products/chanel_5.jpg',       1, TRUE),
(19, '/products/reflection_man.jpg', 1, TRUE),
(20, '/products/perfume_fresh.png',  1, TRUE),
(21, '/products/sauvage_dior.jpg',   1, TRUE),
(22, '/products/perfume_bleu.png',   1, TRUE),
(23, '/products/perfume_gold.png',   1, TRUE),
(24, '/products/perfume_fresh.png',  1, TRUE),
(25, '/products/chanel_5.jpg',       1, TRUE),
(26, '/products/verveine.jpg',       1, TRUE),
(27, '/products/verveine.jpg',       1, TRUE),
(28, '/products/perfume_wood.png',   1, TRUE),
(29, '/products/perfume_gold.png',   1, TRUE),
(30, '/products/perfume_wood.png',   1, TRUE),
(31, '/products/l_homme_ideal.jpg',  1, TRUE),
(32, '/products/layton.jpg',         1, TRUE),
(33, '/products/sauvage_dior.jpg',   1, TRUE),
(34, '/products/perfume_fresh.png',  1, TRUE),
(35, '/products/allure_sport.jpg',   1, TRUE),
(36, '/products/aqva_pour_homme.jpg',1, TRUE),
(37, '/products/perfume_fresh.png',  1, TRUE),
(38, '/products/aqva_pour_homme.jpg',1, TRUE),
(39, '/products/perfume_bleu.png',   1, TRUE),
(40, '/products/verveine.jpg',       1, TRUE);
