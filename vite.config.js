import { defineConfig } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function localScreenshotSink() {
  return {
    name: 'local-screenshot-sink',
    configureServer(server) {
      server.middlewares.use('/__save-screenshot', async (req, res, next) => {
        if (req.method !== 'POST') { next(); return; }
        const query = new URL(req.url, 'http://localhost').searchParams;
        const name = query.get('name') ?? 'mapa';
        if (!/^[a-z0-9-]{1,50}$/i.test(name)) { res.statusCode = 400; res.end('Invalid screenshot name'); return; }
        const chunks = []; let size = 0;
        try {
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 12 * 1024 * 1024) { res.statusCode = 413; res.end('Screenshot is too large'); return; }
            chunks.push(chunk);
          }
          const folder = path.join(process.cwd(), 'screenshots');
          await mkdir(folder, { recursive: true });
          const file = path.join(folder, `domino-island-${name}.png`);
          await writeFile(file, Buffer.concat(chunks));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ saved: `screenshots/domino-island-${name}.png` }));
        } catch (error) {
          server.config.logger.error(error);
          res.statusCode = 500; res.end('Could not save screenshot');
        }
      });
    }
  };
}

export default defineConfig({ plugins: [localScreenshotSink()] });
