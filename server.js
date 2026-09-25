import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// API: Get and set shared config (Google Sheets Webhook URL shared across all PCs)
app.get('/api/config', (req, res) => {
  const config = readSharedConfig();
  res.json({ success: true, config });
});

app.post('/api/config', (req, res) => {
  const incoming = req.body || {};
  const updated = writeSharedConfig(incoming);
  res.json({ success: true, config: updated });
});

// API: Get all conduces and deleted tombstone IDs
app.get('/api/conduces', (req, res) => {
  const records = readSharedConduces();
  const deletedIds = readDeletedIds();
  res.json({ success: true, count: records.length, records, deletedIds });
});

// API: Save or update a single conduce
app.post('/api/conduces', (req, res) => {
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ success: false, error: 'Conduce record must contain an id' });
  }
  const existing = readSharedConduces();
  const merged = mergeConduceRecords(existing, incoming);
  writeSharedConduces(merged);
  res.json({ success: true, count: merged.length, records: merged, deletedIds: readDeletedIds() });
});

// API: Bulk merge from a client computer
app.post('/api/conduces/bulk', (req, res) => {
  const incomingList = Array.isArray(req.body) ? req.body : req.body.records || [];
  const existing = readSharedConduces();
  const merged = mergeConduceRecords(existing, incomingList);
  writeSharedConduces(merged);
  res.json({ success: true, count: merged.length, records: merged, deletedIds: readDeletedIds() });
});

// API: Delete a conduce from shared database
app.delete('/api/conduces/:id', (req, res) => {
  const { id } = req.params;
  const updated = deleteSharedConduce(id);
  res.json({ success: true, count: updated.length, records: updated, deletedIds: readDeletedIds() });
});

app.post('/api/conduces/delete', (req, res) => {
  const { id, conduceNumber } = req.body || {};
  if (!id && !conduceNumber) return res.status(400).json({ success: false, error: 'id or conduceNumber required' });
  const updated = deleteSharedConduce(id, conduceNumber);
  res.json({ success: true, count: updated.length, records: updated, deletedIds: readDeletedIds() });
});

// API: Clear all conduces (reset test data)
app.post('/api/conduces/clear', (req, res) => {
  const updated = clearSharedConduces();
  res.json({ success: true, count: 0, records: updated, deletedIds: readDeletedIds() });
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: send index.html for all GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ConducePOS multi-PC server running at http://0.0.0.0:${PORT}`);
});
