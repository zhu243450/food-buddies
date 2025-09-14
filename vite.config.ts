import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      strict: false
    }
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
    // 极致性能优化配置
    rollupOptions: {
      output: {
        // 极简分包策略 - 最小化HTTP请求
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'data': ['@tanstack/react-query', '@supabase/supabase-js'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'lucide-react']
        },
        // 简化文件名配置
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]'
      },
      // 优化外部化
      external: (id) => {
        // 标记某些库为外部依赖以减少包大小
        return false; // 暂时不外部化，保持兼容性
      }
    },
    // 生产环境优化
    minify: mode === 'production' ? 'esbuild' : false,
    // 修复MIME类型和性能配置
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    reportCompressedSize: false,
    sourcemap: false,
    assetsDir: 'assets'
  },
  // 预构建优化
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'react-i18next',
      'clsx',
      'tailwind-merge'
    ],
    // 强制预构建某些包
    force: false
  },
  // CSS优化
  css: {
    devSourcemap: mode === 'development',
    preprocessorOptions: {
      // 如果使用SCSS，可以在这里配置
    }
  },
  // 开发环境性能优化
  esbuild: {
    // 移除生产环境的console和debugger
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}));
