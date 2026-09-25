import React, { useState } from 'react';
import { ConduceRecord, CartItem, ProductItem } from '../types';
import {
  Edit3,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  X,
  RotateCcw,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface EditConduceModalProps {
  record: ConduceRecord;
  availableProducts: ProductItem[];
  onSave: (updatedRecord: ConduceRecord) => void;
  onClose: () => void;
}

export const EditConduceModal: React.FC<EditConduceModalProps> = ({
  record,
  availableProducts,
  onSave,
  onClose
}) => {
  const [clientName, setClientName] = useState(record.client.name);
  const [clientDoc, setClientDoc] = useState(record.client.documentId || '');
  const [clientPhone, setClientPhone] = useState(record.client.phone || '');
  const [notes, setNotes] = useState(record.notes || '');

  // Cloned items
  const [items, setItems] = useState<CartItem[]>(
    record.items.map((item) => ({ ...item }))
  );

  // Selected product to add to the existing conduce
  const [selectedProdId, setSelectedProdId] = useState('');
  const [addQty, setAddQty] = useState(1);

  const initialBalance = record.initialBalance || 25000;
  const totalCogido = items.reduce((acc, it) => acc + it.total, 0);
  const devuelta = initialBalance - totalCogido;
  const isOverLimit = totalCogido > initialBalance;

  const handleUpdateItemQty = (id: string, newQty: number) => {
    if (newQty <= 0) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, quantity: newQty, total: newQty * it.unitPrice }
          : it
      )
    );
  };

  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    if (newPrice < 0) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, unitPrice: newPrice, total: it.quantity * newPrice }
          : it
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = availableProducts.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const existingIndex = items.findIndex((it) => it.productId === prod.id);
    if (existingIndex >= 0) {
      handleUpdateItemQty(items[existingIndex].id, items[existingIndex].quantity + addQty);
    } else {
      const newItem: CartItem = {
        id: `edit-it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        name: prod.name,
        unit: prod.unit,
        unitPrice: prod.unitPrice,
        quantity: addQty,
        total: addQty * prod.unitPrice
      };
      setItems((prev) => [...prev, newItem]);
    }
    setSelectedProdId('');
    setAddQty(1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    if (items.length === 0) {
      alert('El conduce debe tener al menos un producto');
      return;
    }

    if (isOverLimit) {
      alert(`El total ($${totalCogido.toLocaleString()}) no puede sobrepasar los $${initialBalance.toLocaleString()}!`);
      return;
    }

    const updated: ConduceRecord = {
      ...record,
      client: {
        ...record.client,
        name: clientName.trim(),
        documentId: clientDoc.trim(),
        phone: clientPhone.trim()
      },
      items,
      totalCogido,
      devuelta,
      notes: notes.trim(),
      syncedToGoogleSheets: false // Mark as un-synced so it can be re-synced with updated values
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Editar Conduce: {record.conduceNumber}
              </h2>
              <p className="text-xs text-slate-400">
                Modifica los datos del cliente, agrega o elimina artículos y ajusta valores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Client Details Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Datos del Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Nombre del Cliente <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Cédula / RNC
                </label>
                <input
                  type="text"
                  value={clientDoc}
                  onChange={(e) => setClientDoc(e.target.value)}
                  placeholder="000-0000000-0"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="809-000-0000"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Add product to existing conduce */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Agregar Artículo a este Conduce
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[220px]">
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Selecciona un producto del catálogo...</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.unitPrice.toLocaleString('es-DO')} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-20">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-2 text-center text-xs sm:text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProdId}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Anexar</span>
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Artículos en el Conduce ({items.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Límite: ${initialBalance.toLocaleString()}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No hay artículos. Agrega al menos uno arriba.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Unidad: {item.unit}
                      </div>
                    </div>

                    {/* Qty control */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-500">Cant:</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItemQty(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-14 px-1.5 py-1 text-center font-bold font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Price control */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-500">Precio:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-1.5 py-1 text-right font-bold font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Item Total */}
                    <div className="w-20 text-right font-bold font-mono text-slate-900 shrink-0">
                      ${item.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition shrink-0"
                      title="Eliminar artículo del conduce"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Observaciones / Notas del Conduce
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de entrega, condiciones especiales, etc."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Calculation summary bar */}
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isOverLimit
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div>
              <span className="font-bold">Saldo Base:</span>{' '}
              <span className="font-mono">${initialBalance.toLocaleString()}</span>
              <span className="mx-2">•</span>
              <span className="font-bold">Total Cogido:</span>{' '}
              <span className="font-mono font-bold">${totalCogido.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase">Devuelta / Restante:</span>
              <span
                className={`font-mono font-black text-sm px-2 py-0.5 rounded border ${
                  isOverLimit
                    ? 'bg-rose-200 text-rose-900 border-rose-400'
                    : 'bg-emerald-200 text-emerald-900 border-emerald-400'
                }`}
              >
                ${devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {isOverLimit && (
            <div className="text-xs text-rose-700 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>¡Atención! El total no puede sobrepasar los $25,000.00 del saldo asignado.</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isOverLimit || items.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios del Conduce
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
