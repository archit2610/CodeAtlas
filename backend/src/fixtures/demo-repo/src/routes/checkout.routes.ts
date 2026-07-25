import { Router } from 'express';
import { processCheckout } from '../controllers/checkout.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const checkoutRouter = Router();

checkoutRouter.post('/process', requireAuth, processCheckout);
