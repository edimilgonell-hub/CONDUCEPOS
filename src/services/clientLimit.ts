import { Client, ConduceRecord } from '../types';

export const CLIENT_LIMIT = 25000;

const normalize = (value: string) =>
  value.trim().toLocaleLowerCase('es-DO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const normalizeDocument = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

export function sameClient(a: Client, b: Client): boolean {
  const firstDoc = normalizeDocument(a.documentId || '');
  const secondDoc = normalizeDocument(b.documentId || '');
  if (firstDoc && secondDoc) return firstDoc === secondDoc;
  return Boolean(normalize(a.name) && normalize(a.name) === normalize(b.name));
}

export function getClientSpent(records: ConduceRecord[], client: Client, excludeId?: string): number {
  return records.reduce((total, record) => {
    if (record.id === excludeId || !sameClient(record.client, client)) return total;
    return total + Math.round(record.totalCogido * 100);
  }, 0) / 100;
}
