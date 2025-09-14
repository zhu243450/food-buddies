import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { CriticalCSS } from './components/CriticalCSS'
import { AuthProvider } from '@/contexts/AuthContext'

// 清理无效缓存和预加载优化
if (import.meta.env.PROD) {
  // 清理可能的缓存问题
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('vite') || name.includes('workbox')) {
          caches.delete(name);
        }
      });
    });
  }
}

// 极简关键CSS - 只包含防FOUC的核心样式
if (typeof document !== 'undefined') {
  const existingCriticalCSS = document.querySelector('[data-critical-css]');
  if (!existingCriticalCSS) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-critical-css', 'true');
    styleElement.textContent = `
      *{box-sizing:border-box;margin:0;padding:0}
      html{scroll-behavior:smooth}
      body{font-family:system-ui,sans-serif;background:hsl(280,15%,97%);color:hsl(230,15%,15%);line-height:1.5}
      main{min-height:100vh}
      .loading-spinner{width:2rem;height:2rem;border:2px solid hsl(280,20%,92%);border-top:2px solid hsl(315,85%,60%);border-radius:50%;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(styleElement);
  }
}

// 应用启动
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