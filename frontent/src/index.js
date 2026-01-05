import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// 1. On importe le fournisseur Google
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. On enveloppe l'application avec le fournisseur Google */}
    {/* Remplacez "VOTRE_CLIENT_ID" par votre ID réel plus tard */}
    <GoogleOAuthProvider clientId="123456789-votreid.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

reportWebVitals();