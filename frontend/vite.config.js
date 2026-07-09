import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v2.js`,
        chunkFileNames: `assets/[name]-[hash]-v2.js`,
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'react-vendor'
          }
          // jsPDF (e dependencias) so e usado sob demanda (botao de exportar
          // PDF) -- nao forcar pro chunk "vendor" carregado sempre, senao
          // perde o code-splitting do import() dinamico
          const pdfOnlyDeps = ['/jspdf', '/canvg/', '/dompurify/', '/fflate/', '/rgbcolor/', '/svg-pathdata/', '/core-js/', '/fast-png/']
          if (pdfOnlyDeps.some((dep) => id.includes(dep))) {
            return
          }
          return 'vendor'
        },
      }
    }
  }
})