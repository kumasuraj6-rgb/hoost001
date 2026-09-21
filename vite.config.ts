import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {handleApiRequest} from './src/server/apiHandler';

function apiServerPlugin(): Plugin {
  const isApiRoute = (u: string) => {
    if (!u || typeof u !== 'string') return false;
    const clean = u.trim().replace(/\/+/g, '/');
    if (clean.startsWith('/api/') || clean === '/api' || clean.startsWith('/api?')) return true;
    try {
      const parsed = new URL(clean, 'http://localhost:3000');
      const p = parsed.pathname.replace(/\/+/g, '/');
      return p.startsWith('/api/') || p === '/api' || p.startsWith('/api?');
    } catch {
      return false;
    }
  };

  const middleware = async (req: any, res: any, next: any) => {
    const rawUrl = req.url || '';
    const origUrl = req.originalUrl || '';
    if (isApiRoute(rawUrl) || isApiRoute(origUrl)) {
      console.log(`[Vite API Middleware] Intercepted: ${req.method} ${rawUrl} (proxy/orig: ${origUrl || 'none'})`);
      try {
        const handled = await handleApiRequest(req, res);
        if (handled) return;
        // Never fall through to Vite SPA html fallback for /api routes
        if (!res.headersSent) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ success: false, error: `API endpoint ${rawUrl || origUrl} not found` }));
        }
        return;
      } catch (err: any) {
        console.error('[Vite API Middleware] Error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ success: false, error: err?.message || 'Internal API error' }));
        }
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
