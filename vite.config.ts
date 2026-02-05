import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
          theme: {
            extend: {
              colors: {
                primary: {
                  50: '#f0f9ff',
                  100: '#e0f2fe',
                  200: '#bae6fd',
                  300: '#7dd3fc',
                  400: '#38bdf8',
                  500: '#0ea5e9',
                  600: '#0284c7',
                  700: '#0369a1',
                  800: '#075985',
                  900: '#0c4a6e',
                },
                success: {
                  500: '#10b981',
                  600: '#059669',
                },
                warning: {
                  500: '#f59e0b',
                  600: '#d97706',
                },
                danger: {
                  500: '#ef4444',
                  600: '#dc2626',
                },
              },
            },
          },
        }),
        autoprefixer,
      ],
    },
  },
})
