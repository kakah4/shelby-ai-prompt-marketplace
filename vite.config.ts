import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-telegram-bridge',
      resolveId(id) {
        if (id === '@telegram-apps/bridge') return id
      },
      load(id) {
        if (id === '@telegram-apps/bridge') return `
          export const postEvent = () => {};
          export const on = () => {};
          export const off = () => {};
          export const retrieveLaunchParams = () => ({});
          export default {};
        `
      },
    },
  ],
})
