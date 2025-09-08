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
    // 极致性能优化配置
    rollupOptions: {
      output: {
        // 简化分包策略 - 减少chunk数量
        manualChunks: {
          // 核心库
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI库
          'ui': ['@radix-ui/react-slot', '@radix-ui/react-tooltip', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          // 工具库
          'utils': ['clsx', 'class-variance-authority', 'tailwind-merge', 'lucide-react']
        },
        // 优化文件名和哈希
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
      // 优化外部化
      external: (id) => {
        // 标记某些库为外部依赖以减少包大小
        return false; // 暂时不外部化，保持兼容性
      }
    },
    // 生产环境优化
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // 移除未使用的代码
        dead_code: true,
        // 内联函数
        inline: true,
        // 优化条件表达式
        conditionals: true,
        // 移除未使用的变量
        unused: true
      },
      mangle: {
        // 混淆变量名以减小体积
        safari10: true
      },
      format: {
        // 移除注释
        comments: false
      }
    } : undefined,
    // 优化chunk大小
    chunkSizeWarningLimit: 800,
    // CSS代码分割
    cssCodeSplit: true,
    // 启用gzip预压缩
    reportCompressedSize: true,
    // 优化sourcemap
    sourcemap: mode === 'development' ? true : false
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
