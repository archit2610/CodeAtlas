import { User } from '../models/user.model';
export declare const authenticateUser: (email: string, pass: string) => Promise<string | null>;
export declare const verifySessionToken: (token: string) => {
    userId: string;
} | null;
export declare const findUserById: (id: string) => Promise<User | null>;
//# sourceMappingURL=auth.service.d.ts.map