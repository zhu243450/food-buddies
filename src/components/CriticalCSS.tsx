import React from 'react';

// 高性能内联关键CSS - 优化FCP和LCP
export const CriticalCSS: React.FC = () => {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
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
        
        /* 导航栏关键样式 - 固定高度防止CLS */
        nav {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          contain: layout style paint;
        }
        
        /* 卡片容器优化 - 防止CLS */
        .dinner-card-container {
          height: 280px;
          contain: strict;
          will-change: auto;
        }
        
        /* 图片优化 - 防止CLS */
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
        
        /* 骨架屏优化 - 无动画减少重绘 */
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
      `
    }} />
  );
};