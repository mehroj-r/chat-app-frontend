// index.js (your application entry point)
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import App from './App'; // Import App instead of ChatApp
import 'bootstrap/dist/css/bootstrap.min.css'; // Make sure Bootstrap is imported here

const root = createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <AuthProvider>
                <App />
            </AuthProvider>
        </Router>
    </React.StrictMode>
);