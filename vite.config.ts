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
    const method = req.method || 'GET';
    const isMatched = isApiRoute(rawUrl) || isApiRoute(origUrl);

    if (isMatched) {
      console.log(`\n------------------ [Vite apiServerPlugin Intercepted] ------------------`);
      console.log(`Method: ${method}`);
      console.log(`Exact req.url: "${rawUrl}"`);
      console.log(`Exact req.originalUrl: "${origUrl}"`);
      console.log(`Host: "${req.headers?.host || 'unknown'}" | X-Forwarded-For: "${req.headers?.['x-forwarded-for'] || 'none'}"`);
      console.log(`X-Forwarded-Host: "${req.headers?.['x-forwarded-host'] || 'none'}" | Proto: "${req.headers?.['x-forwarded-proto'] || 'none'}"`);
      console.log(`------------------------------------------------------------------------`);
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
        console.error('[Vite apiServerPlugin] Error during request handling:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ success: false, error: err?.message || 'Internal API error' }));
        }
        return;
      }
    }

    // Diagnostic check: Did a reverse proxy strip the /api prefix before reaching Node/Vite?
    const looksLikeStrippedApi =
      /^\/(auth|admin|order|cart|bikes|accessories|payment|review|verify|forgot-password|reset-password)\b/i.test(rawUrl) ||
      /^\/(auth|admin|order|cart|bikes|accessories|payment|review|verify|forgot-password|reset-password)\b/i.test(origUrl);

    if (looksLikeStrippedApi) {
      console.warn(`\n[Vite apiServerPlugin ⚠️ WARNING] Potential API request detected WITHOUT '/api/' prefix!`);
      console.warn(`Hostinger or reverse-proxy might have stripped '/api' during URL rewrite.`);
      console.warn(`Method: ${method} | req.url: "${rawUrl}" | req.originalUrl: "${origUrl}"`);
      console.warn(`Attempting recovery: forwarding to handleApiRequest with /api prefix restoration...`);
      
      // Attempt to salvage the request by restoring the /api prefix
      req.url = '/api' + (rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`);
      try {
        const handled = await handleApiRequest(req, res);
        if (handled) return;
      } catch (recoveryErr) {
        console.error('[Vite apiServerPlugin] Recovery attempt failed:', recoveryErr);
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
