import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleApiRequest } from './src/server/apiHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing for Express
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS and Cache-Control headers for all API requests
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Explicitly define and register the POST route /api/auth/customer/forgot-password
  app.post('/api/auth/customer/forgot-password', async (req, res) => {
    try {
      const handled = await handleApiRequest(req, res);
      if (!handled && !res.headersSent) {
        res.status(404).json({ success: false, error: 'Customer forgot-password route not handled' });
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err?.message || 'Server error' });
      }
    }
  });

  // Explicitly register other critical customer and admin auth endpoints
  app.post('/api/auth/customer/verify-reset-otp', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/customer/reset-password', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/forgot-password/send-otp', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/forgot-password/verify-otp', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/admin/forgot-password/send-otp', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/admin/forgot-password/verify-otp', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      await handleApiRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // Main API dispatcher for all other /api and /api/* endpoints
  app.all('/api*', async (req, res) => {
    try {
      const handled = await handleApiRequest(req, res);
      if (!handled && !res.headersSent) {
        res.status(404).json({ success: false, error: `API endpoint ${req.originalUrl || req.url} not found` });
      }
    } catch (err: any) {
      if (!res.headersSent) {
        console.error('[API Router Error]:', err);
        res.status(500).json({ success: false, error: err?.message || 'Internal API Error' });
      }
    }
  });

  // Vite middleware in development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] RIDEX Moto backend + Vite running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
