import { Request, Response } from 'express';
import { executePayment } from '../services/payment.service';

export const processCheckout = async (req: Request, res: Response) => {
  const { amount, paymentMethodId } = req.body;
  const userId = (req as any).userId;

  const result = await executePayment(userId, amount, paymentMethodId);
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
