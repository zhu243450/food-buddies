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
    // 极致性能配置
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false, // 减少HTTP请求
    reportCompressedSize: false, // 减少构建时间
    sourcemap: false
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
