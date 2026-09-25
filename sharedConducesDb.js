import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'conduces_shared_db.json');
const DELETED_PATH = path.resolve(process.cwd(), 'conduces_deleted_ids.json');
const CONFIG_PATH = path.resolve(process.cwd(), 'conduces_shared_config.json');

export function readSharedConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading conduces_shared_config.json:', err);
  }
  return { webAppUrl: '', autoSync: true };
}

export function writeSharedConfig(config) {
  try {
    const existing = readSharedConfig();
    const merged = { ...existing, ...config };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('Error writing conduces_shared_config.json:', err);
    return null;
  }
}

export function readDeletedIds() {
  try {
    if (fs.existsSync(DELETED_PATH)) {
      const content = fs.readFileSync(DELETED_PATH, 'utf8');
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err) {
    console.error('Error reading conduces_deleted_ids.json:', err);
  }
  return [];
}

export function writeDeletedIds(ids) {
  try {
    fs.writeFileSync(DELETED_PATH, JSON.stringify(ids, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing conduces_deleted_ids.json:', err);
    return false;
  }
}

export function addDeletedIds(items) {
  const current = new Set(readDeletedIds());
  const toAdd = Array.isArray(items) ? items : [items];
  for (const item of toAdd) {
    if (item && typeof item === 'string') {
      current.add(item.trim());
    }
  }
  const arr = Array.from(current);
  writeDeletedIds(arr);
  return arr;
}

export function readSharedConduces() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf8');
      const list = JSON.parse(content);
      const deletedSet = new Set(readDeletedIds());
      const filtered = (Array.isArray(list) ? list : []).filter(
        (r) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
      );
      return filtered;
    }
  } catch (err) {
    console.error('Error reading conduces_shared_db.json:', err);
  }
  return [];
}

export function writeSharedConduces(records) {
  try {
    const deletedSet = new Set(readDeletedIds());
    const cleanList = (Array.isArray(records) ? records : []).filter(
      (r) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
    );
    fs.writeFileSync(DB_PATH, JSON.stringify(cleanList, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing conduces_shared_db.json:', err);
    return false;
  }
}

export function mergeConduceRecords(existing, incoming) {
  const deletedSet = new Set(readDeletedIds());
  const map = new Map();

  // Put existing first
  for (const rec of existing) {
    if (rec && rec.id && !deletedSet.has(rec.id) && (!rec.conduceNumber || !deletedSet.has(rec.conduceNumber))) {
      map.set(rec.id, rec);
    }
  }

  // Incoming overwrites or adds, ignoring any deleted tombstones
  const incomingList = Array.isArray(incoming) ? incoming : [incoming];
  for (const rec of incomingList) {
    if (rec && rec.id && !deletedSet.has(rec.id) && (!rec.conduceNumber || !deletedSet.has(rec.conduceNumber))) {
      map.set(rec.id, rec);
    }
  }

  // Convert back to array sorted by date descending
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime();
    const timeB = new Date(b.date || 0).getTime();
    return timeB - timeA;
  });
}

export function deleteSharedConduce(id, conduceNumber) {
  try {
    // Add to tombstone deleted IDs list
    const toDelete = [];
    if (id) toDelete.push(id);
    if (conduceNumber) toDelete.push(conduceNumber);
    addDeletedIds(toDelete);

    const existing = readSharedConduces();
    const filtered = existing.filter((r) => r.id !== id && (!conduceNumber || r.conduceNumber !== conduceNumber));
    writeSharedConduces(filtered);
    return filtered;
  } catch (err) {
    console.error('Error deleting shared conduce:', err);
    return [];
  }
}

export function clearSharedConduces() {
  try {
    const existing = readSharedConduces();
    const allIds = [];
    for (const r of existing) {
      if (r.id) allIds.push(r.id);
      if (r.conduceNumber) allIds.push(r.conduceNumber);
    }
    addDeletedIds(allIds);
    writeSharedConduces([]);
    return [];
  } catch (err) {
    console.error('Error clearing shared conduces:', err);
    return [];
  }
}
