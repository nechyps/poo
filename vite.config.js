import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.PNG', '**/*.wasm'],
  optimizeDeps: {
    exclude: ['sql.js'],
    include: ['sql.js/dist/sql-wasm.js']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  resolve: {
    alias: {
      // Убеждаемся, что sql.js правильно разрешается
    }
  },
  build: {
    commonjsOptions: {
      include: [/sql.js/, /node_modules/]
    }
  }
})

