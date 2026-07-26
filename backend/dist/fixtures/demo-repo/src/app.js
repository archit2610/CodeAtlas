"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = require("./routes/auth.routes");
const checkout_routes_1 = require("./routes/checkout.routes");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_routes_1.authRouter);
app.use('/api/checkout', checkout_routes_1.checkoutRouter);
exports.default = app;
//# sourceMappingURL=app.js.map