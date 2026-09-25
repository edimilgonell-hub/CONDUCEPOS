import React, { useState } from 'react';
import { Client } from '../types';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Phone,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';

interface ClientManagerModalProps {
  clients: Client[];
  onAddClient: (newClient: Client) => void;
  onUpdateClient: (updatedClient: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onSelectClient: (client: Client) => void;
  onClose: () => void;
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClient,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleStartCreate = () => {
    setIsEditing(null);
    setName('');
    setDocumentId('');
    setPhone('');
    setNotes('');
    setIsCreating(true);
  };

  const handleStartEdit = (client: Client) => {
    setIsCreating(false);
    setIsEditing(client);
    setName(client.name);
    setDocumentId(client.documentId || '');
    setPhone(client.phone || '');
    setNotes(client.notes || '');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setIsEditing(null);
    setName('');
    setDocumentId('');
    setPhone('');
    setNotes('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreating) {
      const newClient: Client = {
        id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: name.trim(),
        documentId: documentId.trim(),
        phone: phone.trim(),
        initialBalance: 25000,
        notes: notes.trim()
      };
      onAddClient(newClient);
    } else if (isEditing) {
      const updated: Client = {
        ...isEditing,
        name: name.trim(),
        documentId: documentId.trim(),
        phone: phone.trim(),
        notes: notes.trim()
      };
      onUpdateClient(updated);
    }

    handleCancelForm();
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.documentId && c.documentId.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Directorio y Gestión de Clientes
              </h2>
              <p className="text-xs text-slate-400">
                Agrega, edita o elimina clientes frecuentes ({clients.length} registrados)
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

        {/* Action / Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente por nombre, cédula o teléfono..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {!isCreating && !isEditing && (
            <button
              type="button"
              onClick={handleStartCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Cliente</span>
            </button>
          )}
        </div>

        {/* Modal Form: Add or Edit */}
        {(isCreating || isEditing) && (
          <div className="p-4 sm:p-5 bg-emerald-50/60 border-b border-emerald-200 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                {isCreating ? (
                  <>
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    Registrar Nuevo Cliente
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 text-emerald-600" />
                    Editar Cliente: {isEditing?.name}
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nombre Completo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cédula / RNC
                  </label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="000-0000000-0"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="809-000-0000"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Notas / Dirección
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dirección, referencias, etc."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition"
                >
                  {isCreating ? 'Guardar Cliente' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Client List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No se encontraron clientes registrados con ese criterio.
            </div>
          ) : (
            filteredClients.map((c) => (
              <div
                key={c.id}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    {c.documentId && (
                      <span className="flex items-center gap-1 font-mono">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {c.documentId}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phone}
                      </span>
                    )}
                    {c.notes && (
                      <span className="text-slate-400 truncate max-w-xs">
                        • {c.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectClient(c);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition"
                    title="Cargar cliente al conduce actual"
                  >
                    <Check className="w-3 h-3" />
                    <span>Seleccionar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(c)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                    title="Editar cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${c.name}"?`)) {
                        onDeleteClient(c.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>{filteredClients.length} clientes en el sistema</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
