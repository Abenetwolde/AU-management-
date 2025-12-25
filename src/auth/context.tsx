import { createContext, useContext, useState, ReactNode } from 'react';

export enum UserRole {
    EMA_OFFICER = 'EMA_OFFICER',
    STAKEHOLDER = 'STAKEHOLDER',
    SUPER_ADMIN = 'SUPER_ADMIN',
    ICS_OFFICER = 'ICS_OFFICER',
    NISS_OFFICER = 'NISS_OFFICER',
    INSA_OFFICER = 'INSA_OFFICER',
    CUSTOMS_OFFICER = 'CUSTOMS_OFFICER',
    AU_ADMIN = 'AU_ADMIN',
    IMMIGRATION_OFFICER = 'IMMIGRATION_OFFICER',
    MEDIA_EQUIPMENT_VERIFIER = 'MEDIA_EQUIPMENT_VERIFIER',
    DRONE_CLEARANCE_OFFICER = 'DRONE_CLEARANCE_OFFICER'
}

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    gate?: string;
    permissions?: any[]; // For storing API permissions
}

interface AuthContextType {
    user: User | null;
    login: (email: string, role: UserRole, permissions?: any[], fullName?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'managment_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = (email: string, role: UserRole, permissions: any[] = [], fullName: string = 'Officer Sara Kamil') => {
        // Use provided name/permissions if available (from API), otherwise default
        const newUser: User = {
            id: '1234-AU',
            name: fullName,
            email,
            role,
            gate: 'GATE 1',
            permissions
        };
        setUser(newUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        // Also remove the token
        localStorage.removeItem('managment_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
