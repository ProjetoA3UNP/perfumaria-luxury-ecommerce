const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const db = require("./config/database");

const app = express();

// ===== SEGURANÇA: Helmet (Cabeçalhos HTTP seguros) =====
// Protege contra XSS, Clickjacking, MIME Sniffing, etc.
app.use(helmet());

app.use(cors());
app.use(express.json());

// ===== SEGURANÇA: Rate Limiting no Login =====
// Máximo 5 tentativas por IP a cada 15 minutos (Sprint 07 - AV3)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // 5 tentativas por IP
  standardHeaders: true,     // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false,      // Desabilita headers `X-RateLimit-*` antigos
  message: {
    error: "Muitas tentativas de login. Por segurança, tente novamente após 15 minutos."
  }
});

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const couponRoutes = require("./routes/couponRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

// Importações do Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../../docs/swagger.json");

// Montando a Página do Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth/login", loginLimiter);  // Rate limit APENAS no login
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", authMiddleware, cartRoutes);
app.use("/api/favorites", authMiddleware, favoriteRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/addresses", authMiddleware, addressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/coupons", authMiddleware, couponRoutes);
app.use("/api/reviews", reviewRoutes);

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
