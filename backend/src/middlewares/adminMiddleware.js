const jwt = require('jsonwebtoken');

/**
 * Middleware de autorização para rotas administrativas.
 * Deve ser usado APÓS o authMiddleware (que já decodifica o token).
 * Verifica se o usuário logado possui tipo_perfil === 'admin'.
 */
function adminMiddleware(req, res, next) {
    // Se o authMiddleware já rodou, req.user contém { id, tipo_perfil }
    if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (req.user.tipo_perfil?.toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }

    return next();
}

module.exports = adminMiddleware;
