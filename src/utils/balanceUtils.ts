import { Client, ConduceRecord } from '../types';

export interface ClientBalanceInfo {
  creditLimit: number;
  consumoAnterior: number;
  saldoDisponible: number;
  conducesPrevios: ConduceRecord[];
  isExceeded: boolean;
}

/**
 * Calcula el cupo, consumo histórico acumulado y saldo disponible de un cliente
 * a través de todos sus conduces registrados.
 */
export function getClientBalanceInfo(
  client: Client | null | undefined,
  records: ConduceRecord[] = [],
  excludeConduceId?: string
): ClientBalanceInfo {
  const creditLimit = Number(client?.initialBalance) > 0 ? Number(client?.initialBalance) : 25000;

  if (!client || !client.name?.trim()) {
    return {
      creditLimit,
      consumoAnterior: 0,
      saldoDisponible: creditLimit,
      conducesPrevios: [],
      isExceeded: false
    };
  }

  const clientNameNormalized = client.name.trim().toLowerCase();
  const clientDocNormalized = (client.documentId || '').trim().toLowerCase();
  const clientId = client.id;

  const conducesPrevios = records.filter((r) => {
    if (excludeConduceId && r.id === excludeConduceId) return false;
    const rClient = r.client;
    if (!rClient) return false;

    // Coincidencia por ID si ambos existen
    if (clientId && rClient.id && clientId === rClient.id) return true;
    // Coincidencia por Cédula / RNC
    if (
      clientDocNormalized &&
      rClient.documentId &&
      rClient.documentId.trim().toLowerCase() === clientDocNormalized
    ) {
      return true;
    }
    // Coincidencia por Nombre exacto
    if (rClient.name && rClient.name.trim().toLowerCase() === clientNameNormalized) {
      return true;
    }
    return false;
  });

  const consumoAnterior = conducesPrevios.reduce(
    (sum, r) => sum + (Number(r.totalCogido) || 0),
    0
  );
  const saldoDisponible = Math.max(0, creditLimit - consumoAnterior);
  const isExceeded = consumoAnterior >= creditLimit;

  return {
    creditLimit,
    consumoAnterior,
    saldoDisponible,
    conducesPrevios,
    isExceeded
  };
}
