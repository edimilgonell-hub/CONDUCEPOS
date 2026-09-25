import React, { useState, useRef, useEffect } from 'react';
import { ProductItem } from '../types';
import {
  Search,
  Zap,
  Plus,
  PlusCircle,
  CornerDownLeft,
  Tag,
  ListPlus,
  Trash2,
  Edit2,
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface ProductAutoSearchProps {
  products: ProductItem[];
  onAddToCart: (product: ProductItem, quantity?: number) => void;
  onAddCustomProduct: (product: ProductItem, quantity: number) => void;
  onDeleteProduct?: (id: string) => void;
  onBulkAddProducts?: (items: ProductItem[]) => void;
}

export const ProductAutoSearch: React.FC<ProductAutoSearchProps> = ({
  products,
  onAddToCart,
  onAddCustomProduct,
  onDeleteProduct,
  onBulkAddProducts
}) => {
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [lastAddedMessage, setLastAddedMessage] = useState<string | null>(null);

  // Modal: Add single new product line permanently
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [newLineName, setNewLineName] = useState('');
  const [newLinePrice, setNewLinePrice] = useState<string>('');
  const [newLineUnit, setNewLineUnit] = useState('Und');
  const [newLineCategory, setNewLineCategory] = useState('General');

  // Modal: Bulk import from PDF / Text
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Modal: Manage catalog
  const [showManageModal, setShowManageModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Quick price popup when pressing Enter on unknown product in search bar
  const [customPriceModal, setCustomPriceModal] = useState<{
    name: string;
    qty: number;
    unit: string;
  } | null>(null);
  const [customPriceValue, setCustomPriceValue] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Focus search bar on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Parse multiplier syntax (e.g. "3*arroz" or "2 pollo")
  const parseQueryAndQuantity = (raw: string): { parsedQty: number; cleanQuery: string } => {
    const trimmed = raw.trim();
    const matchAsterisk = trimmed.match(/^(\d+(?:\.\d+)?)\s*[*xX]\s*(.+)$/);
    if (matchAsterisk) {
      return {
        parsedQty: Math.max(1, parseFloat(matchAsterisk[1]) || 1),
        cleanQuery: matchAsterisk[2].trim()
      };
    }
    return {
      parsedQty: quantity,
      cleanQuery: trimmed
    };
  };

  const { parsedQty, cleanQuery } = parseQueryAndQuantity(query);

  // Auto-filter products by cleanQuery
  const filteredProducts = products.filter((p) => {
    if (!cleanQuery) return false;
    const q = cleanQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  // Handle outside click for autocomplete dropdown
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

  const flashAdded = (text: string) => {
    setLastAddedMessage(text);
    setTimeout(() => {
      setLastAddedMessage((prev) => (prev === text ? null : prev));
    }, 2500);
  };

  const executeAddProduct = (prod: ProductItem, qty: number) => {
    onAddToCart(prod, qty);
    flashAdded(`+${qty} ${prod.unit} ${prod.name}`);
    setQuery('');
    setQuantity(1);
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && cleanQuery) setIsOpen(true);
      setHighlightedIndex((prev) => (prev < filteredProducts.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(0, filteredProducts.length)
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (filteredProducts.length > 0 && highlightedIndex < filteredProducts.length) {
        executeAddProduct(filteredProducts[highlightedIndex], parsedQty);
      } else if (cleanQuery.length > 0) {
        setCustomPriceModal({
          name: cleanQuery,
          qty: parsedQty,
          unit: 'Und'
        });
        setCustomPriceValue('');
        setTimeout(() => priceInputRef.current?.focus(), 50);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Submit single new line
  const handleCreateNewLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineName.trim()) return;
    const price = parseFloat(newLinePrice) || 0;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newLineName.trim(),
      category: newLineCategory.trim() || 'General',
      unit: newLineUnit || 'Und',
      unitPrice: price
    };

    onAddCustomProduct(newProd, 1);
    flashAdded(`Línea agregada: ${newProd.name} ($${price.toFixed(2)})`);

    setNewLineName('');
    setNewLinePrice('');
    setNewLineCategory('General');
    setShowAddLineModal(false);
    inputRef.current?.focus();
  };

  // Bulk import lines from text/PDF
  const handleProcessBulkText = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const newItems: ProductItem[] = [];

    lines.forEach((line, index) => {
      // Formats supported:
      // "Arroz Selecto, 380, Saco, Granos"
      // "Pollo - 85 - Lb"
      // "Aceite | 420"
      // or "1. Arroz Selecto 10lb $380"
      const parts = line.split(/[,;\t|]/).map((p) => p.trim());

      if (parts.length >= 2) {
        const name = parts[0];
        const rawPrice = parts[1].replace(/[^0-9.]/g, '');
        const price = parseFloat(rawPrice) || 0;
        const unit = parts[2] || 'Und';
        const cat = parts[3] || 'General';

        newItems.push({
          id: `bulk-${Date.now()}-${index}`,
          name,
          unitPrice: price,
          unit,
          category: cat
        });
      } else {
        // Try regex match: e.g. "Arroz 10 lb $380" or "Arroz 10 lb 380.00"
        const match = line.match(/^(.+?)\s+[\$]?([0-9]+(?:\.[0-9]+)?)\s*(?:([a-zA-Z]+))?$/);
        if (match) {
          newItems.push({
            id: `bulk-${Date.now()}-${index}`,
            name: match[1].trim(),
            unitPrice: parseFloat(match[2]) || 0,
            unit: match[3] || 'Und',
            category: 'General'
          });
        } else {
          // Fallback simple line
          newItems.push({
            id: `bulk-${Date.now()}-${index}`,
            name: line.trim(),
            unitPrice: 0,
            unit: 'Und',
            category: 'General'
          });
        }
      }
    });

    if (newItems.length > 0 && onBulkAddProducts) {
      onBulkAddProducts(newItems);
      flashAdded(`Se anexaron ${newItems.length} líneas de productos con éxito.`);
      setBulkText('');
      setShowBulkModal(false);
      inputRef.current?.focus();
    }
  };

  const handleConfirmCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPriceModal) return;
    const price = parseFloat(customPriceValue) || 0;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: customPriceModal.name,
      category: 'General',
      unit: customPriceModal.unit || 'Und',
      unitPrice: price
    };

    onAddCustomProduct(newProd, customPriceModal.qty);
    flashAdded(`+${customPriceModal.qty} ${newProd.unit} ${newProd.name} ($${price.toFixed(2)})`);

    setCustomPriceModal(null);
    setQuery('');
    setQuantity(1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const filteredCatalog = products.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header with Quick Action Buttons */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
            2
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase">
              Buscador Automático & Líneas de Productos
            </h2>
            <p className="text-[11px] text-slate-400">
              Escribe y Enter para agregar • {products.length} productos registrados
            </p>
          </div>
        </div>

        {/* Buttons to Add Lines and Manage */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Button: + Anexar Nueva Línea */}
          <button
            type="button"
            onClick={() => setShowAddLineModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
            title="Agregar una nueva línea de producto al catálogo"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nueva Línea</span>
          </button>

          {/* Button: Importar Lista / PDF */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition cursor-pointer"
            title="Importar o pegar múltiples líneas desde PDF o Excel"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pegar Lista PDF</span>
          </button>

          {/* Button: Ver / Administrar */}
          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Ver y editar todas las líneas de productos"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-start space-y-4">
        {/* AUTOMATIC SEARCH INPUT BAR */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
            <span>Buscador Automático (Escribe y presiona ENTER para agregar):</span>
            {lastAddedMessage && (
              <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-in fade-in slide-in-from-right duration-150">
                {lastAddedMessage}
              </span>
            )}
          </label>

          <div className="flex items-center gap-2">
            {/* Quantity box */}
            <div className="shrink-0 w-24">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Cant:</div>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full py-2.5 px-2 text-center text-sm sm:text-base font-black font-mono bg-slate-50 border-2 border-slate-300 focus:border-emerald-500 rounded-xl focus:outline-none text-slate-900"
                title="Cantidad para el producto que buscas"
              />
            </div>

            {/* Main automatic search input */}
            <div className="flex-1 relative">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Producto / Artículo:
              </div>
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
                  }}
                  onFocus={() => {
                    if (cleanQuery) setIsOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe producto (ej. arroz, pollo, aceite, leche)..."
                  className="w-full pl-11 pr-24 py-2.5 text-sm sm:text-base border-2 border-slate-300 focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition font-medium text-slate-900 shadow-inner"
                  autoComplete="off"
                />

                <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                    <CornerDownLeft className="w-3 h-3" /> Enter
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Autocomplete Predictive Dropdown */}
          {isOpen && cleanQuery.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-40 left-0 right-0 mt-2 bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 flex justify-between items-center">
                <span>
                  Resultados automáticos para: <strong>"{cleanQuery}"</strong>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Enter para agregar ({parsedQty} {parsedQty > 1 ? 'unidades' : 'unidad'})
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod, idx) => {
                  const isSelected = highlightedIndex === idx;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => executeAddProduct(prod, parsedQty)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`px-4 py-3 cursor-pointer transition flex items-center justify-between border-b border-slate-100 last:border-b-0 ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-950 font-bold'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{prod.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="uppercase text-[10px] font-semibold text-slate-400">
                              {prod.category}
                            </span>
                            <span>•</span>
                            <span>Unidad: {prod.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-emerald-600">
                          ${prod.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {parsedQty > 1 && (
                            <span className="font-bold text-slate-600">
                              Total: $
                              {(prod.unitPrice * parsedQty).toLocaleString('es-DO', {
                                minimumFractionDigits: 2
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-2">
                    No se encontró ningún producto registrado como <strong>"{cleanQuery}"</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPriceModal({
                        name: cleanQuery,
                        qty: parsedQty,
                        unit: 'Und'
                      });
                      setCustomPriceValue('');
                      setTimeout(() => priceInputRef.current?.focus(), 50);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar "{cleanQuery}" con precio nuevo</span>
                  </button>
                </div>
              )}

              {/* Option to create as new permanent product line */}
              {filteredProducts.length > 0 && (
                <div
                  onClick={() => {
                    setNewLineName(cleanQuery);
                    setShowAddLineModal(true);
                  }}
                  onMouseEnter={() => setHighlightedIndex(filteredProducts.length)}
                  className={`px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-between ${
                    highlightedIndex === filteredProducts.length ? 'bg-emerald-100/60 font-bold' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    ¿Anexar como nueva línea fija al catálogo?
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Clic aquí</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Tips Box */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Búsqueda Rápida & Nuevas Líneas
            </span>
            <span className="text-emerald-700 font-semibold">{products.length} artículos disponibles</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Escribe directamente el producto y presiona <strong>Enter</strong>. Si vas a anexar productos de tu PDF, puedes usar el botón verde <strong>"+ Nueva Línea"</strong> o <strong>"Pegar Lista PDF"</strong> arriba a la derecha.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ANEXAR NUEVA LÍNEA DE PRODUCTO                        */}
      {/* ============================================================== */}
      {showAddLineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Anexar Nueva Línea de Producto
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLineModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewLine} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre / Descripción del Producto <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                  placeholder="Ej. Arroz Selecto 10 lb, Leche Entera, etc."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Precio Unitario ($) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newLinePrice}
                    onChange={(e) => setNewLinePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unidad
                  </label>
                  <select
                    value={newLineUnit}
                    onChange={(e) => setNewLineUnit(e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Und">Und</option>
                    <option value="Lb">Lb</option>
                    <option value="Saco">Saco</option>
                    <option value="Funda">Funda</option>
                    <option value="Paq">Paq</option>
                    <option value="Cja">Cja</option>
                    <option value="Gal">Gal</option>
                    <option value="Lata">Lata</option>
                    <option value="Cartón">Cartón</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={newLineCategory}
                    onChange={(e) => setNewLineCategory(e.target.value)}
                    placeholder="Ej. Despensa"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddLineModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition"
                >
                  Guardar y Anexar al Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: IMPORTAR LÍNEAS EN MASA (DESDE PDF / TEXTO)           */}
      {/* ============================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Anexar Líneas de Productos desde PDF / Texto
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Copia y pega aquí las líneas de texto o tabla de tu PDF. Puedes ponerlas con coma, tabulación o con el precio al final:
              </p>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600 space-y-0.5">
                <div>Ejemplo formato 1: <strong>Arroz Selecto 10 lb, 380, Saco, Granos</strong></div>
                <div>Ejemplo formato 2: <strong>Pollo Fresco Procesado, 85, Lb, Carnes</strong></div>
                <div>Ejemplo formato 3: <strong>Aceite Vegetal Galón $420.00</strong></div>
              </div>

              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Pega aquí el texto del PDF con tus productos..."
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">
                  {bulkText.split('\n').filter((l) => l.trim()).length} líneas detectadas
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessBulkText}
                    disabled={!bulkText.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition"
                  >
                    Anexar Todas las Líneas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADMINISTRAR / VER TODAS LAS LÍNEAS DEL CATÁLOGO       */}
      {/* ============================================================== */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Administrar Líneas del Catálogo ({products.length} productos)
              </h3>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar en el catálogo..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowManageModal(false);
                  setShowAddLineModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Nueva Línea</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {filteredCatalog.map((prod) => (
                <div
                  key={prod.id}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                        {prod.category}
                      </span>
                      <span>•</span>
                      <span>Unidad: {prod.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-sm text-emerald-700">
                      ${prod.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>

                    {onDeleteProduct && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Eliminar línea de producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PRICE MODAL ON ENTER FOR UNKNOWN ITEM */}
      {customPriceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Precio para Línea Nueva
              </h3>
              <button
                type="button"
                onClick={() => setCustomPriceModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCustomPrice} className="p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">
                  Producto a registrar:
                </span>
                <div className="p-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-900">
                  {customPriceModal.qty} {customPriceModal.unit} × {customPriceModal.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Precio Unitario ($) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono font-bold text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={customPriceValue}
                    onChange={(e) => setCustomPriceValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold border-2 border-slate-300 focus:border-emerald-500 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomPriceModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition"
                >
                  Confirmar y Agregar (Enter)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
