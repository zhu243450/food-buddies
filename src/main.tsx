import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { CriticalCSS } from './components/CriticalCSS'

// 注册Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 静默失败，不影响应用功能
    });
  });
}

// 性能优化的应用启动
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <CriticalCSS />
      <App />
    </StrictMode>
  );
} else {
  console.error('Root element not found');
}