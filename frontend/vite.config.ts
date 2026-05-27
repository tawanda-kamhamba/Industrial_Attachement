import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/iasms/app/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/iasms/api'),
        configure: (proxy) => {
          // Ensure POST body and multipart headers are forwarded (fixes file upload via proxy)
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            if (req.headers['content-length']) {
              proxyReq.setHeader('Content-Length', req.headers['content-length']);
            }
          });
        },
      },
      // Static uploads & legacy paths live under /iasms on Apache; without this, :3000 serves the SPA (→ /login).
      '/iasms': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
});
