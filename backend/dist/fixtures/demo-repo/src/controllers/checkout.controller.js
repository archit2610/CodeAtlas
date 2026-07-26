"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCheckout = void 0;
const payment_service_1 = require("../services/payment.service");
const processCheckout = async (req, res) => {
    const { amount, paymentMethodId } = req.body;
    const userId = req.userId;
    const result = await (0, payment_service_1.executePayment)(userId, amount, paymentMethodId);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    // BUG DETECTED: Post-checkout session cleanup clears the authentication cookie by mistake!
    // It should clear 'cart_session', but clears 'auth_token' instead.
    res.clearCookie('auth_token');
    return res.json({
        success: true,
        transactionId: result.transactionId,
        message: 'Order completed successfully'
    });
};
exports.processCheckout = processCheckout;
//# sourceMappingURL=checkout.controller.js.map