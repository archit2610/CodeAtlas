"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const login = async (req, res) => {
    const { email, password } = req.body;
    const token = await (0, auth_service_1.authenticateUser)(email, password);
    if (!token) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({ success: true });
};
exports.login = login;
const logout = async (req, res) => {
    res.clearCookie('auth_token');
    return res.json({ success: true });
};
exports.logout = logout;
const getMe = async (req, res) => {
    const user = await (0, auth_service_1.findUserById)(req.userId);
    return res.json({ user });
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map