import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { GUEST_COOKIE_NAME } from '../services/conversation.service.js';

declare global {
    namespace Express {
        interface Request {
            guestTempId?: string;
        }
    }
}

export const guestSessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    let tempId = req.headers['x-guest-temp-id'] as string || req.cookies?.[GUEST_COOKIE_NAME];

    if (!tempId) {
        tempId = `guest_${crypto.randomUUID()}`;
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie(GUEST_COOKIE_NAME, tempId, {
            httpOnly: true,
            secure: isProd,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: isProd ? 'none' : 'lax',
        });
    }

    req.guestTempId = tempId;
    next();
};
