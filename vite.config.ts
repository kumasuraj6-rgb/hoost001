import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {handleApiRequest} from './src/server/apiHandler';

function apiServerPlugin(): Plugin {
  const middleware = async (req: any, res: any, next: any) => {
    const url = req.url || '';
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/api?')) {
      try {
        const handled = await handleApiRequest(req, res);
        if (handled) return;
        // Never fall through to Vite SPA html fallback for /api routes
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ success: false, error: `API endpoint ${url} not found` }));
        return;
      } catch (err: any) {
        console.error('API middleware error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ success: false, error: err?.message || 'Internal API error' }));
        return;
      }
    }
    next();
  };

  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
