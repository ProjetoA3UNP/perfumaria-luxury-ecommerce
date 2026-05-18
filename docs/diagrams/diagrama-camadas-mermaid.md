# Diagrama de Arquitetura em Camadas - ESSENCE

```mermaid
flowchart TD
    U["Cliente / Navegador"]

    subgraph L1["Camada de Apresentação"]
        FE["Frontend React\nPages, Components, Routes\nTailwind CSS"]
    end

    subgraph L2["Camada de Aplicação / API"]
        API["Backend Node.js / Express\nRoutes\nControllers\nMiddlewares"]
    end

    subgraph L3["Camada de Negócio"]
        SVC["Services\nAutenticação\nCatálogo\nCarrinho\nCheckout\nPedidos"]
    end

    subgraph L4["Camada de Dados"]
        REPO["Repositories / Models"]
        DB["Banco de Dados MySQL"]
    end

    subgraph L5["Serviços Externos"]
        STRIPEJS["Stripe.js no Frontend\nTokenização"]
        STRIPEAPI["Stripe API\nSandbox"]
    end

    U --> FE
    FE --> API
    API --> SVC
    SVC --> REPO
    REPO --> DB

    FE --> STRIPEJS
    STRIPEJS --> STRIPEAPI
    API --> STRIPEAPI
```

## Leitura rápida

- O cliente interage com o `Frontend React`.
- O frontend consome a `API em Node.js/Express`.
- A API delega as regras para a `camada de negócio`.
- A camada de negócio acessa a `camada de dados`, que persiste no `MySQL`.
- No pagamento, o cartão é tokenizado pelo `Stripe.js` no frontend e o backend conversa com a `Stripe API` usando o token seguro.
