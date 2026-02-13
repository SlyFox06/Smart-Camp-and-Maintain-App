import { createContext } from 'react';
import type { User, RegisterFormData } from '../types';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<User>;
    registerStudent: (data: RegisterFormData) => Promise<User>;
    logout: () => void;
    isLoading: boolean;
    updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
