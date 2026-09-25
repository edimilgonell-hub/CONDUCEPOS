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
  Trash2,
  Laptop
} from 'lucide-react';
import { exportRecordsToCSV } from '../services/googleSheetsService';

interface ConduceHistoryModalProps {
  records: ConduceRecord[];
  onSelectRecord: (record: ConduceRecord) => void;
  onEditRecord?: (record: ConduceRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onClearAllRecords?: () => void;
  onResyncRecord: (record: ConduceRecord) => void;
  onClose: () => void;
  isSyncingId?: string | null;
  onRefreshCloud?: () => Promise<void> | void;
  isRefreshingCloud?: boolean;
}

export const ConduceHistoryModal: React.FC<ConduceHistoryModalProps> = ({
  records,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onClearAllRecords,
  onResyncRecord,
  onClose,
  isSyncingId,
  onRefreshCloud,
  isRefreshingCloud
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<ConduceRecord | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

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
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Historial de Conduces Emitidos
                </h2>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-600/60 uppercase">
                  Multi-PC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualización centralizada de todas las computadoras ({records.length} registros)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshCloud && (
              <button
                type="button"
                onClick={onRefreshCloud}
                disabled={isRefreshingCloud}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                title="Sincronizar conduces de todas las computadoras"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar Nube</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => exportRecordsToCSV(records)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title="Exportar a CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            {onClearAllRecords && records.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 transition cursor-pointer"
                title="Vaciar todos los conduces de prueba"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Vaciar Todo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-PC Live Banner */}
        <div className="bg-emerald-950/90 text-emerald-200 px-4 py-2 border-b border-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Red Compartida Multi-PC:</strong> Los conduces creados desde otras computadoras o celulares se sincronizan y aparecen aquí automáticamente.
            </span>
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
              <p className="text-xs text-slate-400 mt-1">
                Los conduces emitidos en esta u otras computadoras aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {filtered.map((record) => (
                <div
                  key={record.id}
                  className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {record.conduceNumber}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {record.formattedDate}
                      </span>
                      {record.syncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Google Sheets</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>Pendiente Sheets</span>
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-slate-800">
                      {record.client.name}
                      {record.client.documentId && (
                        <span className="font-normal text-slate-500 text-xs ml-2">
                          Doc: {record.client.documentId}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {record.items.length} artículos | Total Cogido:{' '}
                      <strong className="text-rose-600 font-bold font-mono">
                        ${record.totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </strong>{' '}
                      | Saldo Restante:{' '}
                      <strong className="text-emerald-700 font-bold font-mono">
                        ${record.devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {onEditRecord && (
                      <button
                        type="button"
                        onClick={() => onEditRecord(record)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Editar conduce"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Editar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectRecord(record)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                      title="Reimprimir los 2 recibos de 80mm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reimprimir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onResyncRecord(record)}
                      disabled={isSyncingId === record.id}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition"
                      title="Sincronizar a Google Sheets"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isSyncingId === record.id ? 'animate-spin text-teal-600' : ''}`}
                      />
                    </button>

                    {onDeleteRecord && (
                      <button
                        type="button"
                        onClick={() => setRecordToDelete(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                        title="Eliminar conduce definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* IN-APP CONFIRMATION DIALOG FOR SAFE DELETION */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              ¿Eliminar Conduce {recordToDelete.conduceNumber}?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Esta acción eliminará el conduce del cliente <strong>{recordToDelete.client.name}</strong> por un monto de <strong>${recordToDelete.totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> de todas las computadoras y restablecerá su cupo.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteRecord && recordToDelete) {
                    onDeleteRecord(recordToDelete.id);
                  }
                  setRecordToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION DIALOG FOR CLEAR ALL */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-rose-300 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              ¿Vaciar Todo el Historial?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Se borrarán todos los conduces de prueba del sistema. Los cupos de <strong>$25,000.00</strong> de los clientes volverán a estar 100% disponibles.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllRecords) {
                    onClearAllRecords();
                  }
                  setShowClearAllConfirm(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition cursor-pointer"
              >
                Sí, Vaciar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
