import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

export interface AutocompleteOption {
  value: string;
  label: string;
  sublabel?: string;
  category?: string;
}

interface AutocompleteSelectProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export default function AutocompleteSelect({
  options,
  value,
  onChange,
  placeholder = '-- Selecione --',
  searchPlaceholder = 'Digite para pesquisar...',
  label,
  required = false,
  className = '',
  inputClassName = '',
  disabled = false,
}: AutocompleteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const l = opt.label.toLowerCase();
    const sub = (opt.sublabel || '').toLowerCase();
    const cat = (opt.category || '').toLowerCase();
    return l.includes(q) || sub.includes(q) || cat.includes(q);
  });

  const handleSelect = (optionValue: string, optionLabel: string) => {
    onChange(optionValue);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) setSearchQuery('');
            }
          }}
          className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-white cursor-pointer transition-all shadow-2xs ${
            isOpen ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : ''} ${inputClassName}`}
        >
          <div className="flex-1 min-w-0 pr-2">
            {isOpen ? (
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  placeholder={searchPlaceholder}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 p-0 font-sans"
                />
              </div>
            ) : (
              <span className={`block truncate ${selectedOption ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'}`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                title="Limpar seleção"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center italic">
                Nenhum resultado encontrado.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value, opt.label)}
                    className={`p-2.5 hover:bg-amber-50 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-amber-50/80 font-semibold text-amber-900' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
