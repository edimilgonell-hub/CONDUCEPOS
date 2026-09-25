import { ConduceRecord } from '../types';
import { getLocalDeletedIds, addLocalDeletedIds } from './googleSheetsService';

/**
 * Servicio de sincronización en tiempo real para múltiples computadoras.
 * Permite que cualquier computadora que abra el sistema vea instantáneamente
 * los conduces realizados por las demás computadoras, garantizando que los conduces
 * eliminados queden registrados como lápidas (tombstones) y NUNCA reaparezcan.
 */

export async function fetchCloudConduces(): Promise<ConduceRecord[]> {
  try {
    const res = await fetch('/api/conduces', {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.deletedIds && Array.isArray(data.deletedIds)) {
      addLocalDeletedIds(data.deletedIds);
    }
    const deletedSet = new Set(getLocalDeletedIds());
    const records = Array.isArray(data.records) ? data.records : [];
    return records.filter(
      (r: any) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
    );
  } catch (err) {
    console.warn('No se pudieron obtener conduces del servidor compartido:', err);
    return [];
  }
}

export async function saveConduceToCloud(record: ConduceRecord): Promise<ConduceRecord[]> {
  try {
    const res = await fetch('/api/conduces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(record)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.deletedIds && Array.isArray(data.deletedIds)) {
      addLocalDeletedIds(data.deletedIds);
    }
    const deletedSet = new Set(getLocalDeletedIds());
    const records = Array.isArray(data.records) ? data.records : [];
    return records.filter(
      (r: any) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
    );
  } catch (err) {
    console.error('Error guardando conduce en el servidor compartido:', err);
    return [];
  }
}

export async function syncBulkConducesWithCloud(localRecords: ConduceRecord[]): Promise<ConduceRecord[]> {
  try {
    const deletedSet = new Set(getLocalDeletedIds());
    const cleanLocal = localRecords.filter(
      (r) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
    );

    const res = await fetch('/api/conduces/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ records: cleanLocal })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.deletedIds && Array.isArray(data.deletedIds)) {
      addLocalDeletedIds(data.deletedIds);
    }
    const freshDeletedSet = new Set(getLocalDeletedIds());
    const records = Array.isArray(data.records) ? data.records : [];
    return records.filter(
      (r: any) => r && r.id && !freshDeletedSet.has(r.id) && (!r.conduceNumber || !freshDeletedSet.has(r.conduceNumber))
    );
  } catch (err) {
    console.error('Error en sincronización masiva con la nube:', err);
    return [];
  }
}

export async function deleteCloudConduce(id: string, conduceNumber?: string): Promise<ConduceRecord[]> {
  try {
    // Registrar inmediatamente en local storage para que ninguna pestaña lo reenvíe
    addLocalDeletedIds([id, conduceNumber || '']);

    const res = await fetch('/api/conduces/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ id, conduceNumber })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.deletedIds && Array.isArray(data.deletedIds)) {
      addLocalDeletedIds(data.deletedIds);
    }
    const deletedSet = new Set(getLocalDeletedIds());
    const records = Array.isArray(data.records) ? data.records : [];
    return records.filter(
      (r: any) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
    );
  } catch (err) {
    console.error('Error eliminando conduce del servidor compartido:', err);
    return [];
  }
}

export async function clearCloudConduces(allExistingRecords: ConduceRecord[] = []): Promise<ConduceRecord[]> {
  try {
    const toDelete: string[] = [];
    allExistingRecords.forEach((r) => {
      if (r.id) toDelete.push(r.id);
      if (r.conduceNumber) toDelete.push(r.conduceNumber);
    });
    addLocalDeletedIds(toDelete);

    const res = await fetch('/api/conduces/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.deletedIds && Array.isArray(data.deletedIds)) {
      addLocalDeletedIds(data.deletedIds);
    }
    return [];
  } catch (err) {
    console.error('Error vaciando conduces del servidor compartido:', err);
    return [];
  }
}

export async function fetchSharedConfig(): Promise<{ webAppUrl?: string; autoSync?: boolean } | null> {
  try {
    const res = await fetch('/api/config', {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch (e) {
    return null;
  }
}

export async function saveSharedConfig(cfg: { webAppUrl?: string; autoSync?: boolean }): Promise<void> {
  try {
    await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(cfg)
    });
  } catch (e) {
    console.warn('No se pudo guardar la configuración compartida:', e);
  }
}
