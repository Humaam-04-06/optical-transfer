import { defineConfig, Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import os from 'os';

function turboStreamPlugin(): Plugin {
  const sessions = new Map<string, { token: any; chunks: Buffer[]; lastActive: number }>();

  // Cleanup inactive sessions older than 30 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [sid, session] of sessions.entries()) {
      if (now - session.lastActive > 30 * 60 * 1000) {
        sessions.delete(sid);
      }
    }
  }, 5 * 60 * 1000);

  return {
    name: 'turbo-stream-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = req.url || '';

        // 1. IP Discovery Endpoint
        if (url === '/api/turbo/ips' && req.method === 'GET') {
          const interfaces = os.networkInterfaces();
          const ips: string[] = [];
          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
              if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
              }
            }
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ips, port: 5173 }));
          return;
        }

        // 2. Register Session Endpoint
        if (url === '/api/turbo/register' && req.method === 'POST') {
          const bodyParts: Buffer[] = [];
          req.on('data', chunk => bodyParts.push(chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(bodyParts).toString('utf-8'));
              const { sid, token, chunksBase64 } = body;
              const bufferChunks = chunksBase64.map((b64: string) => Buffer.from(b64, 'base64'));
              sessions.set(sid, {
                token,
                chunks: bufferChunks,
                lastActive: Date.now(),
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, sid, totalChunks: bufferChunks.length }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 3. Metadata Endpoint
        if (url.startsWith('/api/turbo/meta/')) {
          const sid = url.split('/')[4]?.split('?')[0];
          const session = sessions.get(sid);
          if (!session) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Session not found' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ token: session.token }));
          return;
        }

        // 4. Binary Chunk Download Endpoint
        if (url.startsWith('/api/turbo/chunk/')) {
          const parts = url.split('/');
          const sid = parts[4];
          const index = parseInt(parts[5]?.split('?')[0], 10);
          const session = sessions.get(sid);
          if (!session || !session.chunks[index]) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Chunk not found' }));
            return;
          }
          session.lastActive = Date.now();
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Length', session.chunks[index].length);
          res.end(session.chunks[index]);
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), turboStreamPlugin()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/android/**', '**/ios/**'],
    },
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
  worker: {
    format: 'es',
  },
});
