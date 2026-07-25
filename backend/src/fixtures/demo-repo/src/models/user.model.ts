export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
}

const mockUsers: User[] = [
  { id: 'usr_1', email: 'demo@codeatlas.dev', password: 'password123', name: 'Demo User' }
];

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return mockUsers.find(u => u.email === email) ?? null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  return mockUsers.find(u => u.id === id) ?? null;
};
