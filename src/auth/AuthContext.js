import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the context with default values to avoid undefined errors
const AuthContext = createContext({
    user: null,
    token: null,
    loading: true,
    error: null,
    login: () => {},
    logout: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set up axios interceptor for JWT token
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            config => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [token]);

    // Load user when component mounts or token changes
    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get('http://127.0.0.1:8000/api/v1/me/');
                setUser(response.data);
                setError(null);
            } catch (err) {
                console.error('Error loading user:', err);
                if (err.response && err.response.status === 401) {
                    // Token expired or invalid
                    logout();
                }
                setError('Failed to load user information');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [token]);

    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await axios.post('http://127.0.0.1:8000/api/v1/token/', {
                username,
                password
            });

            const { access } = response.data;
            setToken(access);
            localStorage.setItem('token', access);

            // Load user information
            const userResponse = await axios.get('http://127.0.0.1:8000/api/v1/me/', {
                headers: { Authorization: `Bearer ${access}` }
            });
            setUser(userResponse.data);
            setError(null);
            return true;
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    // Make sure we're providing all the values
    const contextValue = {
        user,
        token,
        loading,
        error,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Make sure this is exported correctly
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};