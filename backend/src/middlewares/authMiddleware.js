const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido." });
    }

    // Espera formato "Bearer eyJhb..."
    const [, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_inseguro');
        
        // Pendura os dados do usuário na request para os próximos controles poderem usar
        req.user = decoded; 
        
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
}

module.exports = authMiddleware;
