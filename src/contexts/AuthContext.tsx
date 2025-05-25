import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    role: string;
    baseId?: number;
}

interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    user: User | null;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
    user: null
});



export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setIsAuthenticated(true);
                setUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse user data:', e);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
            }
        }
    }, []);


    const login = (token: string, user: User) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setIsAuthenticated(true);
        setUser(user);
        
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
