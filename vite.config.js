import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // VITE_BASE lets the dev-preview deploy build with an absolute base path
  // matching its GitHub Pages subpath (e.g. /sat-lab-dev/), per the project's
  // push workflow. Falls back to the existing relative-path default, which is
  // what main has always used and needs no per-repo configuration.
  base: process.env.VITE_BASE || './',
  plugins: [react(), tailwindcss()],
})
