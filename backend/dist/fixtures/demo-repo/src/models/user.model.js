"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.findUserByEmail = void 0;
const mockUsers = [
    { id: 'usr_1', email: 'demo@codeatlas.dev', password: 'password123', name: 'Demo User' }
];
const findUserByEmail = async (email) => {
    return mockUsers.find(u => u.email === email) ?? null;
};
exports.findUserByEmail = findUserByEmail;
const getUserById = async (id) => {
    return mockUsers.find(u => u.id === id) ?? null;
};
exports.getUserById = getUserById;
//# sourceMappingURL=user.model.js.map