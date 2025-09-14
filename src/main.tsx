import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { CriticalCSS } from './components/CriticalCSS'
import { AuthProvider } from '@/contexts/AuthContext'

// 预加载关键资源
const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/fonts', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
  });
};

// 性能优化的资源加载
if (import.meta.env.PROD) {
  // 预加载关键资源
  requestIdleCallback(() => preloadCriticalResources());
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
      body{font-family:system-ui,sans-serif;background:hsl(280,15%,97%);color:hsl(230,15%,15%);line-height:1.5;-webkit-font-smoothing:antialiased}
      main{min-height:100vh;contain:layout}
      .loading-spinner{width:2rem;height:2rem;border:2px solid hsl(280,20%,92%);border-top:2px solid hsl(315,85%,60%);border-radius:50%;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(styleElement);
  }
}

// 性能优化的应用启动 - 延迟非关键任务
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  
  // 立即渲染应用
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
  
  // 延迟执行非关键任务
  if (import.meta.env.PROD) {
    // 清理内存垃圾 - 低优先级
    requestIdleCallback(() => {
      if (window.gc) window.gc();
    });
  }
} else {
  console.error('Root element not found');
}