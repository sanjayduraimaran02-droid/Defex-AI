import { createLogger, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom logger to suppress repeated proxy ECONNREFUSED terminal noise when backend is offline
const logger = createLogger();
const originalLoggerError = logger.error;
logger.error = (msg, options) => {
  if (
    typeof msg === 'string' &&
    (msg.includes('http proxy error') || msg.includes('ECONNREFUSED') || msg.includes('offline_fallback'))
  ) {
    return;
  }
  originalLoggerError(msg, options);
};

// https://vite.dev/config/
export default defineConfig({
  base: './',
  customLogger: logger,
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Intercept proxy error and respond with 503 JSON without crashing process
            const sRes = res as any;
            if (sRes && !sRes.headersSent && typeof sRes.writeHead === 'function') {
              sRes.writeHead(503, { 'Content-Type': 'application/json' });
              sRes.end(JSON.stringify({
                error: 'Backend service unreachable',
                detail: err.message,
                offline_fallback: true
              }));
            }
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const sRes = res as any;
            if (sRes && !sRes.headersSent && typeof sRes.writeHead === 'function') {
              sRes.writeHead(404, { 'Content-Type': 'text/plain' });
              sRes.end('Static asset offline');
            }
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
