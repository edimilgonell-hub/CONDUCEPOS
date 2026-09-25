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
