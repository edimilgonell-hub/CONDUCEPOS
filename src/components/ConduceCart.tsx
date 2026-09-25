import React from 'react';
import { CartItem, Client, ConduceRecord } from '../types';
import { getClientBalanceInfo } from '../utils/balanceUtils';
import { Trash2, Plus, Minus, Printer, AlertOctagon, FileCheck, ShoppingCart, Sparkles, ShieldAlert } from 'lucide-react';

interface ConduceCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  autoPrintEnabled: boolean;
  onToggleAutoPrint: (enabled: boolean) => void;
  onEmitConduce: () => void;
  client: Client;
  records: ConduceRecord[];
}

export const ConduceCart: React.FC<ConduceCartProps> = ({
  items,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onClearCart,
  notes,
  onNotesChange,
  autoPrintEnabled,
  onToggleAutoPrint,
  onEmitConduce,
  client,
  records
}) => {
  // Accumulated client balance check
  const clientBalance = getClientBalanceInfo(client, records);
  const creditLimit = clientBalance.creditLimit;
  const saldoDisponible = clientBalance.saldoDisponible;

  const CONDUCE_MAX = 25000;
  const totalCogido = items.reduce((acc, it) => acc + it.total, 0);
  const devuelta = saldoDisponible - totalCogido;

  // Dual limit validations
  const isConduceOverLimit = totalCogido > CONDUCE_MAX;
  const isClientOverLimit = totalCogido > saldoDisponible;
  const isOverLimit = isConduceOverLimit || isClientOverLimit;
  const isZero = totalCogido <= 0 || items.length === 0;
  const isClientMissing = !client.name || !client.name.trim();

  const canEmit = !isOverLimit && !isZero && !isClientMissing;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
            3
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase">Detalle del Conduce</h2>
            <p className="text-[11px] text-slate-400">Verifica artículos, saldo de $25,000 y devuelta</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar</span>
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100 min-h-[220px] max-h-[350px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-600">No hay productos en el conduce</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Selecciona productos del catálogo a la izquierda o agrégalos con el buscador.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  ${item.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })} / {item.unit}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 sm:p-1.5 hover:bg-slate-200 text-slate-600 transition"
                    title="Disminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onSetQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs sm:text-sm font-bold bg-white focus:outline-none py-1 border-x border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1 sm:p-1.5 hover:bg-slate-200 text-slate-600 transition"
                    title="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="w-20 text-right font-mono font-bold text-xs sm:text-sm text-slate-900">
                  ${item.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 transition"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Optional notes */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notas u observaciones del conduce (opcional)..."
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Financial Summary & Devuelta */}
      <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Cupo Total Asignado al Cliente:</span>
            <span className="font-mono font-bold text-slate-200">
              ${creditLimit.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {clientBalance.consumoAnterior > 0 && (
            <>
              <div className="flex justify-between items-center text-amber-300">
                <span>Consumido en Conduces Previos ({clientBalance.conducesPrevios.length}):</span>
                <span className="font-mono font-bold text-amber-400">
                  -${clientBalance.consumoAnterior.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Saldo Disponible antes de este conduce:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${saldoDisponible.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center text-rose-300 font-medium pt-1 border-t border-slate-800">
            <span>Total de Este Conduce:</span>
            <span className="font-mono font-black text-sm text-rose-400">
              - ${totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs uppercase font-black text-emerald-400 tracking-wider block">
                Saldo Restante / Devuelta Cliente:
              </span>
              <span className="text-[10px] text-slate-400">Control interno del negocio</span>
            </div>
            <span
              className={`font-mono font-black text-lg sm:text-xl px-2.5 py-0.5 rounded ${
                isOverLimit
                  ? 'bg-rose-950 text-rose-400 border border-rose-600'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
              }`}
            >
              ${devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Validation Warning Messages */}
        {isConduceOverLimit && (
          <div className="p-2.5 bg-rose-950/90 border border-rose-600 rounded-lg text-rose-200 text-xs flex items-start gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">¡EL CONDUCE NO PUEDE PASAR DE $25,000.00!</strong>
              <span className="text-[11px]">
                Este conduce suma ${totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.
                Reduce artículos o cantidades.
              </span>
            </div>
          </div>
        )}

        {!isConduceOverLimit && isClientOverLimit && (
          <div className="p-2.5 bg-rose-950/90 border border-rose-600 rounded-lg text-rose-200 text-xs flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">¡EXCEDE EL LÍMITE DEL CLIENTE!</strong>
              <span className="text-[11px]">
                Al cliente solo le quedan ${saldoDisponible.toLocaleString('es-DO', { minimumFractionDigits: 2 })} disponibles
                de sus $25,000.00 (ya consumió ${clientBalance.consumoAnterior.toLocaleString()} en {clientBalance.conducesPrevios.length} conduces).
              </span>
            </div>
          </div>
        )}

        {isClientMissing && !isZero && (
          <div className="p-2 bg-amber-950/80 border border-amber-600/80 rounded-lg text-amber-200 text-xs">
            ⚠️ Selecciona o ingresa el nombre del cliente en el Paso 1 para emitir.
          </div>
        )}

        {/* Auto-print toggle & Action Button */}
        <div className="pt-2 flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => onToggleAutoPrint(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span>Abrir ventana de impresión 80mm automáticamente</span>
          </label>

          <button
            type="button"
            disabled={!canEmit}
            onClick={onEmitConduce}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              canEmit
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50 hover:shadow-emerald-700/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {autoPrintEnabled ? <Printer className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
            <span>{isOverLimit ? 'Límite Excedido (Bloqueado)' : 'EMITIR E IMPRIMIR CONDUCE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
