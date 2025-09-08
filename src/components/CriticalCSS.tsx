import React from 'react';

// 内联关键CSS以减少首次绘制时间
export const CriticalCSS: React.FC = () => {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Critical CSS - 首屏渲染必需样式 */
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
          background-color: hsl(280, 15%, 97%);
          color: hsl(230, 15%, 15%);
        }
        
        /* 导航栏关键样式 */
        nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }
        
        /* 主要内容区域 */
        main {
          min-height: 100vh;
          contain: layout style;
        }
        
        /* 关键按钮样式 */
        .btn-primary {
          background: linear-gradient(135deg, hsl(315, 85%, 60%), hsl(25, 95%, 65%));
          color: hsl(0, 0%, 98%);
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
        }
        
        /* 防止布局偏移 */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        /* 图片占位符 */
        .img-placeholder {
          background: hsl(280, 20%, 92%);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(230, 25%, 45%);
        }
        
        /* 加载动画 */
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
        
        /* 响应式隐藏 */
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none;
          }
        }
        
        /* 性能优化 */
        * {
          box-sizing: border-box;
        }
        
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* 减少重绘 */
        .gpu-layer {
          transform: translateZ(0);
          will-change: transform;
        }
      `
    }} />
  );
};