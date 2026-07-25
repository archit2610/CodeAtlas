import jwt from 'jsonwebtoken';
import { User, findUserByEmail, getUserById } from '../models/user.model';

const JWT_SECRET = 'demo-secret-key';

export const authenticateUser = async (email: string, pass: string): Promise<string | null> => {
  const user = await findUserByEmail(email);
  if (!user || user.password !== pass) {
    return null;
  }
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
};

export const verifySessionToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const findUserById = async (id: string): Promise<User | null> => {
  return getUserById(id);
};
