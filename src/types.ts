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
  initialBalance: number; // 25,000
  totalCogido: number;    // Lo que consumió/cogió
  devuelta: number;       // Saldo restante (25,000 - totalCogido)
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
