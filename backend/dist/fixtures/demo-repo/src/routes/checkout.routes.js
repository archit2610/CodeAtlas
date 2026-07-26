"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutRouter = void 0;
const express_1 = require("express");
const checkout_controller_1 = require("../controllers/checkout.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.checkoutRouter = (0, express_1.Router)();
exports.checkoutRouter.post('/process', auth_middleware_1.requireAuth, checkout_controller_1.processCheckout);
//# sourceMappingURL=checkout.routes.js.map