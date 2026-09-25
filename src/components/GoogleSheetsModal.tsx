import React, { useState, useEffect } from 'react';
import { GoogleSheetsConfig, ConduceRecord } from '../types';
import { APPS_SCRIPT_TEMPLATE, exportRecordsToCSV } from '../services/googleSheetsService';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth
} from '../services/googleAuth';
import {
  getOrCreateConduceSpreadsheet,
  getSavedSpreadsheetInfo
} from '../services/googleDriveSheets';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Download,
  RefreshCw,
  X,
  Laptop,
  CloudCheck,
  LogIn,
  LogOut,
  FolderOpen,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { SharedCloudConfig } from '../services/cloudConduceSync';

interface GoogleSheetsModalProps {
  config: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  onClose: () => void;
  records: ConduceRecord[];
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  sharedCloudConfig?: SharedCloudConfig | null;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  config,
  onSaveConfig,
  onClose,
  records,
  currentUser,
  onUserChange,
  sharedCloudConfig
}) => {
  const isCentralLinked = Boolean(
    sharedCloudConfig?.isGoogleDriveConnected ||
    sharedCloudConfig?.spreadsheetUrl ||
    sharedCloudConfig?.webAppUrl
  );

  const [activeTab, setActiveTab] = useState<'directDrive' | 'appsScript' | 'code' | 'export'>(
    currentUser || isCentralLinked ? 'directDrive' : 'appsScript'
  );

  // Direct Google Drive state
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [driveStatus, setDriveStatus] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return getSavedSpreadsheetInfo().url || sharedCloudConfig?.spreadsheetUrl || null;
  });

  // Apps Script Webhook state
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setDriveStatus('Iniciando sesión con tu cuenta de Google...');
    try {
      const result = await googleSignIn();
      if (result) {
        onUserChange(result.user);
        setDriveStatus('¡Sesión iniciada con éxito! Creando o verificando tu Hoja en Google Drive...');
        
        // Auto create or connect spreadsheet in their drive
        const sheetInfo = await getOrCreateConduceSpreadsheet(result.accessToken);
        setSpreadsheetUrl(sheetInfo.spreadsheetUrl);
        setDriveStatus('¡Hoja "MARTINEZ BATISTA - Control de Conduces y Ventas" vinculada en tu Google Drive!');
      }
    } catch (err: any) {
      console.error(err);
      setDriveStatus(`Error al conectar con Google: ${err?.message || 'Permiso denegado'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateOrOpenSheet = async () => {
    setIsCreatingSheet(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        await handleGoogleSignIn();
        return;
      }
      const sheetInfo = await getOrCreateConduceSpreadsheet(token);
      setSpreadsheetUrl(sheetInfo.spreadsheetUrl);
      setDriveStatus('¡Hoja sincronizada correctamente en tu Google Drive!');
    } catch (err: any) {
      setDriveStatus(`Error: ${err?.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    onUserChange(null);
    setDriveStatus('Sesión cerrada.');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleTestConnection = async () => {
    if (!url.trim().startsWith('http')) {
      setTestStatus('error');
      setTestMessage('Por favor ingresa una URL válida (https://script.google.com/...)');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Probando conexión con el Web App de Google Apps Script...');

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'ping',
          date: new Date().toLocaleString(),
          conduceNumber: 'TEST-MB',
          clientName: 'MARTINEZ BATISTA TEST',
          clientDoc: '130963772',
          initialBalance: 25000,
          totalCogido: 1000,
          devuelta: 24000,
          itemCount: 1,
          itemsSummary: '1 Und Prueba ConducePOS Térmica 80mm',
          notes: 'Verificación de enlace multiequipos'
        })
      });

      setTestStatus('success');
      setTestMessage('¡Conexión establecida! Se envió una fila de prueba exitosamente a tu Hoja de Cálculo.');
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage('No se pudo comunicar con la URL. Revisa que esté desplegada como "Cualquier persona" (Anyone).');
    }
  };

  const handleSaveAppsScriptConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      webAppUrl: url.trim(),
      autoSync,
      lastSyncStatus: testStatus === 'success' ? 'success' : 'idle',
      lastSyncMessage: testMessage || 'Configuración guardada'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Conexión con Google Sheets (2 Formas Disponibles)
              </h2>
              <p className="text-xs text-slate-400">
                1. Conexión Directa con tu Google Drive • 2. Apps Script para múltiples computadoras
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-3 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('appsScript')}
            className={`py-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appsScript'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-teal-600" />
            <span>Otras Computadoras (Sin cuenta de Google)</span>
            {config.webAppUrl && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directDrive')}
            className={`py-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'directDrive'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudCheck className="w-4 h-4 text-emerald-600" />
            <span>Solo Edimil (Admin Google Drive)</span>
            {currentUser && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Código Apps Script
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Exportar CSV / Excel
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* ============================================================== */}
          {/* TAB 1: GOOGLE DRIVE DIRECTO                                   */}
          {/* ============================================================== */}
          {activeTab === 'directDrive' && (
            <div className="space-y-4">
              {/* Central Connection Banner if active */}
              {isCentralLinked && !currentUser && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>¡Esta Terminal está Sincronizada con la Hoja Central!</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Esta computadora o celular está vinculada al sistema central. La hoja de Google Sheets de <strong>MARTINEZ BATISTA</strong> está conectada por el administrador (<strong>{sharedCloudConfig?.ownerEmail || 'edimilgonell@gmail.com'}</strong>).
                  </p>
                  <p className="text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>No necesitas iniciar sesión con otra cuenta de Google aquí. Todos los conduces emitidos se sincronizan automáticamente.</span>
                  </p>
                  {(sharedCloudConfig?.spreadsheetUrl || spreadsheetUrl) && (
                    <div className="pt-1">
                      <a
                        href={sharedCloudConfig?.spreadsheetUrl || spreadsheetUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Hoja de Google Sheets en Google Drive</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {!currentUser ? (
                isCentralLinked && !showAdminLogin ? (
                  <div className="text-center py-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(true)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                    >
                      ¿Eres el Administrador Edimil? Iniciar sesión con edimilgonell@gmail.com
                    </button>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 text-center">
                      Solo Edimil: Iniciar sesión con edimilgonell@gmail.com para vincular tu Drive:
                    </p>

                    {/* Official Google Sign-In Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="gsi-material-button shadow-md hover:shadow-lg transition-all"
                    >
                      <div className="gsi-material-button-state"></div>
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">
                          {isSigningIn ? 'Conectando con Google...' : 'Continuar con Google'}
                        </span>
                      </div>
                    </button>

                    <div className="mt-3 max-w-md p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950">
                        <span>⚠️ ¿Por qué da error al poner el correo de otra PC?</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        Google solo autoriza la cuenta principal administradora. Si otra computadora intenta iniciar sesión con su propio correo, Google bloquea el acceso o crearía una hoja separada en su Google Drive privado.
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-800 pt-1">
                        👉 <strong>Solución recomendada para red multi-PC:</strong> Ve a la pestaña <strong>"Forma 2: Apps Script (Multi-PC)"</strong>. Con ese método, <strong>ninguna PC necesita correo ni permisos de Google</strong>; todas enviarán los conduces a tu misma hoja de cálculo centralizada.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || ''}
                          className="w-10 h-10 rounded-full border border-emerald-400"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                          {currentUser.email?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {currentUser.displayName || 'Usuario de Google'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>

                  {/* Active Spreadsheet Status */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Hoja de Cálculo Activa:
                      </span>
                      <button
                        type="button"
                        onClick={handleCreateOrOpenSheet}
                        disabled={isCreatingSheet}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                      >
                        {isCreatingSheet ? 'Sincronizando...' : 'Verificar / Re-crear'}
                      </button>
                    </div>

                    {spreadsheetUrl ? (
                      <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-300 rounded-lg">
                        <span className="text-xs font-bold text-emerald-950 truncate max-w-sm">
                          MARTINEZ BATISTA - Control de Conduces y Ventas
                        </span>
                        <a
                          href={spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir en Google Drive</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateOrOpenSheet}
                        disabled={isCreatingSheet}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition flex items-center justify-center gap-2 shadow"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Crear Hoja "MARTINEZ BATISTA" en mi Google Drive</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {driveStatus && (
                <div className={`p-3.5 rounded-xl text-xs font-medium border ${
                  driveStatus.toLowerCase().includes('error') || driveStatus.toLowerCase().includes('denegado')
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {driveStatus.toLowerCase().includes('error') ? (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{driveStatus}</span>
                  </div>

                  {(driveStatus.toLowerCase().includes('error') || driveStatus.toLowerCase().includes('denegado')) && (
                    <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] text-rose-800 space-y-2">
                      <p>
                        <strong>¿Por qué ocurre esto?</strong> Google no permite que cuentas externas o de empleados inicien sesión directamente porque la app en Google Cloud está restringida a tu cuenta administradora.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('appsScript')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        <span>Usar Forma 2: Apps Script (Funciona para Cualquier Cuenta sin Bloqueos)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: APPS SCRIPT WEB APP (PARA MÚLTIPLES COMPUTADORAS)       */}
          {/* ============================================================== */}
          {activeTab === 'appsScript' && (
            <form onSubmit={handleSaveAppsScriptConfig} className="space-y-4">
              <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1.5">
                <div className="font-bold flex items-center gap-2 text-sm text-teal-900">
                  <Laptop className="w-5 h-5 text-teal-600" />
                  Ideal para usar en Diferentes Computadoras sin iniciar sesión en cada una
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Con el Web App de Google Apps Script, sólo pegas la URL una vez en cualquier computadora o tablet que use tu personal, y todas las ventas llegarán a la misma hoja de cálculo central de Martinez Batista Comercial SRL.
                </p>
              </div>

              {config.webAppUrl && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">¡Esta computadora ya está vinculada a Google Sheets!</span>
                      <span className="text-[11px] text-emerald-800">
                        No necesitas cuenta de Google. Cualquier conduce generado aquí se guarda automáticamente en la hoja central.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                  >
                    Probar Conexión
                  </button>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3 Pasos para sincronizar Cualquier Cuenta de Google sin errores:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Ver / Copiar Código
                  </button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Abre tu hoja de Google Sheets y ve al menú: <strong>Extensiones &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Pega el código de la pestaña <strong>"Código Apps Script"</strong>.
                  </li>
                  <li>
                    Clic en <strong>Implementar &gt; Nueva implementación &gt; Tipo: Aplicación web</strong>. En <em>"Quién tiene acceso"</em>, elige <strong>"Cualquier persona" (Anyone)</strong>. Copia el enlace generado y pégalo abajo:
                  </li>
                </ol>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  URL de la Aplicación Web (Google Apps Script Web App URL)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Envío Automático al Emitir
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Enviar cada conduce a la URL de Apps Script automáticamente al facturar.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Test Button & Status */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Comprobar Enlace:</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing' || !url}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Probar Envío a Sheets</span>
                  </button>
                </div>

                {testMessage && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-medium ${
                      testStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : testStatus === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-300'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {testMessage}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
                >
                  Guardar Configuración Multi-PC
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 3: CÓDIGO DE APPS SCRIPT                                   */}
          {/* ============================================================== */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Código optimizado para la hoja de cálculo de Martinez Batista Comercial:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Código Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[360px] border border-slate-800 leading-relaxed">
                  {APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: EXPORTACIÓN CSV                                         */}
          {/* ============================================================== */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Descargar Historial en Archivo CSV / Excel
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Descarga tus {records.length} conduces actuales en un archivo listo para importar en cualquier hoja.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => exportRecordsToCSV(records)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
