"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePayment = void 0;
const executePayment = async (userId, amount, paymentMethodId) => {
    if (!amount || amount <= 0) {
        return { success: false, error: 'Invalid payment amount' };
    }
    return {
        success: true,
        transactionId: `tx_${Date.now()}_${userId.slice(0, 4)}`
    };
};
exports.executePayment = executePayment;
//# sourceMappingURL=payment.service.js.map