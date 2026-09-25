import React, { useState, useRef, useEffect } from 'react';
import { Client, ConduceRecord } from '../types';
import { getClientBalanceInfo } from '../utils/balanceUtils';
import { Search, AlertTriangle, X, CreditCard, Users, ShieldAlert, History, CheckCircle } from 'lucide-react';

interface ClientSectionProps {
  client: Client;
  onClientChange: (updated: Client) => void;
  frequentClients: Client[];
  records: ConduceRecord[];
  totalCogido: number;
  onOpenClientManager?: () => void;
  onViewClientHistory?: (clientName: string) => void;
}

export const ClientSection: React.FC<ClientSectionProps> = ({
  client,
  onClientChange,
  frequentClients,
  records,
  totalCogido,
  onOpenClientManager,
  onViewClientHistory
}) => {
  // Balance calculations considering previous conduces of this client
  const clientBalance = getClientBalanceInfo(client, records);
  const creditLimit = clientBalance.creditLimit;
  const saldoDisponible = clientBalance.saldoDisponible;
  const devuelta = saldoDisponible - totalCogido;

  // Limits
  const isConduceOverLimit = totalCogido > 25000;
  const isClientOverLimit = totalCogido > saldoDisponible;
  const isAnyOverLimit = isConduceOverLimit || isClientOverLimit;

  // Percentage of client's total 25k limit consumed (previous + current)
  const totalClientConsumption = clientBalance.consumoAnterior + totalCogido;
  const percentUsed = Math.min(100, Math.max(0, (totalClientConsumption / creditLimit) * 100));

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
      initialBalance: selected.initialBalance || 25000
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
            <p className="text-[11px] text-slate-400">Control estricto de cupo $25,000 por cliente y por conduce</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenClientManager && (
            <button
              type="button"
              onClick={onOpenClientManager}
              className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition cursor-pointer"
              title="Abrir directorio de clientes"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directorio</span>
            </button>
          )}

          {client.name && (
            <button
              type="button"
              onClick={handleClearClient}
              className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cambiar</span>
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
                <span>Resultados de Búsqueda</span>
                <span>Usa ↑ ↓ y Enter</span>
              </div>

              {filteredClients.map((c, idx) => {
                const isSelected = highlightedIndex === idx;
                const cInfo = getClientBalanceInfo(c, records);
                const hasExhausted = cInfo.saldoDisponible <= 0;

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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded block ${
                        hasExhausted
                          ? 'bg-rose-100 text-rose-800'
                          : cInfo.consumoAnterior > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Disp: ${cInfo.saldoDisponible.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                      </span>
                      {cInfo.conducesPrevios.length > 0 && (
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {cInfo.conducesPrevios.length} conduce(s) previo(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Option to create new client on the fly if query entered */}
              {query.trim().length > 0 && (
                <div
                  onClick={() => handleCreateNewClientFromQuery(query)}
                  className="p-3 bg-emerald-50/70 hover:bg-emerald-100 cursor-pointer text-emerald-900 flex items-center justify-between border-t border-emerald-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      +
                    </span>
                    <span className="text-xs font-bold">
                      Registrar nuevo cliente: <span className="underline">"{query.trim()}"</span>
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Cupo $25,000
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Client Fields (Document & Phone) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Cédula o RNC
            </label>
            <input
              type="text"
              value={client.documentId}
              onChange={(e) => onClientChange({ ...client, documentId: e.target.value })}
              placeholder="001-0000000-0"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={client.phone || ''}
              onChange={(e) => onClientChange({ ...client, phone: e.target.value })}
              placeholder="(809) 000-0000"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* COMPREHENSIVE CLIENT CREDIT & CONDUCE LIMIT STATUS CARD */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            isAnyOverLimit
              ? 'bg-rose-50 border-rose-300 shadow-sm'
              : clientBalance.saldoDisponible <= 0 && client.name.trim()
              ? 'bg-amber-50 border-amber-300'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <CreditCard className={`w-4 h-4 ${isAnyOverLimit ? 'text-rose-600' : 'text-emerald-400'}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${isAnyOverLimit ? 'text-rose-900' : 'text-white'}`}>
                Control de Cupo y Saldo del Cliente
              </span>
            </div>

            {clientBalance.conducesPrevios.length > 0 && onViewClientHistory && (
              <button
                type="button"
                onClick={() => onViewClientHistory(client.name)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver {clientBalance.conducesPrevios.length} conduce(s) previo(s)</span>
              </button>
            )}
          </div>

          {/* 4-Box Financial breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {/* 1. Cupo Asignado al Cliente */}
            <div className={`p-2 rounded-lg ${isAnyOverLimit ? 'bg-white border border-slate-200' : 'bg-slate-800/80 border border-slate-700'}`}>
              <div className={`text-[10px] uppercase font-bold ${isAnyOverLimit ? 'text-slate-600' : 'text-slate-400'}`}>
                Cupo del Cliente
              </div>
              <div className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${isAnyOverLimit ? 'text-slate-800' : 'text-slate-100'}`}>
                ${creditLimit.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* 2. Consumo en Conduces Previos */}
            <div className={`p-2 rounded-lg ${isAnyOverLimit ? 'bg-white border border-slate-200' : 'bg-slate-800/80 border border-slate-700'}`}>
              <div className={`text-[10px] uppercase font-bold ${isAnyOverLimit ? 'text-amber-700' : 'text-amber-400'}`}>
                Consumo Previo
              </div>
              <div className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${isAnyOverLimit ? 'text-amber-800' : 'text-amber-300'}`}>
                -${clientBalance.consumoAnterior.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* 3. Saldo Disponible Actual del Cliente */}
            <div className={`p-2 rounded-lg ${
              saldoDisponible <= 0
                ? 'bg-rose-100 border border-rose-300'
                : isAnyOverLimit
                ? 'bg-white border border-slate-200'
                : 'bg-emerald-950/80 border border-emerald-500/60'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${
                saldoDisponible <= 0 ? 'text-rose-700' : isAnyOverLimit ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                Disponible Cliente
              </div>
              <div className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${
                saldoDisponible <= 0 ? 'text-rose-700' : isAnyOverLimit ? 'text-emerald-800' : 'text-emerald-300'
              }`}>
                ${saldoDisponible.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* 4. Restante tras Este Conduce */}
            <div className={`p-2 rounded-lg ${
              isAnyOverLimit
                ? 'bg-rose-200 border border-rose-400'
                : 'bg-slate-800/90 border border-slate-700'
            }`}>
              <div className={`text-[10px] uppercase font-bold ${
                isAnyOverLimit ? 'text-rose-800' : 'text-sky-400'
              }`}>
                Saldo Restante
              </div>
              <div className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${
                isAnyOverLimit ? 'text-rose-800' : 'text-sky-300'
              }`}>
                ${devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Progress bar of client cupo */}
          <div className="mt-3">
            <div className={`flex justify-between text-[10px] font-semibold mb-1 ${isAnyOverLimit ? 'text-rose-950' : 'text-slate-300'}`}>
              <span>Consumo total acumulado del cliente:</span>
              <span className="font-mono">
                {percentUsed.toFixed(1)}% (${totalClientConsumption.toLocaleString()} / ${creditLimit.toLocaleString()})
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isAnyOverLimit
                    ? 'bg-rose-600 w-full animate-pulse'
                    : percentUsed > 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              ></div>
            </div>
          </div>

          {/* Specific Error Alerts */}
          {isConduceOverLimit && (
            <div className="mt-2.5 p-2.5 bg-rose-100 border border-rose-400 rounded-lg text-rose-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>⚠️ LÍMITE POR CONDUCE EXCEDIDO:</strong>
                <p className="mt-0.5">
                  El monto de este conduce individual (${totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })})
                  NO puede ser mayor a $25,000.00. Excede por ${(totalCogido - 25000).toLocaleString('es-DO', { minimumFractionDigits: 2 })}.
                </p>
              </div>
            </div>
          )}

          {!isConduceOverLimit && isClientOverLimit && (
            <div className="mt-2.5 p-2.5 bg-rose-100 border border-rose-400 rounded-lg text-rose-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>⚠️ LÍMITE TOTAL DEL CLIENTE EXCEDIDO:</strong>
                <p className="mt-0.5">
                  Este cliente ya consumió <strong>${clientBalance.consumoAnterior.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> en conduces anteriores.
                  Solo le quedan disponibles <strong>${saldoDisponible.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> de su cupo de $25,000.00.
                  Este conduce excede su crédito disponible por <strong>${(totalCogido - saldoDisponible).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>.
                </p>
              </div>
            </div>
          )}

          {!isAnyOverLimit && saldoDisponible === 0 && client.name.trim() && (
            <div className="mt-2.5 p-2.5 bg-amber-100 border border-amber-400 rounded-lg text-amber-950 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Este cliente ya agotó completamente su cupo de $25,000.00 en sus conduces anteriores. No tiene saldo disponible para nuevos conduces.
              </span>
            </div>
          )}

          {!isAnyOverLimit && clientBalance.conducesPrevios.length === 0 && client.name.trim() && (
            <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 opacity-90">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Cliente sin consumos previos. Tiene su cupo de $25,000.00 intacto.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
