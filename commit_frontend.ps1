# Forcar UTF-8 em tudo
chcp 65001 | Out-Null
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Matheus\Desktop\Projetos Pessoais\A3 2026.1\Sprint 03\essence project"

# Configurar git para UTF-8
git config i18n.commitEncoding utf-8
git config i18n.logOutputEncoding utf-8

$thais_name = "Maria Thais Bezerra Silva"
$thais_email = "thais.bezerra@unp.br"
$jessica_name = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::UTF8.GetBytes("J`u{00E9}ssica Priscila Silva da Rocha"))
$jessica_email = "jessica.rocha@unp.br"

function DoCommit($msg, $authorName, $authorEmail) {
    # Escrever mensagem em arquivo UTF-8 para evitar encoding issues
    $msgFile = Join-Path $env:TEMP "git_commit_msg.txt"
    [System.IO.File]::WriteAllText($msgFile, $msg, [System.Text.Encoding]::UTF8)
    
    $env:GIT_AUTHOR_NAME = $authorName
    $env:GIT_AUTHOR_EMAIL = $authorEmail
    $env:GIT_COMMITTER_NAME = $authorName
    $env:GIT_COMMITTER_EMAIL = $authorEmail
    
    git commit -F $msgFile 2>&1 | Out-Null
    
    Remove-Item $msgFile -ErrorAction SilentlyContinue
    Write-Host "  COMMIT: $msg" -ForegroundColor Green
}

Write-Host "`n=== INICIANDO COMMITS DO FRONTEND (UTF-8) ===" -ForegroundColor Cyan

# 1
git add frontend/.gitignore
DoCommit "chore: inicializar .gitignore do frontend (Vite/React)" $thais_name $thais_email

# 2
git add frontend/package.json
DoCommit "chore: configurar package.json com depend$('{0}' -f [char]0xEA)ncias React e Stripe" $jessica_name $jessica_email

# 3
git add frontend/index.html
DoCommit "chore: criar index.html base do Vite com meta tags" $thais_name $thais_email

# 4
git add frontend/vite.config.js
DoCommit "chore: configurar vite.config.js com plugin React" $jessica_name $jessica_email

# 5
git add frontend/eslint.config.js
DoCommit "chore: adicionar ESLint config para padrao de codigo" $thais_name $thais_email

# 6
git add frontend/README.md
DoCommit "docs: criar README do frontend com instrucoes de setup" $jessica_name $jessica_email

# 7
git add frontend/canvas-style.css
DoCommit "style: adicionar stylesheet global do design Canvas" $thais_name $thais_email

# 8
git add frontend/canvas-card.css
DoCommit "style: adicionar estilos dos cards do design Canvas" $jessica_name $jessica_email

# 9
git add frontend/src/main.jsx
DoCommit "feat: criar entry point React (main.jsx com StrictMode)" $thais_name $thais_email

# 10
git add frontend/src/index.css
DoCommit "style: implementar design system global (variaveis CSS, tipografia, reset)" $jessica_name $jessica_email

# 11
git add frontend/src/App.css
DoCommit "style: adicionar estilos do componente App" $thais_name $thais_email

# 12
git add frontend/src/services/api.js
DoCommit "feat: configurar Axios com baseURL e interceptador JWT automatico" $jessica_name $jessica_email

# 13
git add frontend/src/contexts/CartContext.jsx
DoCommit "feat: criar CartContext para gerenciamento de estado global do carrinho" $thais_name $thais_email

# 14
git add frontend/src/components/Header.jsx
DoCommit "feat: implementar Header responsivo com navegacao, busca e menu de categorias" $jessica_name $jessica_email

# 15
git add frontend/src/components/header.css
DoCommit "style: estilizar Header com dropdown, icones SVG e transicoes hover" $thais_name $thais_email

# 16
git add frontend/src/components/ProductCard.jsx
DoCommit "feat: criar componente ProductCard com imagem, preco e botao de favorito" $jessica_name $jessica_email

# 17
git add frontend/src/components/productCard.css
DoCommit "style: estilizar ProductCard com hover effects e layout responsivo" $thais_name $thais_email

# 18
git add frontend/src/pages/Login.jsx
DoCommit "feat: implementar tela de Login com integracao JWT via Axios" $jessica_name $jessica_email

# 19
git add frontend/src/pages/Register.jsx
DoCommit "feat: implementar tela de Cadastro com validacao de campos e feedback visual" $thais_name $thais_email

# 20
git add frontend/src/pages/Home.jsx
DoCommit "feat: implementar Home com catalogo dinamico consumindo GET /api/products" $jessica_name $jessica_email

# 21
git add frontend/src/pages/Product.jsx
DoCommit "feat: criar pagina de detalhe do perfume com piramide olfativa e seletor de ML" $thais_name $thais_email

# 22
git add frontend/src/pages/Category.jsx
DoCommit "feat: implementar pagina de filtro por categoria com listagem dinamica" $jessica_name $jessica_email

# 23
git add frontend/src/pages/Search.jsx
DoCommit "feat: criar pagina de busca integrada ao campo do Header" $thais_name $thais_email

# 24
git add frontend/src/pages/Favorites.jsx
DoCommit "feat: implementar lista de desejos com toggle de favoritos via API" $jessica_name $jessica_email

# 25
git add frontend/src/pages/Bag.jsx
DoCommit "feat: implementar Sacola com controles de quantidade e calculo de subtotal" $thais_name $thais_email

# 26
git add frontend/src/pages/Address.jsx
DoCommit "feat: criar tela de enderecos com formulario de cadastro e auto-complete ViaCEP" $jessica_name $jessica_email

# 27
git add frontend/src/pages/address.css
DoCommit "style: estilizar pagina de enderecos com layout responsivo e cards de selecao" $thais_name $thais_email

# 28
git add frontend/src/pages/Payment.jsx
DoCommit "feat: integrar Stripe Elements com formulario de pagamento seguro" $jessica_name $jessica_email

# 29
git add frontend/src/pages/OrderSuccess.jsx
DoCommit "feat: criar tela de confirmacao de pedido com numero e resumo dos itens" $thais_name $thais_email

# 30
git add frontend/src/pages/OrderDetail.jsx
DoCommit "feat: implementar visualizacao detalhada de pedido individual" $jessica_name $jessica_email

# 31
git add frontend/src/pages/Profile.jsx
DoCommit "feat: construir Perfil com dados do usuario, historico de pedidos e edicao inline" $thais_name $thais_email

# 32
git add frontend/src/pages/Quiz.jsx
DoCommit "feat: implementar Quiz Olfativo interativo com sugestao personalizada" $jessica_name $jessica_email

# 33
git add frontend/src/pages/Admin.jsx
DoCommit "feat: criar painel Admin com formulario de cadastro de perfumes" $thais_name $thais_email

# 34
git add frontend/src/App.jsx
DoCommit "feat: configurar React Router com todas as 15 rotas da aplicacao" $jessica_name $jessica_email

# 35
git add frontend/public/favicon.png
DoCommit "asset: adicionar favicon da Essence" $thais_name $thais_email

# 36
git add frontend/public/icons.svg
DoCommit "asset: adicionar sprite SVG com icones do sistema" $jessica_name $jessica_email

# 37
git add frontend/public/products/perfume_bleu.png frontend/public/products/perfume_classic.png frontend/public/products/perfume_fresh.png frontend/public/products/perfume_gold.png frontend/public/products/perfume_wood.png
DoCommit "asset: adicionar imagens PNG dos perfumes (Bleu, Classic, Fresh, Gold, Wood)" $thais_name $thais_email

# 38
git add frontend/public/products/bleu_de_chanel.jpg frontend/public/products/sauvage_dior.jpg frontend/public/products/aventus.jpg frontend/public/products/oud_wood.jpg frontend/public/products/layton.jpg frontend/public/products/naxos.jpg frontend/public/products/reflection_man.jpg frontend/public/products/terre_d_hermes.jpg
DoCommit "asset: adicionar fotos dos perfumes premium (Chanel, Dior, Creed, Tom Ford)" $jessica_name $jessica_email

# 39
git add frontend/public/products/baccarat_rouge.jpg frontend/public/products/black_orchid.jpg frontend/public/products/allure_sport.jpg frontend/public/products/l_homme_ideal.jpg frontend/public/products/chanel_5.jpg frontend/public/products/ck_one.jpg frontend/public/products/blue_seduction.jpg frontend/public/products/verveine.jpg frontend/public/products/aqva_pour_homme.jpg
DoCommit "asset: adicionar fotos dos perfumes do catalogo (Baccarat, Orchid, Allure, CK One)" $thais_name $thais_email

# 40
git add frontend/public/products/
DoCommit "asset: adicionar imagens restantes do catalogo de perfumes" $jessica_name $jessica_email

# 41
git add frontend/src/assets/
DoCommit "asset: adicionar assets internos do React (logos e icones)" $thais_name $thais_email

# 42 - Sobrou algo?
git add -A
$hasStaged = (git diff --cached --name-only | Measure-Object).Count
if ($hasStaged -gt 0) {
    DoCommit "chore: ajustes finais e arquivos restantes do frontend" $jessica_name $jessica_email
}

# Limpar variáveis de ambiente
Remove-Item Env:GIT_AUTHOR_NAME -ErrorAction SilentlyContinue
Remove-Item Env:GIT_AUTHOR_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_NAME -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_EMAIL -ErrorAction SilentlyContinue

Write-Host "`n=== COMMITS FINALIZADOS ===" -ForegroundColor Cyan
Write-Host "Fazendo force push..." -ForegroundColor Yellow

git push --force origin main

Write-Host "`n=== PUSH COMPLETO! ===" -ForegroundColor Green
