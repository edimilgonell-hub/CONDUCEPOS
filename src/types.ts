export interface Client {
  id: string;
  name: string;
  documentId: string; // Cédula o RNC
  phone?: string;
  initialBalance: number; // Por requerimiento: 25,000
  notes?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  unit: string; // 'Und', 'Lb', 'Paq', 'Cja', 'Gal'
  unitPrice: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface ConduceRecord {
  id: string;
  conduceNumber: string; // Ej: CND-2026-0001
  date: string;
  formattedDate: string;
  client: Client;
  items: CartItem[];
  initialBalance: number; // Cupo asignado (default 25,000)
  consumoAnteriorCliente?: number; // Consumo acumulado previo del cliente
  saldoDisponibleAntes?: number; // Saldo disponible antes de este conduce
  totalCogido: number;    // Lo que consumió/cogió en este conduce
  devuelta: number;       // Saldo restante del cliente después de este conduce (saldoDisponibleAntes - totalCogido)
  notes?: string;
  syncedToGoogleSheets: boolean;
  syncTimestamp?: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncStatus: 'idle' | 'success' | 'error' | 'syncing';
  lastSyncMessage?: string;
}
