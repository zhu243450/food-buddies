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
        // 更精细的手动分包策略
        manualChunks: {
          // 核心React库 - 最高优先级
          'react-core': ['react', 'react-dom'],
          // 路由相关 - 单独分包
          'router': ['react-router-dom'],
          // Supabase - 数据库相关
          'supabase': ['@supabase/supabase-js'],
          // UI基础库 - 按功能分组
          'ui-base': [
            '@radix-ui/react-slot', 
            '@radix-ui/react-tooltip',
            '@radix-ui/react-separator'
          ],
          'ui-forms': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox'
          ],
          'ui-layout': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible'
          ],
          // 图标和工具
          'icons': ['lucide-react'],
          'utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
          // 日期和国际化
          'datetime': ['date-fns'],
          'i18n': ['react-i18next', 'i18next'],
          // 第三方重型库
          'charts': ['recharts'],
          'maps': ['leaflet']
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
