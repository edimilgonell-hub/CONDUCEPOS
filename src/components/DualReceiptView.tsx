import React, { useState } from 'react';
import { ConduceRecord } from '../types';
import { COMPANY_INFO } from '../data/mockProducts';
import {
  Printer,
  X,
  CheckCircle,
  Scissors,
  RefreshCw,
  Smartphone,
  CheckSquare,
  Square,
  HelpCircle
} from 'lucide-react';

interface DualReceiptViewProps {
  conduce: ConduceRecord;
  onClose: () => void;
  onPrint: () => void;
  onResync?: () => void;
  isSyncing?: boolean;
}

export const DualReceiptView: React.FC<DualReceiptViewProps> = ({
  conduce,
  onClose,
  onPrint,
  onResync,
  isSyncing = false
}) => {
  const [viewMode, setViewMode] = useState<'thermal80mm' | 'sideBySide'>('thermal80mm');
  // Disabled by default: page breaks cause thermal printers to feed 15cm of blank Letter paper!
  const [autoCutBetweenTickets, setAutoCutBetweenTickets] = useState(false);
  const [printTicketMode, setPrintTicketMode] = useState<'both' | 'client' | 'commerce'>('both');

  const handlePrintClick = () => {
    window.focus();
    onPrint();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="no-print bg-slate-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Impresión Térmica 80mm: {conduce.conduceNumber}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 font-bold border border-emerald-700">
                  Ancho 72mm/80mm Exacto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {COMPANY_INFO.name} • ITBIS 18% Incluido
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ticket Selector: Ambos vs Solo Cliente vs Solo Comercio */}
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs flex">
              <button
                type="button"
                onClick={() => setPrintTicketMode('both')}
                className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                  printTicketMode === 'both'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Imprime ambos tickets juntos en el rollo"
              >
                Ambos Tickets
              </button>
              <button
                type="button"
                onClick={() => setPrintTicketMode('client')}
                className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                  printTicketMode === 'client'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Imprime únicamente la copia informativa para el cliente"
              >
                Solo Cliente
              </button>
              <button
                type="button"
                onClick={() => setPrintTicketMode('commerce')}
                className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                  printTicketMode === 'commerce'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Imprime únicamente la liquidación con saldo y devuelta"
              >
                Solo Comercio
              </button>
            </div>

            {/* Auto-cut toggle (disabled by default to prevent blank paper feed) */}
            {printTicketMode === 'both' && (
              <button
                type="button"
                onClick={() => setAutoCutBetweenTickets(!autoCutBetweenTickets)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Actívalo solo si tu impresora térmica tiene guillotina automática compatible con salto de página"
              >
                {autoCutBetweenTickets ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Salto de página ({autoCutBetweenTickets ? 'Activo' : 'Desactivado - Ahorra papel'})</span>
              </button>
            )}

            {onResync && (
              <button
                type="button"
                onClick={onResync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
                title="Sincronizar a Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{conduce.syncedToGoogleSheets ? 'Re-enviar' : 'Enviar a Sheets'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-md hover:shadow-emerald-600/30 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir 80mm</span>
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

        {/* Informative Status Banner (Hidden on print) */}
        <div className="no-print bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>
              <strong>Para evitar que gaste papel de más:</strong> En la ventana de Chrome pon <strong>Márgenes: Ninguno (None)</strong> y en Tamaño de papel selecciona <strong>80(72.1) x Receipt</strong> o Rollo continuo (no "Carta/Letter").
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Imprimiendo: <strong>{printTicketMode === 'both' ? 'Ambos tickets' : printTicketMode === 'client' ? 'Copia Cliente' : 'Copia Comercio'}</strong></span>
          </div>
        </div>

        {/* Printable Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-300/60 flex justify-center">
          <div
            className={`print-receipt-sheet w-full transition-all ${
              viewMode === 'thermal80mm'
                ? 'max-w-[340px] flex flex-col gap-4'
                : 'max-w-4xl flex flex-col md:flex-row gap-6'
            }`}
          >
            {/* ============================================================== */}
            {/* TICKET 1: COPIA DEL CLIENTE (CONDUCE INFORMATIVO TÉRMICO 80MM) */}
            {/* ============================================================== */}
            {(printTicketMode === 'both' || printTicketMode === 'client') && (
              <div className="print-receipt-card bg-white p-3 sm:p-4 rounded-lg shadow-md border border-slate-300 font-mono text-slate-900 text-xs flex flex-col justify-between">
                <div>
                  {/* Header Comercial Oficial */}
                  <div className="text-center pb-2 border-b-2 border-dashed border-slate-800">
                    <h1 className="font-black text-sm uppercase tracking-tight leading-tight">
                      {COMPANY_INFO.name}
                    </h1>
                    <p className="text-[10px] text-slate-600 mt-0.5">{COMPANY_INFO.slogan}</p>
                    <p className="text-[10px] text-slate-600">{COMPANY_INFO.address}</p>
                    <p className="text-[10px] font-bold text-slate-800">
                      RNC: {COMPANY_INFO.rnc} • Tel: {COMPANY_INFO.phone}
                    </p>
                  </div>

                  {/* Subtitle Conduce Informativo */}
                  <div className="text-center my-2 py-1 bg-slate-100 rounded border border-slate-300">
                    <div className="font-black text-xs uppercase tracking-wider">
                      *** CONDUCE DE ENTREGA ***
                    </div>
                    <div className="text-[10px] font-bold text-slate-700">
                      COPIA CLIENTE (INFORMATIVO)
                    </div>
                  </div>

                  {/* Metadata Ticket */}
                  <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2">
                    <div className="flex justify-between">
                      <span>Nº CONDUCE:</span>
                      <strong className="font-bold">{conduce.conduceNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>FECHA:</span>
                      <span>{conduce.formattedDate}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="font-bold block">CLIENTE:</span>
                      <span className="font-black text-xs uppercase">{conduce.client.name}</span>
                      {conduce.client.documentId && (
                        <span className="block text-[10px] text-slate-600">Doc: {conduce.client.documentId}</span>
                      )}
                    </div>
                  </div>

                  {/* Notice: Solo productos despachados */}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-300 pb-1 flex justify-between">
                    <span>CANT / UNID</span>
                    <span>DESCRIPCIÓN PRODUCTO</span>
                  </div>

                  {/* Product list ONLY - No prices, No totals */}
                  <div className="divide-y divide-dotted divide-slate-300 text-xs py-1">
                    {conduce.items.map((item, idx) => (
                      <div key={idx} className="py-1 flex items-start justify-between gap-2">
                        <span className="font-black text-slate-900 shrink-0 w-12">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="font-medium text-slate-900 flex-1 text-right">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {conduce.notes && (
                    <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 text-[10px]">
                      <span className="font-bold">OBSERVACIONES:</span> {conduce.notes}
                    </div>
                  )}
                </div>

                {/* Signatures & Disclaimers */}
                <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-800 text-center">
                  <p className="text-[9px] text-slate-600 leading-tight mb-3">
                    * Documento informativo de despacho. Precios con 18% ITBIS incluido según cotización oficial. Sírvase verificar su mercancía antes de firmar.
                  </p>

                  {/* Firma del cliente */}
                  <div className="pt-4 border-t border-slate-800">
                    <div className="font-bold text-[11px] uppercase">
                      FIRMA DEL CLIENTE
                    </div>
                    <div className="text-[9px] text-slate-600 uppercase mt-0.5">
                      Recibido Conforme
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      Doc: {conduce.client.documentId || '_____________________'}
                    </div>
                  </div>

                  <div className="mt-2 text-[9px] text-slate-400">
                    ¡Gracias por su preferencia!
                  </div>
                </div>
              </div>
            )}

            {/* Thermal cut separator line */}
            {printTicketMode === 'both' && (
              <div className="thermal-tear-line my-1 text-center font-mono text-[10px] text-slate-700 select-none">
                <span className="bg-slate-200 px-3 py-1 rounded-full border border-slate-400 inline-flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  --- ✂ CORTAR TICKET AQUÍ ---
                </span>
              </div>
            )}

            {/* Page Break only if enabled */}
            {printTicketMode === 'both' && autoCutBetweenTickets && <div className="print-page-break" />}

            {/* ============================================================== */}
            {/* TICKET 2: ORIGINAL COMERCIAL (CONTROL INTERNO Y DEVUELTA 80MM)  */}
            {/* ============================================================== */}
            {(printTicketMode === 'both' || printTicketMode === 'commerce') && (
              <div className="print-receipt-card bg-white p-3 sm:p-4 rounded-lg shadow-md border-2 border-emerald-600/50 font-mono text-slate-900 text-xs flex flex-col justify-between">
                <div>
                  {/* Header Comercial Oficial */}
                  <div className="text-center pb-2 border-b-2 border-dashed border-slate-800">
                    <h1 className="font-black text-sm uppercase tracking-tight leading-tight">
                      {COMPANY_INFO.name}
                    </h1>
                    <p className="text-[10px] text-slate-600">{COMPANY_INFO.address}</p>
                    <p className="text-[10px] font-bold text-slate-800">
                      RNC: {COMPANY_INFO.rnc} • Tel: {COMPANY_INFO.phone}
                    </p>
                  </div>

                  {/* Subtitle Comercial Interno */}
                  <div className="text-center my-2 py-1 bg-slate-900 text-white rounded">
                    <div className="font-black text-xs uppercase tracking-wider text-emerald-400">
                      *** ORIGINAL COMERCIAL ***
                    </div>
                    <div className="text-[10px] font-bold text-slate-200">
                      CONTROL INTERNO Y AUTONOMÍA
                    </div>
                  </div>

                  {/* Metadata Ticket */}
                  <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2">
                    <div className="flex justify-between">
                      <span>Nº CONDUCE:</span>
                      <strong className="font-bold">{conduce.conduceNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>FECHA:</span>
                      <span>{conduce.formattedDate}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="font-bold block">CLIENTE:</span>
                      <span className="font-black text-xs uppercase">{conduce.client.name}</span>
                      {conduce.client.documentId && (
                        <span className="block text-[10px] text-slate-600">Doc: {conduce.client.documentId}</span>
                      )}
                    </div>
                  </div>

                  {/* Products with price and total */}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-300 pb-1 flex justify-between">
                    <span>CANT / ARTÍCULO</span>
                    <span>SUBTOTAL</span>
                  </div>

                  <div className="divide-y divide-dotted divide-slate-300 text-xs py-1">
                    {conduce.items.map((item, idx) => (
                      <div key={idx} className="py-1 flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0 pr-1">
                          <span className="font-black">{item.quantity} {item.unit}</span>{' '}
                          <span className="font-medium text-slate-800">{item.name}</span>
                          <div className="text-[10px] text-slate-500">
                            @ ${item.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span className="font-black text-right shrink-0">
                          ${item.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* FINANCIAL CONTROL BOX - Saldo 25,000, Consumos Previos, Cogido y Saldo Restante */}
                  <div className="mt-2 p-2 rounded-lg bg-slate-100 border border-slate-300 space-y-1 text-xs">
                    <div className="text-[10px] font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-1">
                      LIQUIDACIÓN FINANCIERA (ITBIS 18% INC.):
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span>CUPO ASIGNADO:</span>
                      <span className="font-bold font-mono">
                        ${conduce.initialBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {(conduce.consumoAnteriorCliente ?? 0) > 0 && (
                      <>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>CONSUMO PREVIO CLIENTE:</span>
                          <span className="font-mono">
                            - ${(conduce.consumoAnteriorCliente || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 font-medium">
                          <span>DISPONIBLE PREVIO:</span>
                          <span className="font-mono">
                            ${(conduce.saldoDisponibleAntes ?? (conduce.initialBalance - (conduce.consumoAnteriorCliente || 0))).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center text-rose-700 font-bold">
                      <span>TOTAL ESTE CONDUCE:</span>
                      <span className="font-mono">
                        - ${conduce.totalCogido.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-1 border-t-2 border-slate-800 flex justify-between items-center">
                      <span className="font-black text-slate-900 text-xs">
                        SALDO RESTANTE CLIENTE:
                      </span>
                      <span className="font-black text-sm text-emerald-800 font-mono bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400">
                        ${conduce.devuelta.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signatures for Commercial / Dispatch */}
                <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-800 text-center">
                  <div className="space-y-3">
                    {/* Firma de Despacho */}
                    <div className="pt-3 border-t border-slate-800">
                      <div className="font-bold text-[11px] uppercase">
                        FIRMA AUTORIZADA
                      </div>
                      <div className="text-[9px] text-slate-600">
                        Despacho / Control Comercial
                      </div>
                    </div>

                    {/* Firma del Cliente */}
                    <div className="pt-3 border-t border-slate-800">
                      <div className="font-bold text-[11px] uppercase">
                        FIRMA DEL CLIENTE
                      </div>
                      <div className="text-[9px] text-slate-600">
                        {conduce.client.name}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[9px] text-slate-400">
                    Control Interno • {COMPANY_INFO.name}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="no-print bg-white px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Formato oficial 80mm: Presiona <strong>Imprimir</strong> y tu impresora térmica cortará los 2 tickets exactos.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrintClick}
              className="px-5 py-2 text-xs sm:text-sm font-black rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow hover:shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Térmica 80mm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
