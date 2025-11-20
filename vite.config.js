import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or whatever framework
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/cst-airfoil-visualiser/',
  plugins: [react(), tailwindcss()],
})