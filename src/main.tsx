import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { CriticalCSS } from './components/CriticalCSS'
import { AuthProvider } from '@/contexts/AuthContext'

// 注册Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 静默失败，不影响应用功能
    });
  });
}

// 注入关键CSS到document head，避免StrictMode干扰
if (typeof document !== 'undefined') {
  const existingCriticalCSS = document.querySelector('[data-critical-css]');
  if (!existingCriticalCSS) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-critical-css', 'true');
    styleElement.textContent = `
      /* 防止FOUC和布局偏移的最重要样式 */
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
      }
      
      html { 
        scroll-behavior: smooth;
        -webkit-text-size-adjust: 100%;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        background-color: hsl(280, 15%, 97%);
        color: hsl(230, 15%, 15%);
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeSpeed;
      }
      
      /* 关键容器 - 防止CLS */
      main {
        min-height: 100vh;
        contain: layout style paint;
      }
      
      /* 导航栏关键样式 */
      nav {
        position: sticky;
        top: 0;
        z-index: 50;
        height: 64px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        contain: layout style paint;
      }
      
      /* 卡片容器优化 */
      .dinner-card-container {
        height: 280px;
        contain: strict;
        will-change: auto;
      }
      
      /* 图片优化 */
      img {
        max-width: 100%;
        height: auto;
        background: hsl(280, 20%, 92%);
        contain: layout style paint;
      }
      
      /* 按钮基础优化 */
      button {
        cursor: pointer;
        user-select: none;
        contain: layout style paint;
        transform: translateZ(0);
      }
      
      /* 骨架屏优化 */
      .skeleton {
        background: hsl(280, 20%, 92%);
        border-radius: 0.5rem;
        contain: strict;
      }
      
      /* 关键加载状态 */
      .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid hsl(280, 20%, 92%);
        border-top: 2px solid hsl(315, 85%, 60%);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
  }
}

// 性能优化的应用启动
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