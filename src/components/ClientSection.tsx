import React, { useState, useRef, useEffect } from 'react';
import { Client } from '../types';
import { Search, UserCheck, AlertTriangle, CheckCircle2, X, PlusCircle, CreditCard, Phone, User, Users } from 'lucide-react';

interface ClientSectionProps {
  client: Client;
  onClientChange: (updated: Client) => void;
  frequentClients: Client[];
  totalCogido: number;
  previousSpent: number;
  onOpenClientManager?: () => void;
}

export const ClientSection: React.FC<ClientSectionProps> = ({
  client,
  onClientChange,
  frequentClients,
  totalCogido,
  previousSpent,
  onOpenClientManager
}) => {
  const balance = 25000;
  const cumulativeTotal = previousSpent + totalCogido;
  const devuelta = balance - cumulativeTotal;
  const percentUsed = Math.min(100, Math.max(0, (cumulativeTotal / balance) * 100));
  const isOverLimit = Math.round(cumulativeTotal * 100) > balance * 100;
  const isAtLimit = Math.round(previousSpent * 100) >= balance * 100;

  // Search state
  const [query, setQuery] = useState(client.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync input when active client changes externally (e.g., reset)
  useEffect(() => {
    if (!client.name) {
      setQuery('');
    } else if (client.name !== query && !isOpen) {
      setQuery(client.name);
    }
  }, [client.name, isOpen]);

  // Filter clients automatically as user types
  const filteredClients = frequentClients.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.documentId.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (selected: Client) => {
    onClientChange({
      ...selected,
      initialBalance: 25000
    });
    setQuery(selected.name);
    setIsOpen(false);
  };

  const handleCreateNewClientFromQuery = (name: string) => {
    if (!name.trim()) return;
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: name.trim(),
      documentId: '',
      phone: '',
      initialBalance: 25000
    };
    onClientChange(newClient);
    setQuery(name.trim());
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (filteredClients.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + (filteredClients.length + 1)) % (filteredClients.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredClients.length > 0 && highlightedIndex < filteredClients.length) {
        handleSelectClient(filteredClients[highlightedIndex]);
      } else if (query.trim()) {
        handleCreateNewClientFromQuery(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClearClient = () => {
    setQuery('');
    onClientChange({
      id: `cli-${Date.now()}`,
      name: '',
      documentId: '',
      phone: '',
      initialBalance: 25000
    });
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
            1
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase">Buscador Automático de Cliente</h2>
            <p className="text-[11px] text-slate-400">Escribe nombre o documento para buscar automáticamente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenClientManager && (
            <button
              type="button"
              onClick={onOpenClientManager}
              className="text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer shadow-xs"
              title="Gestionar clientes: agregar, editar o eliminar"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gestionar Clientes</span>
            </button>
          )}

          {client.name && (
            <button
              type="button"
              onClick={handleClearClient}
              className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cambiar Cliente</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* AUTOMATIC CLIENT SEARCH INPUT */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Buscar Cliente (Nombre, Cédula o RNC) <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Search className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
                // Also update client name live if typing a new name
                onClientChange({ ...client, name: e.target.value });
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe para buscar cliente automáticamente o presiona Enter para crear nuevo..."
              className="w-full pl-11 pr-10 py-2.5 text-sm sm:text-base border-2 border-slate-300 focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition font-medium text-slate-900"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearClient}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                <span>Resultados de Búsqueda Automática</span>
                <span>Usa ↑ ↓ y Enter</span>
              </div>

              {filteredClients.map((c, idx) => {
                const isSelected = highlightedIndex === idx;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-4 py-2.5 cursor-pointer transition flex items-center justify-between border-b border-slate-100 last:border-b-0 ${
                      isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {c.documentId && <span>Doc: {c.documentId}</span>}
                          {c.phone && <span>Tel: {c.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Saldo: $25,000.00
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Option to create new client on the fly if query entered */}
              {query.trim().length > 0 && (
                <div
                  onClick={() => handleCreateNewClientFromQuery(query)}
                  onMouseEnter={() => setHighlightedIndex(filteredClients.length)}
                  className={`px-4 py-3 cursor-pointer transition flex items-center gap-2.5 bg-slate-50 text-slate-800 border-t border-slate-200 ${
                    highlightedIndex === filteredClients.length ? 'bg-emerald-100/70 text-emerald-900 font-bold' : ''
                  }`}
                >
                  <PlusCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    Usar como nuevo cliente: <strong>"{query.trim()}"</strong>
                    <span className="block text-[11px] text-slate-500">
                      Presiona Enter para autocompletar con saldo de $25,000.00
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Client Badge / Quick Edit Fields */}
        {client.name && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Cliente Cargado Automáticamente:
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                Saldo: $25,000.00
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Cédula / Documento:</span>
                <input
                  type="text"
                  value={client.documentId}
                  onChange={(e) => onClientChange({ ...client, documentId: e.target.value })}
                  placeholder="Cédula o RNC (opcional)"
                  className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Teléfono:</span>
                <input
                  type="text"
                  value={client.phone || ''}
                  onChange={(e) => onClientChange({ ...client, phone: e.target.value })}
                  placeholder="Teléfono (opcional)"
                  className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Balance Dashboard for the Client */}
        <div
          className={`p-4 rounded-xl border transition ${
            isOverLimit
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              {isOverLimit ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span className="text-rose-700">¡LÍMITE EXCEDIDO!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Control de Saldo Asignado</span>
                </>
              )}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                isOverLimit
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
              }`}
            >
              Máx: $25,000.00
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Saldo Base */}
            <div
              className={`p-2 rounded-lg ${
                isOverLimit ? 'bg-white/60' : 'bg-slate-800/80 border border-slate-700'
              }`}
            >
              <div
                className={`text-[10px] uppercase font-bold ${
                  isOverLimit ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Saldo Inicial
              </div>
              <div
                className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${
                  isOverLimit ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                ${balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Total Cogido */}
            <div
              className={`p-2 rounded-lg ${
                isOverLimit ? 'bg-rose-100 border border-rose-300' : 'bg-slate-800/80 border border-slate-700'
              }`}
            >
              <div
                className={`text-[10px] uppercase font-bold ${
                  isOverLimit ? 'text-rose-700' : 'text-rose-300'
                }`}
              >
                Acumulado en este equipo
              </div>
              <div
                className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${
                  isOverLimit ? 'text-rose-700' : 'text-rose-400'
                }`}
              >
                ${cumulativeTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Devuelta / Saldo Restante */}
            <div
              className={`p-2 rounded-lg ${
                isOverLimit
                  ? 'bg-rose-200 border border-rose-400'
                  : 'bg-emerald-950/70 border border-emerald-600/60'
              }`}
            >
              <div
                className={`text-[10px] uppercase font-bold ${
                  isOverLimit ? 'text-rose-800' : 'text-emerald-400'
                }`}
              >
                Devuelta / Resto
              </div>
              <div
                className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${
                  isOverLimit ? 'text-rose-800' : 'text-emerald-300'
                }`}
              >
                ${devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-semibold mb-1 opacity-80">
              <span>Consumo del saldo asignado:</span>
              <span>
                {percentUsed.toFixed(1)}% ({cumulativeTotal.toLocaleString()} / 25,000)
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverLimit
                    ? 'bg-rose-600 w-full animate-pulse'
                    : percentUsed > 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              ></div>
            </div>
          </div>

          {isOverLimit && (
            <p className="mt-2 text-xs font-bold text-rose-700 bg-rose-100 p-2 rounded border border-rose-300 text-center">
              ⚠️ Las ventas acumuladas de este cliente superarían $25,000 por $
              {(cumulativeTotal - balance).toLocaleString('es-DO', { minimumFractionDigits: 2 })}.
              No se puede emitir este conduce.
            </p>
          )}
          {isAtLimit && !isOverLimit && (
            <p className="mt-2 text-xs font-bold text-rose-700 bg-rose-100 p-2 rounded border border-rose-300 text-center">
              Este cliente ya agotó su límite de $25,000. No se puede realizar otra venta.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
