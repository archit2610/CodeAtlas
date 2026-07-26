export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}
export declare const executePayment: (userId: string, amount: number, paymentMethodId: string) => Promise<PaymentResult>;
//# sourceMappingURL=payment.service.d.ts.map