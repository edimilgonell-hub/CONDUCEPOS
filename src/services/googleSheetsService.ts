import { ConduceRecord, GoogleSheetsConfig } from '../types';

const STORAGE_KEY_CONFIG = 'conduce_sheets_config_v1';
const STORAGE_KEY_RECORDS = 'conduce_records_v1';
const STORAGE_KEY_DELETED = 'conduce_deleted_ids_v1';

export const DEFAULT_CONFIG: GoogleSheetsConfig = {
  webAppUrl: '',
  autoSync: true,
  lastSyncStatus: 'idle',
  lastSyncMessage: ''
};

export const getStoredConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading Google Sheets config:', e);
  }
  return DEFAULT_CONFIG;
};

export const saveStoredConfig = (config: GoogleSheetsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Google Sheets config:', e);
  }
};

export const getLocalDeletedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error loading deleted ids:', e);
  }
  return [];
};

export const addLocalDeletedIds = (ids: string[]) => {
  try {
    const current = new Set(getLocalDeletedIds());
    for (const id of ids) {
      if (id && typeof id === 'string') {
        current.add(id.trim());
      }
    }
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Error adding local deleted ids:', e);
  }
};

export const getStoredRecords = (): ConduceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (raw) {
      const list: ConduceRecord[] = JSON.parse(raw);
      const deletedSet = new Set(getLocalDeletedIds());
      return (Array.isArray(list) ? list : []).filter(
        (r) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
      );
    }
  } catch (e) {
    console.error('Error loading stored records:', e);
  }
  return [];
};

export const saveStoredRecords = (records: ConduceRecord[]) => {
  try {
    const deletedSet = new Set(getLocalDeletedIds());
    const clean = (Array.isArray(records) ? records : []).filter(
      (r) => r && r.id && !deletedSet.has(r.id) && (!r.conduceNumber || !deletedSet.has(r.conduceNumber))
    );
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(clean));
  } catch (e) {
    console.error('Error saving stored records:', e);
  }
};

/**
 * Envia el conduce al Google Apps Script Web App desplegado en la Hoja de Cálculo.
 */
export async function syncConduceToGoogleSheets(
  conduce: ConduceRecord,
  webAppUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'No hay URL válida de Google Apps Script configurada.'
    };
  }

  const payload = {
    action: 'add_conduce',
    conduceNumber: conduce.conduceNumber,
    date: conduce.formattedDate,
    isoDate: conduce.date,
    clientName: conduce.client.name,
    clientDoc: conduce.client.documentId,
    clientPhone: conduce.client.phone || '',
    initialBalance: conduce.initialBalance,
    totalCogido: conduce.totalCogido,
    devuelta: conduce.devuelta,
    itemCount: conduce.items.reduce((acc, it) => acc + it.quantity, 0),
    itemsSummary: conduce.items
      .map((it) => `${it.quantity} ${it.unit} ${it.name} ($${it.unitPrice} c/u = $${it.total.toFixed(2)})`)
      .join(' | '),
    itemsShort: conduce.items
      .map((it) => `${it.quantity} ${it.unit} ${it.name}`)
      .join('; '),
    notes: conduce.notes || ''
  };

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: 'Conduce enviado exitosamente a la Hoja de Cálculo de Google.'
    };
  } catch (error: any) {
    console.error('Error syncing to Google Apps Script:', error);
    return {
      success: false,
      message: error?.message || 'Error de conexión con Google Apps Script.'
    };
  }
}

/**
 * Elimina un conduce de la Hoja de Google Sheets por su Nº Conduce.
 */
export async function deleteConduceFromGoogleSheets(
  conduceNumber: string,
  webAppUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'No hay URL válida de Google Apps Script configurada.'
    };
  }

  const payload = {
    action: 'delete_conduce',
    conduceNumber: conduceNumber
  };

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: `Solicitud de eliminación de ${conduceNumber} enviada a Google Sheets.`
    };
  } catch (error: any) {
    console.error('Error deleting from Google Apps Script:', error);
    return {
      success: false,
      message: error?.message || 'Error de conexión con Google Apps Script.'
    };
  }
}

/**
 * Vacia todas las filas de conduces de la Hoja de Google Sheets manteniendo los encabezados.
 */
export async function clearAllFromGoogleSheets(
  webAppUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'No hay URL válida de Google Apps Script configurada.'
    };
  }

  const payload = {
    action: 'clear_all'
  };

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: 'Solicitud de vaciado enviada a Google Sheets.'
    };
  } catch (error: any) {
    console.error('Error clearing Google Apps Script:', error);
    return {
      success: false,
      message: error?.message || 'Error de conexión con Google Apps Script.'
    };
  }
}

/**
 * Código listo para copiar en Google Apps Script (Extensiones > Apps Script)
 */
export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================
 * CONDUCEPOS - GOOGLE APPS SCRIPT PARA HOJA DE CÁLCULO
 * ============================================================
 * INSTRUCCIONES:
 * 1. En tu Hoja de Google Sheets, ve al menú: Extensiones > Apps Script
 * 2. Borra cualquier código existente y pega este archivo completo.
 * 3. Haz clic en "Implementar" (arriba a la derecha) > "Gestionar implementaciones" > editar (ícono lápiz) > "Nueva versión" > Implementar.
 * 4. Copia la URL de la aplicación web generada y pégala en ConducePOS.
 * ============================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Conduces") || ss.getActiveSheet();

    // 1. ACCIÓN: ELIMINAR UN CONDUCE ESPECÍFICO
    if (data.action === "delete_conduce" && data.conduceNumber) {
      var lastRow = sheet.getLastRow();
      var targetNum = String(data.conduceNumber).trim();
      var deletedCount = 0;
      if (lastRow > 1) {
        var numValues = sheet.getRange(1, 2, lastRow, 1).getValues();
        for (var r = lastRow; r >= 2; r--) {
          if (String(numValues[r - 1][0]).trim() === targetNum) {
            sheet.deleteRow(r);
            deletedCount++;
          }
        }
      }
      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", message: "Conduce eliminado de Google Sheets", deleted: deletedCount })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ACCIÓN: VACIAR TODAS LAS FILAS DE CONDUCES
    if (data.action === "clear_all") {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", message: "Todas las filas eliminadas de Google Sheets" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. ACCIÓN: AGREGAR O REGISTRAR CONDUCE
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Fecha y Hora",
        "Nº Conduce",
        "Cliente",
        "Cédula / RNC",
        "Teléfono",
        "Saldo Asignado ($)",
        "Total Cogido ($)",
        "Devuelta / Saldo Restante ($)",
        "Cant. Total Artículos",
        "Detalle de Productos",
        "Notas"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1e293b");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var row = [
      data.date || new Date().toLocaleString(),
      data.conduceNumber || "",
      data.clientName || "",
      data.clientDoc || "",
      data.clientPhone || "",
      Number(data.initialBalance || 25000),
      Number(data.totalCogido || 0),
      Number(data.devuelta || 0),
      Number(data.itemCount || 0),
      data.itemsSummary || data.itemsShort || "",
      data.notes || ""
    ];

    sheet.appendRow(row);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 6, 1, 3).setNumberFormat("$#,##0.00");

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Conduce registrado", row: lastRow })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "online", system: "ConducePOS Apps Script Active", time: new Date() })
  ).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Genera descarga directa en formato CSV compatible con Google Sheets y Excel
 */
export function exportRecordsToCSV(records: ConduceRecord[]) {
  if (records.length === 0) {
    alert('No hay conduces registrados aún para exportar.');
    return;
  }

  const headers = [
    'Numero Conduce',
    'Fecha',
    'Cliente',
    'Cedula',
    'Telefono',
    'Saldo Inicial',
    'Total Cogido',
    'Devuelta Saldo Restante',
    'Productos Resumen'
  ];

  const rows = records.map((r) => [
    `"${r.conduceNumber}"`,
    `"${r.formattedDate}"`,
    `"${r.client.name.replace(/"/g, '""')}"`,
    `"${r.client.documentId}"`,
    `"${r.client.phone || ''}"`,
    r.initialBalance.toFixed(2),
    r.totalCogido.toFixed(2),
    r.devuelta.toFixed(2),
    `"${r.items.map((it) => `${it.quantity} ${it.unit} ${it.name}`).join('; ').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Conduces_Ventas_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
