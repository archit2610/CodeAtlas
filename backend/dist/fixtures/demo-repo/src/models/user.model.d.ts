export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
}
export declare const findUserByEmail: (email: string) => Promise<User | null>;
export declare const getUserById: (id: string) => Promise<User | null>;
//# sourceMappingURL=user.model.d.ts.map