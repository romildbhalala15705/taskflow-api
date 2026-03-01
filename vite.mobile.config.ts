import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import fs from 'fs';

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'mobile-html-handler',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/' || req.url === '/index.html') {
                        req.url = '/mobile.html';
                    }
                    next();
                });
            },
            closeBundle() {
                const oldPath = path.resolve(__dirname, 'dist-mobile/mobile.html');
                const newPath = path.resolve(__dirname, 'dist-mobile/index.html');
                if (fs.existsSync(oldPath)) {
                    fs.renameSync(oldPath, newPath);
                }
            }
        }
    ],
    base: './', // Capacitor requires relative paths
    server: {
        host: true, // Listen on all local IPs
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5175',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist-mobile',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'mobile.html'),
            },
        },
    },
});
