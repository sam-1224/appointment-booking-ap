import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        token: localStorage.getItem('token') || null,
        role: localStorage.getItem('role') || null,
    });

    useEffect(() => {
        if (auth.token) {
            // Set the auth token for all future API requests
            api.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
            localStorage.setItem('token', auth.token);
            localStorage.setItem('role', auth.role);
        } else {
            delete api.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            localStorage.removeItem('role');
        }
    }, [auth.token]);

    const login = (token, role) => {
        setAuth({ token, role });
    };

    const logout = () => {
        setAuth({ token: null, role: null });
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};