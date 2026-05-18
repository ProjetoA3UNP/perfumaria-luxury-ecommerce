const express = require("express");
const cors = require("cors");
const db = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

// Importações do Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../../docs/swagger.json");

// Montando a Página do Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", authMiddleware, cartRoutes);
app.use("/api/favorites", authMiddleware, favoriteRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/addresses", authMiddleware, addressRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "essence-api" });
});

// Nossa rota de ouro para testar o banco!
app.get("/test-db", async (_req, res) => {
    try {
        const [rows] = await db.query("SHOW TABLES;");
        res.json({
            status: "Banco Conectado! ✅",
            tabelas_no_banco: rows
        });
    } catch (error) {
        console.error("Erro no DB:", error);
        res.status(500).json({ error: "Ocorreu um erro ao conectar no MySQL." });
    }
});

module.exports = app;
