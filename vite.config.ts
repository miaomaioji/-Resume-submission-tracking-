/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// 本地开发用根路径;构建时用 GitHub Pages 项目子路径(= 仓库名)
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/-Resume-submission-tracking-/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '简历投递管理',
        short_name: '投递管理',
        description: '本地优先的简历投递与面试管理工具',
        lang: 'zh-CN',
        theme_color: '#1E293B',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    globals: true,
  },
}))
