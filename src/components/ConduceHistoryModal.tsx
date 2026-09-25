import React, { useState } from 'react';
import { ConduceRecord } from '../types';
import {
  History,
  Search,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Edit3,
  Trash2
} from 'lucide-react';
import { exportRecordsToCSV } from '../services/googleSheetsService';

interface ConduceHistoryModalProps {
  records: ConduceRecord[];
  onSelectRecord: (record: ConduceRecord) => void;
  onEditRecord?: (record: ConduceRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onResyncRecord: (record: ConduceRecord) => void;
  onClose: () => void;
  isSyncingId?: string | null;
}

export const ConduceHistoryModal: React.FC<ConduceHistoryModalProps> = ({
  records,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onResyncRecord,
  onClose,
  isSyncingId
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.conduceNumber.toLowerCase().includes(term) ||
      r.client.name.toLowerCase().includes(term) ||
      (r.client.documentId && r.client.documentId.toLowerCase().includes(term)) ||
      r.formattedDate.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Historial de Conduces Emitidos
              </h2>
              <p className="text-xs text-slate-400">
                Consulta, edita, elimina o reimprime los 2 recibos ({records.length} registros)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportRecordsToCSV(records)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title="Exportar a CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nº Conduce, nombre del cliente o documento..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table / List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">No se encontraron registros de conduces</p>
              <p className="text-xs text-slate-400 mt-1">Los conduces emitidos aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {filtered.map((record) => (
                <div
                  key={record.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {record.conduceNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {record.formattedDate}
                      </span>
                      {record.syncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> En Google Sheets
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Pendiente Sheets
                        </span>
                      )}
                    </div>

                    <div className="mt-1 font-bold text-xs sm:text-sm text-slate-800">
                      {record.client.name}
                      {record.client.documentId && (
                        <span className="text-slate-500 font-normal ml-2 text-xs">
                          ({record.client.documentId})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {record.items.map((it) => `${it.quantity} ${it.unit} ${it.name}`).join(', ')}
                    </div>

                    {record.notes && (
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate italic">
                        Nota: {record.notes}
                      </div>
                    )}
                  </div>

                  {/* Financial amounts */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs">
                    <div className="text-slate-500">
                      Cogido: <strong className="text-rose-600 font-mono">${record.totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Devuelta: <span className="font-mono">${record.devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Resync to Google Sheets */}
                    <button
                      type="button"
                      onClick={() => onResyncRecord(record)}
                      disabled={isSyncingId === record.id}
                      className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                      title="Sincronizar a Google Sheets"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingId === record.id ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Edit Conduce */}
                    {onEditRecord && (
                      <button
                        type="button"
                        onClick={() => onEditRecord(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition"
                        title="Editar información, productos o saldo del conduce"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Editar</span>
                      </button>
                    )}

                    {/* View & Print Receipts */}
                    <button
                      type="button"
                      onClick={() => onSelectRecord(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
                      title="Ver e imprimir ticket térmico 80mm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ver Recibos</span>
                    </button>

                    {/* Delete Conduce */}
                    {onDeleteRecord && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Estás seguro de que deseas eliminar el conduce "${record.conduceNumber}" de ${record.client.name}?`
                            )
                          ) {
                            onDeleteRecord(record.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Eliminar conduce"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
