import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthPage from './authPage';
import './auth.css';

ReactDOM.createRoot(document.getElementById('auth-root')!).render(
  <React.StrictMode>
    <AuthPage />
  </React.StrictMode>
);