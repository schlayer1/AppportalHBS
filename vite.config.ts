import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import youtubeSearchHandler from './api/youtube-search';

function youtubeSearchPlugin(): Plugin {
  return {
    name: 'youtube-search-plugin',
    configureServer(server) {
      server.middlewares.use('/api/youtube-search', async (req, res) => {
        try {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const q = url.searchParams.get('q') || '';
          const mockReq = { query: { q }, method: req.method };
          const mockRes = {
            setHeader: (k: string, v: string) => res.setHeader(k, v),
            status: (code: number) => {
              res.statusCode = code;
              return {
                json: (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => res.end()
              };
            }
          };
          await youtubeSearchHandler(mockReq, mockRes);
        } catch (err) {
          console.error('Vite dev server YouTube search error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ results: [], error: String(err) }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), youtubeSearchPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'vendor-confetti';
          }
        }
      }
    }
  }
});

