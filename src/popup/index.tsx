import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from '../context/authContext';
import Popup from './popup';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Popup />
    </AuthProvider>
  </React.StrictMode>
);