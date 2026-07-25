import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../services/auth.service';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  (req as any).userId = payload.userId;
  next();
};
