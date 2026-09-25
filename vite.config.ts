import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import {
  readSharedConduces,
  writeSharedConduces,
  mergeConduceRecords,
  deleteSharedConduce,
  clearSharedConduces,
  readDeletedIds,
  readSharedConfig,
  writeSharedConfig
} from './sharedConducesDb.js';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'shared-conduces-api',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/api/config')) {
              res.setHeader('Content-Type', 'application/json');
              if (req.method === 'GET') {
                const config = readSharedConfig();
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, config }));
                return;
              }
              if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const parsed = JSON.parse(body || '{}');
                    const updated = writeSharedConfig(parsed);
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, config: updated }));
                  } catch (e) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
                  }
                });
                return;
              }
            }

            if (!req.url?.startsWith('/api/conduces')) {
              return next();
            }

            res.setHeader('Content-Type', 'application/json');

            if (req.method === 'GET') {
              const records = readSharedConduces();
              const deletedIds = readDeletedIds();
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, count: records.length, records, deletedIds }));
              return;
            }

            if (req.method === 'DELETE') {
              const urlParts = (req.url || '').split('/');
              const id = urlParts[urlParts.length - 1];
              const updated = deleteSharedConduce(id);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, count: updated.length, records: updated, deletedIds: readDeletedIds() }));
              return;
            }

            if (req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', () => {
                try {
                  const data = JSON.parse(bodyStr || '{}');

                  if (req.url?.includes('/delete')) {
                    const id = data.id;
                    const conduceNumber = data.conduceNumber;
                    const updated = deleteSharedConduce(id, conduceNumber);
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, count: updated.length, records: updated, deletedIds: readDeletedIds() }));
                    return;
                  }

                  if (req.url?.includes('/clear')) {
                    const updated = clearSharedConduces();
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, count: 0, records: updated, deletedIds: readDeletedIds() }));
                    return;
                  }

                  const incoming = req.url?.includes('/bulk')
                    ? Array.isArray(data)
                      ? data
                      : data.records || []
                    : data;

                  const existing = readSharedConduces();
                  const merged = mergeConduceRecords(existing, incoming);
                  writeSharedConduces(merged);

                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, count: merged.length, records: merged, deletedIds: readDeletedIds() }));
                } catch (err) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
