import { ConduceRecord } from '../types';

const SPREADSHEET_ID_KEY = 'conduce_google_spreadsheet_id_v1';
const SPREADSHEET_URL_KEY = 'conduce_google_spreadsheet_url_v1';

export const getSavedSpreadsheetInfo = () => {
  return {
    id: localStorage.getItem(SPREADSHEET_ID_KEY) || null,
    url: localStorage.getItem(SPREADSHEET_URL_KEY) || null
  };
};

export const saveSpreadsheetInfo = (id: string, url: string) => {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
  localStorage.setItem(SPREADSHEET_URL_KEY, url);
};

/**
 * Obtiene la hoja existente o crea una nueva automáticamente en el Google Drive del usuario.
 */
export async function getOrCreateConduceSpreadsheet(
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const saved = getSavedSpreadsheetInfo();

  if (saved.id) {
    try {
      // Verificar si existe y tenemos acceso
      const verifyRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${saved.id}?fields=spreadsheetId,properties.title`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (verifyRes.ok) {
        return {
          spreadsheetId: saved.id,
          spreadsheetUrl: saved.url || `https://docs.google.com/spreadsheets/d/${saved.id}/edit`
        };
      }
    } catch (e) {
      console.warn('Hoja anterior no accesible, creando una nueva...');
    }
  }

  // Crear una nueva hoja con diseño ejecutivo
  const createPayload = {
    properties: {
      title: 'MARTINEZ BATISTA - Control de Conduces y Ventas'
    },
    sheets: [
      {
        properties: {
          title: 'Conduces',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Error al crear la hoja en Google Drive: ${errorText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Inicializar encabezados con formato
  const headers = [
    'Fecha y Hora',
    'Nº Conduce',
    'Cliente',
    'Cédula / RNC',
    'Teléfono',
    'Saldo Asignado ($)',
    'Total Cogido ($)',
    'Devuelta / Saldo Restante ($)',
    'Cant. Artículos',
    'Detalle de Productos (18% ITBIS Incluido)',
    'Notas'
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Conduces!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Conduces!A1:K1',
        majorDimension: 'ROWS',
        values: [headers]
      })
    }
  );

  // Aplicar formato de estilo al encabezado
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 11
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.1, green: 0.16, blue: 0.24 }, // Navy dark
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }
        ]
      })
    });
  } catch (e) {
    console.warn('No se pudo aplicar estilo visual opcional:', e);
  }

  saveSpreadsheetInfo(spreadsheetId, spreadsheetUrl);
  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Agrega un nuevo conduce como fila en la hoja de Google Sheets.
 */
export async function appendConduceToGoogleSheet(
  conduce: ConduceRecord,
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string }> {
  const itemCount = conduce.items.reduce((acc, it) => acc + it.quantity, 0);
  const itemsDetail = conduce.items
    .map(
      (it) =>
        `${it.quantity} ${it.unit} ${it.name} ($${it.unitPrice.toLocaleString('es-DO', {
          minimumFractionDigits: 2
        })} c/u = $${it.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })})`
    )
    .join(' | ');

  const row = [
    conduce.formattedDate,
    conduce.conduceNumber,
    conduce.client.name,
    conduce.client.documentId,
    conduce.client.phone || '',
    conduce.initialBalance,
    conduce.totalCogido,
    conduce.devuelta,
    itemCount,
    itemsDetail,
    conduce.notes || ''
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Conduces!A:K:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Conduces!A:K',
        majorDimension: 'ROWS',
        values: [row]
      })
    }
  );

  if (!appendRes.ok) {
    const errorText = await appendRes.text();
    throw new Error(`Error al registrar fila en Google Sheets: ${errorText}`);
  }

  return {
    success: true,
    message: 'Conduce guardado con éxito en tu Google Sheets.'
  };
}

/**
 * Lee los conduces registrados en Google Sheets para sincronizar entre distintas computadoras.
 */
export async function fetchConducesFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<ConduceRecord[]> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Conduces!A2:K`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const rows: any[][] = data.values || [];

    return rows.map((r, idx) => {
      const formattedDate = r[0] || '';
      const conduceNumber = r[1] || `CND-${idx + 1}`;
      const clientName = r[2] || 'Cliente';
      const clientDoc = r[3] || '';
      const clientPhone = r[4] || '';
      const initialBalance = parseFloat(String(r[5] || '25000').replace(/[^0-9.-]+/g, '')) || 25000;
      const totalCogido = parseFloat(String(r[6] || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const devuelta = parseFloat(String(r[7] || '0').replace(/[^0-9.-]+/g, '')) || (initialBalance - totalCogido);
      const notes = r[10] || '';

      return {
        id: `sheets-${conduceNumber}`,
        conduceNumber,
        date: new Date().toISOString(),
        formattedDate,
        client: {
          id: `cli-${clientName.toLowerCase().replace(/\s+/g, '-')}`,
          name: clientName,
          documentId: clientDoc,
          phone: clientPhone,
          initialBalance
        },
        items: [],
        initialBalance,
        totalCogido,
        devuelta,
        notes,
        syncedToGoogleSheets: true
      };
    });
  } catch (e) {
    console.error('Error fetching conduces from Google Sheet:', e);
    return [];
  }
}

/**
 * Elimina una fila de conduce directamente usando la API de Google Sheets
 */
export async function deleteConduceFromGoogleDriveSheet(
  accessToken: string,
  spreadsheetId: string,
  conduceNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Obtener la columna B (Nº Conduce) y el sheetId de la hoja "Conduces"
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!metaRes.ok) throw new Error('No se pudo acceder a los metadatos de la hoja.');
    const metaData = await metaRes.json();
    const conducesSheet = metaData.sheets?.find(
      (s: any) => s.properties?.title === 'Conduces'
    ) || metaData.sheets?.[0];
    const sheetId = conducesSheet?.properties?.sheetId ?? 0;

    // 2. Leer valores de la columna B
    const valRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Conduces!B:B`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!valRes.ok) throw new Error('No se pudo leer la lista de conduces.');
    const valData = await valRes.json();
    const rows: string[][] = valData.values || [];

    // 3. Buscar índices que coincidan
    const target = String(conduceNumber).trim();
    let rowIndex = -1;
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i] && String(rows[i][0]).trim() === target) {
        rowIndex = i; // 0-based
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: `Conduce ${conduceNumber} no encontrado en Google Sheets.` };
    }

    // 4. Eliminar la fila vía batchUpdate
    const delRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1
                }
              }
            }
          ]
        })
      }
    );

    if (!delRes.ok) {
      const err = await delRes.text();
      throw new Error(`Error al eliminar fila: ${err}`);
    }

    return { success: true, message: `Conduce ${conduceNumber} eliminado de Google Sheets.` };
  } catch (err: any) {
    console.error('Error deleteConduceFromGoogleDriveSheet:', err);
    return { success: false, message: err?.message || 'Error al eliminar en Google Sheets.' };
  }
}

/**
 * Limpia todas las filas de conduces de Google Sheets conservando los encabezados
 */
export async function clearAllConducesFromGoogleDriveSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Conduces!A2:K:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!clearRes.ok) throw new Error('Error al vaciar datos en Google Sheets.');
    return { success: true, message: 'Filas eliminadas de Google Sheets.' };
  } catch (err: any) {
    console.error('Error clearAllConducesFromGoogleDriveSheet:', err);
    return { success: false, message: err?.message || 'Error al vaciar Google Sheets.' };
  }
}
