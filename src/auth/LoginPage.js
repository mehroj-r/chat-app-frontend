import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login, error, token } = useAuth();
    const navigate = useNavigate();

    // Check if already logged in
    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;

        setIsLoggingIn(true);
        const success = await login(username, password);
        setIsLoggingIn(false);

        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="container-fluid bg-light py-5 min-vh-100 d-flex justify-content-center align-items-center">
            <div className="card shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="card-body p-5">
                    <h2 className="text-center mb-4">Chat App Login</h2>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Logging in...
                                </>
                            ) : 'Log In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;