import React, { useState, useEffect, useCallback } from 'react';
import { Client, ProductItem, CartItem, ConduceRecord, GoogleSheetsConfig } from './types';
import { INITIAL_PRODUCTS, INITIAL_CLIENTS, COMPANY_INFO } from './data/mockProducts';
import {
  getStoredConfig,
  saveStoredConfig,
  getStoredRecords,
  saveStoredRecords,
  syncConduceToGoogleSheets,
  deleteConduceFromGoogleSheets,
  clearAllFromGoogleSheets
} from './services/googleSheetsService';
import { ClientSection } from './components/ClientSection';
import { ProductAutoSearch } from './components/ProductAutoSearch';
import { ConduceCart } from './components/ConduceCart';
import { DualReceiptView } from './components/DualReceiptView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ConduceHistoryModal } from './components/ConduceHistoryModal';
import { ShareMultiPCModal } from './components/ShareMultiPCModal';
import { EditConduceModal } from './components/EditConduceModal';
import { ClientManagerModal } from './components/ClientManagerModal';
import { initAuth, getAccessToken } from './services/googleAuth';
import {
  appendConduceToGoogleSheet,
  getSavedSpreadsheetInfo,
  deleteConduceFromGoogleDriveSheet,
  clearAllConducesFromGoogleDriveSheet
} from './services/googleDriveSheets';
import { getClientBalanceInfo } from './utils/balanceUtils';
import {
  fetchCloudConduces,
  saveConduceToCloud,
  syncBulkConducesWithCloud,
  deleteCloudConduce,
  clearCloudConduces,
  fetchSharedConfig,
  saveSharedConfig
} from './services/cloudConduceSync';
import { User } from 'firebase/auth';
import {
  Receipt,
  FileSpreadsheet,
  History,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Share2,
  Laptop,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Products and Clients state with PDF items
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const stored = localStorage.getItem('conduce_products_mb_v2');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  const [frequentClients, setFrequentClients] = useState<Client[]>(() => {
    try {
      const stored = localStorage.getItem('conduce_clients_mb_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_CLIENTS.length) {
          return parsed;
        }
      }
      // If no v3 or less clients, ensure all 315 Hatillo Palma clients are loaded
      return INITIAL_CLIENTS;
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CLIENTS;
  });

  // Save clients to local storage
  useEffect(() => {
    try {
      localStorage.setItem('conduce_clients_mb_v3', JSON.stringify(frequentClients));
    } catch (e) {
      console.error(e);
    }
  }, [frequentClients]);

  // Active Client
  const [currentClient, setCurrentClient] = useState<Client>(() => {
    return (
      INITIAL_CLIENTS[0] || {
        id: `cli-${Date.now()}`,
        name: '',
        documentId: '',
        phone: '',
        initialBalance: 25000,
        notes: ''
      }
    );
  });

  // Active Conduce Cart items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(true);

  // Records and Google Sheets
  const [records, setRecords] = useState<ConduceRecord[]>(() => getStoredRecords());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => getStoredConfig());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modals state
  const [activeConduceForReceipt, setActiveConduceForReceipt] = useState<ConduceRecord | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showClientManagerModal, setShowClientManagerModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<ConduceRecord | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Client CRUD Handlers
  const handleAddClient = (newC: Client) => {
    setFrequentClients((prev) => [newC, ...prev]);
    showToast(`Cliente "${newC.name}" registrado con éxito.`);
  };

  const handleUpdateClient = (updatedC: Client) => {
    setFrequentClients((prev) =>
      prev.map((c) => (c.id === updatedC.id ? updatedC : c))
    );
    if (currentClient.id === updatedC.id) {
      setCurrentClient(updatedC);
    }
    showToast(`Cliente "${updatedC.name}" actualizado.`);
  };

  const handleDeleteClient = (id: string) => {
    setFrequentClients((prev) => prev.filter((c) => c.id !== id));
    showToast('Cliente eliminado del directorio.', 'info');
  };

  // Conduce Edit / Delete Handlers
  const handleSaveEditedRecord = (updatedRecord: ConduceRecord) => {
    const updatedList = records.map((r) =>
      r.id === updatedRecord.id ? updatedRecord : r
    );
    setRecords(updatedList);
    saveStoredRecords(updatedList);
    setEditingRecord(null);
    setActiveConduceForReceipt(updatedRecord);
    showToast(`Conduce ${updatedRecord.conduceNumber} actualizado con éxito.`);

    // Sincronizar actualización con el servidor compartido
    saveConduceToCloud(updatedRecord).then((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        setRecords(cloudList);
        saveStoredRecords(cloudList);
      }
    }).catch(console.warn);
  };

  const handleDeleteRecord = async (id: string) => {
    const recordToDelete = records.find((r) => r.id === id);
    const conduceNumber = recordToDelete?.conduceNumber || '';

    // 1. Eliminar inmediatamente de memoria y localStorage
    const updatedList = records.filter(
      (r) => r.id !== id && (!conduceNumber || r.conduceNumber !== conduceNumber)
    );
    setRecords(updatedList);
    saveStoredRecords(updatedList);

    // 2. Eliminar de la Hoja de Cálculo de Google (Web App URL y/o Drive Directo)
    let deletedFromSheets = false;
    if (conduceNumber) {
      if (sheetsConfig.webAppUrl && sheetsConfig.webAppUrl.trim().startsWith('http')) {
        deleteConduceFromGoogleSheets(conduceNumber, sheetsConfig.webAppUrl).catch(console.warn);
        deletedFromSheets = true;
      }

      const driveInfo = getSavedSpreadsheetInfo();
      const token = await getAccessToken();
      if (token && driveInfo.id) {
        deleteConduceFromGoogleDriveSheet(token, driveInfo.id, conduceNumber).catch(console.warn);
        deletedFromSheets = true;
      }
    }

    if (deletedFromSheets) {
      showToast(`Conduce ${conduceNumber || ''} eliminado de la app y de Google Sheets.`);
    } else {
      showToast(`Conduce ${conduceNumber || ''} eliminado con éxito.`);
    }

    // 3. Registrar lápida (tombstone) y eliminar del servidor multi-PC
    try {
      const cloudList = await deleteCloudConduce(id, conduceNumber);
      if (cloudList && Array.isArray(cloudList)) {
        setRecords(cloudList);
        saveStoredRecords(cloudList);
      }
    } catch (e) {
      console.warn('Error eliminando conduce de la nube:', e);
    }
  };

  const handleClearAllRecords = async () => {
    const recordsSnapshot = [...records];
    setRecords([]);
    saveStoredRecords([]);

    // Limpiar en Google Sheets
    if (sheetsConfig.webAppUrl && sheetsConfig.webAppUrl.trim().startsWith('http')) {
      clearAllFromGoogleSheets(sheetsConfig.webAppUrl).catch(console.warn);
    }
    const driveInfo = getSavedSpreadsheetInfo();
    const token = await getAccessToken();
    if (token && driveInfo.id) {
      clearAllConducesFromGoogleDriveSheet(token, driveInfo.id).catch(console.warn);
    }

    showToast('Historial vaciado en la app y en Google Sheets.');

    try {
      await clearCloudConduces(recordsSnapshot);
    } catch (e) {
      console.warn('Error vaciando conduces de la nube:', e);
    }
  };

  // Real-time Multi-PC Cloud Sync
  const [isRefreshingCloud, setIsRefreshingCloud] = useState<boolean>(false);

  const handleRefreshCloud = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsRefreshingCloud(true);
      // Obtener lista fresca del servidor de la nube (que filtra lápidas / eliminados)
      const cloudRecords = await fetchCloudConduces();
      if (cloudRecords) {
        setRecords(cloudRecords);
        saveStoredRecords(cloudRecords);
        if (!silent) {
          showToast(`Sincronizado: ${cloudRecords.length} conduces activos.`);
        }
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      if (!silent) setIsRefreshingCloud(false);
    }
  }, []);

  // Poll cloud database every 10 seconds and on window focus so other PCs' conduces appear immediately
  useEffect(() => {
    handleRefreshCloud(true);

    const syncConfig = () => {
      fetchSharedConfig().then((cloudCfg) => {
        const cloudUrl = cloudCfg?.webAppUrl?.trim();
        if (cloudUrl && cloudUrl.startsWith('http')) {
          setSheetsConfig((prev) => {
            if (!prev.webAppUrl || prev.webAppUrl !== cloudUrl) {
              const updated: GoogleSheetsConfig = { ...prev, webAppUrl: cloudUrl, autoSync: true };
              saveStoredConfig(updated);
              return updated;
            }
            return prev;
          });
        }
      }).catch(console.warn);
    };

    syncConfig();

    const interval = setInterval(() => {
      handleRefreshCloud(true);
      syncConfig();
    }, 10000);

    const onFocus = () => {
      handleRefreshCloud(true);
      syncConfig();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [handleRefreshCloud]);

  // Show transient toast
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if opened via multi-terminal link with ?sync_url=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncUrl = params.get('sync_url');
      if (syncUrl && syncUrl.startsWith('http')) {
        const decoded = decodeURIComponent(syncUrl);
        setSheetsConfig((prev) => {
          const updated: GoogleSheetsConfig = {
            ...prev,
            webAppUrl: decoded,
            autoSync: true,
            lastSyncStatus: 'success',
            lastSyncMessage: 'Terminal conectada a Google Sheets automáticamente'
          };
          saveStoredConfig(updated);
          return updated;
        });
        showToast('¡Terminal conectada a Google Sheets automáticamente!', 'success');
        // Clean up URL without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);

  // Save products to local storage when changed
  useEffect(() => {
    try {
      localStorage.setItem('conduce_products_mb_v2', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  // Cart operations
  const handleAddToCart = (product: ProductItem, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: product.id,
          name: product.name,
          unit: product.unit,
          unitPrice: product.unitPrice,
          quantity,
          total: quantity * product.unitPrice
        }
      ];
    });
  };

  const handleAddCustomProduct = (newProd: ProductItem, quantity: number) => {
    setProducts((prev) => [newProd, ...prev]);
    handleAddToCart(newProd, quantity);
    showToast(`"${newProd.name}" anexado al catálogo y al conduce.`);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Línea de producto eliminada del catálogo.', 'info');
  };

  const handleBulkAddProducts = (newItems: ProductItem[]) => {
    setProducts((prev) => [...newItems, ...prev]);
    showToast(`${newItems.length} líneas de productos anexadas con éxito.`);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleSetQuantity = (id: string, qty: number) => {
    const validQty = Math.max(1, qty || 1);
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: validQty, total: validQty * item.unitPrice }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setNotes('');
  };

  const handleNewConduce = () => {
    handleClearCart();
    setCurrentClient({
      id: `cli-${Date.now()}`,
      name: '',
      documentId: '',
      phone: '',
      initialBalance: 25000,
      notes: ''
    });
    showToast('Nuevo conduce iniciado. Selecciona o ingresa los datos del cliente.', 'info');
  };

  // Emit Conduce Action
  const handleEmitConduce = async () => {
    const CONDUCE_MAX = 25000;
    const totalCogido = cartItems.reduce((acc, it) => acc + it.total, 0);

    if (totalCogido <= 0 || cartItems.length === 0) {
      showToast('Debe agregar al menos un producto al conduce.', 'error');
      return;
    }

    if (!currentClient.name.trim()) {
      showToast('Por favor ingrese el nombre del cliente en el Paso 1.', 'error');
      return;
    }

    // 1. Límite del conduce individual
    if (totalCogido > CONDUCE_MAX) {
      showToast(`¡El monto del conduce ($${totalCogido.toLocaleString()}) NO puede pasar de $25,000.00!`, 'error');
      return;
    }

    // 2. Límite acumulado del cliente
    const clientBalance = getClientBalanceInfo(currentClient, records);
    if (totalCogido > clientBalance.saldoDisponible) {
      showToast(
        `¡Excede el límite del cliente! El cliente ya consumió $${clientBalance.consumoAnterior.toLocaleString()} en ${clientBalance.conducesPrevios.length} conduces. Solo le quedan $${clientBalance.saldoDisponible.toLocaleString()} disponibles de sus $25,000.00.`,
        'error'
      );
      return;
    }

    const devuelta = clientBalance.saldoDisponible - totalCogido;
    const dateObj = new Date();
    const sequenceNumber = (records.length + 1).toString().padStart(4, '0');
    const conduceNumber = `CND-${dateObj.getFullYear()}-${sequenceNumber}`;

    const newRecord: ConduceRecord = {
      id: `cnd-rec-${Date.now()}`,
      conduceNumber,
      date: dateObj.toISOString(),
      formattedDate: dateObj.toLocaleString('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      client: { ...currentClient, initialBalance: clientBalance.creditLimit },
      items: [...cartItems],
      initialBalance: clientBalance.creditLimit,
      consumoAnteriorCliente: clientBalance.consumoAnterior,
      saldoDisponibleAntes: clientBalance.saldoDisponible,
      totalCogido,
      devuelta,
      notes: notes.trim(),
      syncedToGoogleSheets: false
    };

    // Save locally
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    saveStoredRecords(updatedRecords);

    // Save to shared cloud DB so all other PCs immediately receive this conduce
    saveConduceToCloud(newRecord).then((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        setRecords(cloudList);
        saveStoredRecords(cloudList);
      }
    }).catch(console.warn);

    // Show dual receipt modal
    setActiveConduceForReceipt(newRecord);

    // 1. Intento de Sincronización directa con Google Drive (si hay sesión iniciada)
    getAccessToken().then(async (token) => {
      const savedInfo = getSavedSpreadsheetInfo();
      if (token && savedInfo.id) {
        try {
          await appendConduceToGoogleSheet(newRecord, token, savedInfo.id);
          const syncedList = updatedRecords.map((r) =>
            r.id === newRecord.id
              ? { ...r, syncedToGoogleSheets: true, syncTimestamp: new Date().toISOString() }
              : r
          );
          setRecords(syncedList);
          saveStoredRecords(syncedList);
          setActiveConduceForReceipt((prev) =>
            prev?.id === newRecord.id ? { ...prev, syncedToGoogleSheets: true } : prev
          );
        } catch (err) {
          console.warn('Fallo en sincronización directa Drive:', err);
        }
      }
    });

    // 2. Sincronización con Google Apps Script Web App (para uso multi-computadora)
    if (sheetsConfig.webAppUrl && sheetsConfig.autoSync) {
      setIsSyncing(true);
      syncConduceToGoogleSheets(newRecord, sheetsConfig.webAppUrl)
        .then((result) => {
          if (result.success) {
            const syncedList = updatedRecords.map((r) =>
              r.id === newRecord.id
                ? { ...r, syncedToGoogleSheets: true, syncTimestamp: new Date().toISOString() }
                : r
            );
            setRecords(syncedList);
            saveStoredRecords(syncedList);
            setActiveConduceForReceipt((prev) =>
              prev?.id === newRecord.id ? { ...prev, syncedToGoogleSheets: true } : prev
            );
            showToast(`Conduce ${conduceNumber} registrado y enviado a Google Sheets.`);
          } else {
            showToast(`Conduce ${conduceNumber} guardado.`, 'info');
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    } else {
      showToast(`Conduce ${conduceNumber} generado con éxito.`);
    }

    // Auto print if enabled
    if (autoPrintEnabled) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  // Re-sync specific record from history or receipt view
  const handleResyncRecord = async (record: ConduceRecord) => {
    if (!sheetsConfig.webAppUrl) {
      setShowSheetsModal(true);
      showToast('Configura primero la URL de Google Apps Script.', 'info');
      return;
    }

    setSyncingId(record.id);
    setIsSyncing(true);

    try {
      const result = await syncConduceToGoogleSheets(record, sheetsConfig.webAppUrl);
      if (result.success) {
        const updated = records.map((r) =>
          r.id === record.id
            ? { ...r, syncedToGoogleSheets: true, syncTimestamp: new Date().toISOString() }
            : r
        );
        setRecords(updated);
        saveStoredRecords(updated);
        if (activeConduceForReceipt?.id === record.id) {
          setActiveConduceForReceipt({ ...activeConduceForReceipt, syncedToGoogleSheets: true });
        }
        showToast(`Conduce ${record.conduceNumber} sincronizado con Google Sheets.`);
      } else {
        showToast(result.message, 'error');
      }
    } finally {
      setIsSyncing(false);
      setSyncingId(null);
    }
  };

  // Keyboard shortcut listener (F10 to Emit Conduce, Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        handleEmitConduce();
      } else if (e.key === 'Escape') {
        setActiveConduceForReceipt(null);
        setShowSheetsModal(false);
        setShowHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const totalCogido = cartItems.reduce((acc, it) => acc + it.total, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="no-print fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-semibold border ${
              notification.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : notification.type === 'info'
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : 'bg-emerald-800 text-emerald-100 border-emerald-600'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="no-print bg-slate-950 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate max-w-xs sm:max-w-md">
                  {COMPANY_INFO.name}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-extrabold border border-slate-700 uppercase tracking-wider shrink-0">
                  Térmica 80mm
                </span>
              </div>
              <p className="text-xs text-slate-400">
                RNC: {COMPANY_INFO.rnc} • Saldo $25,000 • ITBIS 18% Incluido • Enlace a Google Sheets
              </p>
            </div>
          </div>

          {/* Quick Action Badges & Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Saldo Base Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Saldo Asignado:</span>
              <strong className="text-white font-mono font-bold">$25,000.00</strong>
            </div>

            {/* Google Sheets connection status and config button */}
            {(() => {
              const isConnected = Boolean(currentUser || sheetsConfig.webAppUrl);
              return (
                <button
                  type="button"
                  onClick={() => setShowSheetsModal(true)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/70 shadow-xs'
                      : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/70 shadow-xs animate-pulse'
                  }`}
                  title={
                    isConnected
                      ? 'Google Sheets Conectado: Los conduces se sincronizan automáticamente'
                      : 'Google Sheets No Conectado: Haz clic para vincular tu hoja de cálculo'
                  }
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <div className="flex items-center gap-1.5 text-left">
                    <span className="hidden sm:inline">Google Sheets:</span>
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>{currentUser ? 'Drive Conectado' : 'Conectado'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>No Conectado</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })()}

            {/* Share / Multi-PC Terminal Button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 transition cursor-pointer"
              title="Obtener enlace para poner el sistema en otras computadoras"
            >
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Poner en Otras PC</span>
            </button>

            {/* History button */}
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <History className="w-4 h-4 text-teal-400" />
              <span>Historial ({records.length})</span>
            </button>

            {/* Multi-PC Live Cloud Sync Indicator & Button */}
            <button
              type="button"
              onClick={() => handleRefreshCloud(false)}
              disabled={isRefreshingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm transition cursor-pointer"
              title="Sincronizar conduces creados en otras computadoras"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin text-emerald-300' : ''}`} />
              <span className="hidden md:inline">Red Multi-PC</span>
            </button>

            {/* New Conduce reset button */}
            <button
              type="button"
              onClick={handleNewConduce}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
              title="Nuevo Conduce en blanco"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Venta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Split into 2 Columns: Left = Cliente + Catálogo, Right = Conduce Cart) */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Cliente (Step 1) + Catálogo de Productos (Step 2) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Step 1: Cliente & Saldo con Buscador Automático */}
          <ClientSection
            client={currentClient}
            onClientChange={setCurrentClient}
            frequentClients={frequentClients}
            records={records}
            totalCogido={totalCogido}
            onOpenClientManager={() => setShowClientManagerModal(true)}
            onViewClientHistory={() => setShowHistoryModal(true)}
          />

          {/* Step 2: Buscador Automático de Productos & Gestión de Líneas */}
          <div className="flex-1 min-h-[300px]">
            <ProductAutoSearch
              products={products}
              onAddToCart={handleAddToCart}
              onAddCustomProduct={handleAddCustomProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkAddProducts={handleBulkAddProducts}
            />
          </div>
        </div>

        {/* Right Column: Facturar / Detalle del Conduce & Doble Recibo (Step 3) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <ConduceCart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            notes={notes}
            onNotesChange={setNotes}
            autoPrintEnabled={autoPrintEnabled}
            onToggleAutoPrint={setAutoPrintEnabled}
            onEmitConduce={handleEmitConduce}
            client={currentClient}
            records={records}
          />
        </div>
      </main>

      {/* Footer Info (Hidden on print) */}
      <footer className="no-print bg-slate-900 text-slate-400 text-xs py-3 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sistema ConducePOS activo • Regla comercial: Saldo fijo $25,000 por cliente</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Presiona <strong>F10</strong> para emitir • 2 Recibos con firmas al final
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Dual Receipt View Modal */}
      {activeConduceForReceipt && (
        <DualReceiptView
          conduce={activeConduceForReceipt}
          onClose={() => setActiveConduceForReceipt(null)}
          onPrint={() => window.print()}
          onResync={() => handleResyncRecord(activeConduceForReceipt)}
          isSyncing={isSyncing}
        />
      )}

      {/* 2. Google Sheets & Apps Script Modal */}
      {showSheetsModal && (
        <GoogleSheetsModal
          config={sheetsConfig}
          onSaveConfig={(updated) => {
            setSheetsConfig(updated);
            saveStoredConfig(updated);
            saveSharedConfig({ webAppUrl: updated.webAppUrl, autoSync: updated.autoSync });
            showToast('Configuración de Google Sheets guardada y compartida con las demás computadoras.');
          }}
          onClose={() => setShowSheetsModal(false)}
          records={records}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
        />
      )}

      {/* 3. Conduce History Modal */}
      {showHistoryModal && (
        <ConduceHistoryModal
          records={records}
          onSelectRecord={(rec) => {
            setActiveConduceForReceipt(rec);
            setShowHistoryModal(false);
          }}
          onEditRecord={(rec) => {
            setEditingRecord(rec);
            setShowHistoryModal(false);
          }}
          onDeleteRecord={handleDeleteRecord}
          onClearAllRecords={handleClearAllRecords}
          onResyncRecord={handleResyncRecord}
          onClose={() => setShowHistoryModal(false)}
          isSyncingId={syncingId}
          onRefreshCloud={() => handleRefreshCloud(false)}
          isRefreshingCloud={isRefreshingCloud}
        />
      )}

      {/* 4. Edit Conduce Modal */}
      {editingRecord && (
        <EditConduceModal
          record={editingRecord}
          availableProducts={products}
          onSave={handleSaveEditedRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {/* 5. Client Directory / Management Modal */}
      {showClientManagerModal && (
        <ClientManagerModal
          clients={frequentClients}
          onAddClient={handleAddClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          onSelectClient={(c) => {
            setCurrentClient(c);
            showToast(`Cliente "${c.name}" seleccionado.`);
          }}
          onClose={() => setShowClientManagerModal(false)}
        />
      )}

      {/* 6. Multi-PC Share and Desktop Shortcut Modal */}
      {showShareModal && (
        <ShareMultiPCModal
          sheetsConfig={sheetsConfig}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
