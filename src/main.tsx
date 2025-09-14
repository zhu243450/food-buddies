import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from '@/contexts/AuthContext';

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
} else {
  console.error('Root element not found');
}