import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatApp from './ChatApp'; // Adjust path as needed
import LoginPage from './auth/LoginPage';
import { useAuth } from './auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div className="container-fluid bg-light py-4 min-vh-100 d-flex justify-content-center align-items-center">
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
    );
};

export default App;