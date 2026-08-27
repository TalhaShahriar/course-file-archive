import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId="1039898746403-9lbjvhopbvgdk6hggccu92qibffh1bej.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}
