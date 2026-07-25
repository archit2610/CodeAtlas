export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const executePayment = async (
  userId: string,
  amount: number,
  paymentMethodId: string
): Promise<PaymentResult> => {
  if (!amount || amount <= 0) {
    return { success: false, error: 'Invalid payment amount' };
  }
  return {
    success: true,
    transactionId: `tx_${Date.now()}_${userId.slice(0, 4)}`
  };
};
