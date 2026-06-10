# Documentação de Relatórios e Métricas (Dashboard)

Este documento descreve os indicadores de desempenho (KPIs), gráficos e relatórios disponibilizados no Painel de Controle (Dashboard) Administrativo do **Essence E-commerce**, gerados em tempo real a partir dos dados consolidados no banco de dados.

## 1. Indicadores Chave de Desempenho (KPIs)
O painel superior do Dashboard exibe as métricas de saúde financeira e operacional do negócio:

*   **Faturamento Total:** Soma do `valor_total` de todas as vendas cujo status represente pagamento confirmado (`PAGO`, `PROCESSANDO`, `ENVIADO`, `ENTREGUE`).
*   **Ticket Médio:** O valor médio gasto por compra. Calculado dividindo o Faturamento Total pelo número de pedidos confirmados (`AVG(valor_total)`).
*   **Total de Pedidos:** A volumetria absoluta de compras realizadas na plataforma.
*   **Total de Clientes:** A base de usuários cadastrados com a role `CLIENTE`.
*   **Produtos e Estoque:** Contagem de produtos únicos ativos e a soma volumétrica de todos os frascos físicos em estoque.

## 2. Relatórios Gráficos (Data Visualization)
A interface utiliza a biblioteca Chart.js para renderizar relatórios analíticos:

*   **Evolução de Vendas por Mês (Gráfico de Barras):** 
    - **Objetivo:** Analisar a sazonalidade.
    - **Dados Exibidos:** Faturamento (R$) agrupado por mês (`%Y-%m`) considerando os últimos 12 meses de operação.
*   **Distribuição de Status de Pedidos (Gráfico de Rosca/Doughnut):**
    - **Objetivo:** Identificar gargalos logísticos.
    - **Dados Exibidos:** Proporção percentual de pedidos que estão *Aguardando Pagamento*, *Processando*, *Enviados*, *Entregues* ou *Cancelados*.
*   **Top 5 Categorias mais Vendidas (Gráfico de Barras Horizontal):**
    - **Objetivo:** Direcionar o esforço de marketing.
    - **Dados Exibidos:** Soma da `quantidade` de itens vendidos em cada categoria.

## 3. Relatórios Tabulares (Data Tables)
O dashboard conta com relatórios descritivos em formato de tabela para gestão tática:

*   **Ranking de Produtos Mais Vendidos (Top 10):**
    - Exibe o Nome do Perfume, a Marca e a quantidade de unidades vendidas. Usado para reabastecimento.
*   **Relatório de Produtos Favoritados (Wishlist):**
    - Exibe os 10 produtos que os clientes mais salvaram na Lista de Desejos. Fundamental para planejar promoções ou e-mail marketing (remarketing).
*   **Relatório de Alerta de Estoque Baixo:**
    - Exibe exclusivamente as variações de produtos que possuem 5 ou menos unidades em estoque, funcionando como um aviso para o setor de compras.
*   **Acompanhamento de Pedidos Recentes:**
    - Visão em tempo real das últimas 10 transações, mostrando Número do Pedido, Cliente, Forma de Pagamento e Status.
*   **Logs do Sistema:**
    - Registro de auditoria sobre alterações de produtos e atualizações de status.
