import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import youtubeSearchHandler from './api/youtube-search';
import geminiHandler from './api/gemini';
import r2PresignHandler from './api/r2-presign';
import r2DeleteHandler from './api/r2-delete';
import cfWhisperHandler from './api/cf-whisper';

function createVercelAdapter(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      query[k] = v;
    });

    const mockRes = {
      setHeader: (k: string, v: string) => res.setHeader(k, v),
      status: (code: number) => {
        res.statusCode = code;
        return {
          json: (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          },
          end: () => res.end(),
        };
      },
    };

    // Für Binary-Streams (cf-whisper) Body unverändert lassen
    if (url.pathname === '/api/cf-whisper') {
      (req as any).query = query;
      await handler(req, mockRes);
      return;
    }

    let rawBody = '';
    for await (const chunk of req) {
      rawBody += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    }

    let parsedBody: any = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = rawBody;
      }
    }

    const mockReq = {
      method: req.method,
      headers: req.headers,
      query,
      body: parsedBody,
    };

    await handler(mockReq, mockRes);
  };
}

function localApiProxyPlugin(): Plugin {
  const attachMiddlewares = (server: any) => {
    const routes: Record<string, (req: any, res: any) => Promise<any>> = {
      '/api/youtube-search': youtubeSearchHandler,
      '/api/gemini': geminiHandler,
      '/api/r2-presign': r2PresignHandler,
      '/api/r2-delete': r2DeleteHandler,
      '/api/cf-whisper': cfWhisperHandler,
    };

    server.middlewares.use(async (req: any, res: any, next: any) => {
      const path = (req.url || '').split('?')[0];
      const targetHandler = routes[path];
      if (!targetHandler) {
        return next();
      }
      try {
        await createVercelAdapter(targetHandler)(req, res);
      } catch (err) {
        console.error(`Vite local API error (${path}):`, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
  };

  return {
    name: 'hbs-local-api-proxy',
    configureServer: attachMiddlewares,
    configurePreviewServer: attachMiddlewares,
  };
}

function swVersionPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'hbs-sw-version',
    configResolved(resolved) {
      outDir = resolved.build.outDir || 'dist';
    },
    closeBundle() {
      const swPath = path.resolve(process.cwd(), outDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const content = fs.readFileSync(swPath, 'utf8');
      const stamped = content.replace(
        /'hbs-app-portal-v1'/,
        `'hbs-app-portal-${Date.now()}'`
      );
      fs.writeFileSync(swPath, stamped, 'utf8');
    },
  };
}

export default defineConfig(({ mode }) => {
  // Lädt auch nicht-VITE_ Secrets aus .env für lokale API-Middlewares (GEMINI_API_KEY, R2_*, CLOUDFLARE_*)
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }

  return {
    plugins: [react(), localApiProxyPlugin(), swVersionPlugin()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/canvas-confetti')) {
              return 'vendor-confetti';
            }
          },
        },
      },
    },
  };
});
