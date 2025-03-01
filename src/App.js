import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatApp from './ChatApp';
import LoginPage from './auth/LoginPage';
import { useAuth } from './auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Add Bootstrap Icons

// Add some global styles
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 vw-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" />;
    }

    return children;
};

const App = () => {
    return (
        // Removed the Router component that was here
        <div className="app-container">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <ChatApp />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="*"
                    element={
                        <ProtectedRoute>
                            <ChatApp />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
};

export default App;