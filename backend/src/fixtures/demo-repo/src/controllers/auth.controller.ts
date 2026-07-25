import { Request, Response } from 'express';
import { authenticateUser, findUserById } from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const token = await authenticateUser(email, password);
  if (!token) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax' });
  return res.json({ success: true });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  return res.json({ success: true });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await findUserById((req as any).userId);
  return res.json({ user });
};
