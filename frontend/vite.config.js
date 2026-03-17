import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
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
                rewrite: function (p) { return p.replace(/^\/api/, '/iasms/api'); },
                configure: function (proxy) {
                    // Ensure POST body and multipart headers are forwarded (fixes file upload via proxy)
                    proxy.on('proxyReq', function (proxyReq, req) {
                        if (req.headers['content-type']) {
                            proxyReq.setHeader('Content-Type', req.headers['content-type']);
                        }
                        if (req.headers['content-length']) {
                            proxyReq.setHeader('Content-Length', req.headers['content-length']);
                        }
                    });
                },
            },
        },
    },
});
