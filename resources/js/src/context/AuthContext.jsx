import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginAuth, logoutAuth, meAuth, registerAuth } from '../services/api';

const TOKEN_KEY = 'sirius_auth_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function hydrate() {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await meAuth(token);
                setUser(currentUser);
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                setToken('');
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        hydrate();
    }, [token]);

    const value = useMemo(() => ({
        token,
        user,
        loading,
        isAdmin: String(user?.role || '').toLowerCase() === 'admin',
        async login(payload) {
            const result = await loginAuth(payload);
            localStorage.setItem(TOKEN_KEY, result.token);
            setToken(result.token);
            setUser(result.user);
            return result.user;
        },
        async register(payload) {
            const result = await registerAuth(payload);
            localStorage.setItem(TOKEN_KEY, result.token);
            setToken(result.token);
            setUser(result.user);
            return result.user;
        },
        async logout() {
            try {
                if (token) {
                    await logoutAuth(token);
                }
            } finally {
                localStorage.removeItem(TOKEN_KEY);
                setToken('');
                setUser(null);
            }
        },
    }), [token, user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}
