"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = exports.verifySessionToken = exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const JWT_SECRET = 'demo-secret-key';
const authenticateUser = async (email, pass) => {
    const user = await (0, user_model_1.findUserByEmail)(email);
    if (!user || user.password !== pass) {
        return null;
    }
    return jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
};
exports.authenticateUser = authenticateUser;
const verifySessionToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifySessionToken = verifySessionToken;
const findUserById = async (id) => {
    return (0, user_model_1.getUserById)(id);
};
exports.findUserById = findUserById;
//# sourceMappingURL=auth.service.js.map