import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 性能优化配置
    rollupOptions: {
      output: {
        // 手动分包，减少主包大小
        manualChunks: {
          // React相关库单独打包
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI组件库单独打包
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          // 工具库单独打包
          'utils-vendor': ['lucide-react', 'date-fns', 'clsx'],
          // Supabase相关单独打包
          'supabase-vendor': ['@supabase/supabase-js'],
          // 地图和图表相关
          'map-vendor': ['leaflet'],
          // 国际化相关
          'i18n-vendor': ['react-i18next', 'i18next']
        }
      }
    },
    // 启用gzip压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log'] : []
      }
    },
    // 优化chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // CSS代码分割
    cssCodeSplit: true
  },
  // 预构建依赖优化
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'react-i18next'
    ]
  },
  // 开发环境性能优化
  esbuild: {
    // 移除生产环境的console和debugger
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}));
