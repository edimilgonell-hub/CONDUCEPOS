import React, { useState } from 'react';
import { GoogleSheetsConfig } from '../types';
import { COMPANY_INFO } from '../data/mockProducts';
import {
  Share2,
  Copy,
  Check,
  Laptop,
  Monitor,
  Printer,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  X
} from 'lucide-react';

interface ShareMultiPCModalProps {
  sheetsConfig: GoogleSheetsConfig;
  onClose: () => void;
}

export const ShareMultiPCModal: React.FC<ShareMultiPCModalProps> = ({
  sheetsConfig,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  // Base shared URL: ALWAYS use the public shared URL (ais-pre-), NEVER the private dev URL (ais-dev-)
  // The ais-dev- URL requires Google AI Studio owner login and throws Error 403 on other computers!
  let currentOrigin = window.location.origin;
  if (currentOrigin.includes('ais-dev-')) {
    currentOrigin = currentOrigin.replace('ais-dev-', 'ais-pre-');
  }
  const baseUrl = currentOrigin.startsWith('http')
    ? currentOrigin
    : 'https://ais-pre-2ffrdz6w6js7bfxjzrt4j6-103469364681.us-east1.run.app';
  
  // Clean public shared URL that works everywhere without server query-parameter restrictions
  const shareUrl = baseUrl;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola, aquí tienes el sistema de ConducePOS de ${COMPANY_INFO.name} para abrirlo en tu computadora:\n${shareUrl}`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Poner el Sistema en Otras Computadoras
              </h2>
              <p className="text-xs text-slate-400">
                {COMPANY_INFO.name} • Enlace multi-terminal centralizado
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Step 1: Copy Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <span>Enlace para abrir en cualquier otra computadora:</span>
              </label>

              {sheetsConfig.webAppUrl && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✨ Con auto-conexión a Google Sheets
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl select-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enviar por WhatsApp a la otra PC</span>
              </a>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Abrir en nueva pestaña para probar</span>
              </a>
            </div>
          </div>

          {/* Step 2: Install Desktop App / Shortcut */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                2
              </span>
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>Cómo poner el ícono en el Escritorio (Como programa de Windows):</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              En las otras computadoras, una vez abran el enlace en Google Chrome o Microsoft Edge, pueden crearlo como un software independiente con su propio ícono en el escritorio:
            </p>

            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside bg-white p-3.5 rounded-xl border border-slate-200">
              <li>
                Abre el enlace en <strong>Google Chrome</strong> en la otra computadora.
              </li>
              <li>
                Arriba a la derecha haz clic en el menú de los 3 puntos (<strong>⋮</strong>).
              </li>
              <li>
                Ve a la opción <strong>"Guardar y compartir"</strong> &gt; <strong>"Crear acceso directo..."</strong> (o *"Instalar aplicación"*).
              </li>
              <li>
                Marca la casilla <strong>"Abrir como ventana"</strong> y pulsa <strong>"Crear"</strong>.
              </li>
              <li>
                ¡Listo! Se creará el ícono en el Escritorio de Windows/Mac y se abrirá a pantalla completa como un sistema de punto de venta profesional.
              </li>
            </ol>
          </div>

          {/* Step 3: 80mm Printer setup on other PCs */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs text-blue-950">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-black flex items-center justify-center">
                3
              </span>
              <Printer className="w-4 h-4 text-blue-700" />
              <span>Impresora Térmica 80mm en las otras computadoras:</span>
            </div>
            <p className="leading-relaxed text-blue-900">
              Conecta la impresora térmica por USB o red en la otra computadora. Al emitir el primer conduce e imprimir, en la ventana de impresión de Chrome selecciona tu impresora térmica y asegúrate de elegir <strong>Tamaño de papel: 80mm</strong> o <em>72mm</em>. Los 2 tickets (Cliente y Comercial) saldrán automáticamente con las firmas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
