import React from 'react';
import { CartItem } from '../types';
import { Trash2, Plus, Minus, Printer, AlertOctagon, FileCheck, ShoppingCart, Sparkles } from 'lucide-react';

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
  clientName: string;
  previousSpent: number;
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
  clientName,
  previousSpent
}) => {
  const INITIAL_BALANCE = 25000;
  const totalCogido = items.reduce((acc, it) => acc + it.total, 0);
  const devuelta = INITIAL_BALANCE - previousSpent - totalCogido;
  const isOverLimit = Math.round((previousSpent + totalCogido) * 100) > INITIAL_BALANCE * 100;
  const isAtLimit = Math.round(previousSpent * 100) >= INITIAL_BALANCE * 100;
  const isZero = totalCogido <= 0 || items.length === 0;
  const canEmit = !isOverLimit && !isAtLimit && !isZero && clientName.trim().length > 0;

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
              Selecciona productos del catálogo a la izquierda o agrégalos con el botón "+ Producto Libre".
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 group">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-emerald-700 font-semibold">
                    ${item.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span>/ {item.unit}</span>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
                  title="Restar 1"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onSetQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-12 py-1 text-center font-mono font-bold text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
                  title="Sumar 1"
                >
                  <Plus className="w-3 h-3" />
                </button>

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
            <span>Saldo Asignado al Cliente:</span>
            <span className="font-mono font-bold text-slate-200">
              ${INITIAL_BALANCE.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center text-rose-300 font-medium">
            <span>Ventas anteriores en este equipo:</span>
            <span className="font-mono font-bold">${previousSpent.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-rose-300 font-medium">
            <span>Total Cogido (Facturado):</span>
            <span className="font-mono font-black text-sm text-rose-400">
              - ${totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs uppercase font-black text-emerald-400 tracking-wider block">
                Devuelta / Saldo Restante:
              </span>
              <span className="text-[10px] text-slate-400">Control interno del negocio</span>
            </div>
            <span className={`font-mono font-black text-lg sm:text-xl px-2.5 py-0.5 rounded ${
              isOverLimit
                ? 'bg-rose-950 text-rose-400 border border-rose-600'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
            }`}>
              ${devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Validation Warning Messages */}
        {isAtLimit && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-600/80 rounded-lg text-rose-200 text-xs">
            Este cliente ya agotó su límite acumulado de $25,000.00. Venta bloqueada.
          </div>
        )}
        {isOverLimit && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-600/80 rounded-lg text-rose-200 text-xs flex items-start gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">¡NO PUEDE PASAR DE $25,000.00!</strong>
              Las ventas de este equipo más esta venta exceden el límite por ${(previousSpent + totalCogido - INITIAL_BALANCE).toLocaleString('es-DO', { minimumFractionDigits: 2 })}. No se puede emitir otro conduce para este cliente.
            </div>
          </div>
        )}

        {!clientName.trim() && (
          <div className="p-2 bg-amber-950/70 border border-amber-600/60 rounded-lg text-amber-200 text-xs text-center">
            ⚠️ Ingrese el nombre del cliente en el Paso 1 para poder emitir.
          </div>
        )}

        {/* Auto print toggle */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => onToggleAutoPrint(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-800 border-slate-700 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-[11px] sm:text-xs">
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              Imprimir 2 recibos automáticamente al emitir
            </span>
          </label>
        </div>

        {/* Action Button: EMITIR CONDUCE */}
        <button
          type="button"
          onClick={onEmitConduce}
          disabled={!canEmit}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            canEmit
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-700/40 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <FileCheck className="w-5 h-5" />
          <span>Emitir Conduce e Imprimir 2 Recibos</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center italic">
          Recibo 1: Para el cliente (solo productos) • Recibo 2: Para la comercial (con devuelta y saldo)
        </p>
      </div>
    </div>
  );
};
