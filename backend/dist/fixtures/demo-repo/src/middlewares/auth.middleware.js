"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const auth_service_1 = require("../services/auth.service");
const requireAuth = (req, res, next) => {
    const token = req.cookies?.auth_token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Session missing' });
    }
    const payload = (0, auth_service_1.verifySessionToken)(token);
    if (!payload) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    req.userId = payload.userId;
    next();
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.middleware.js.map