import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import ui from "@nuxt/ui/vite";
import Icons from 'unplugin-icons/vite';
import { ExternalPackageIconLoader, FileSystemIconLoader } from 'unplugin-icons/loaders';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => false,
        },
      },
    }),
    Icons({
      autoInstall: true,
      compiler: 'vue3',
      customCollections: {
        ...ExternalPackageIconLoader('@iconify-json'),
        custom: FileSystemIconLoader('./src/assets/icons'),
      },
    }),
    tailwindcss(),
    ui(),
  ],
  
  optimizeDeps: {
    include: [
      '@nuxt/ui > prosemirror-state',
      '@nuxt/ui > prosemirror-transform',
      '@nuxt/ui > prosemirror-model',
      '@nuxt/ui > prosemirror-view',
      '@nuxt/ui > prosemirror-gapcursor',
      '@iconify-json/heroicons',
      '@iconify-json/lucide',
      '@iconify-json/mdi',
      '@iconify-json/vscode-icons',
    ],
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
