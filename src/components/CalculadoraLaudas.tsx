import React, { useState } from 'react';
import { BookOpen, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import AutocompleteSelect from './AutocompleteSelect';

export default function CalculadoraLaudas() {
  const [numCaracStr, setNumCaracStr] = useState('');
  const [tamLauda, setTamLauda] = useState('1600');
  const [resultado, setResultado] = useState<{ value: number; label: string } | null>(null);
  const [errorFlag, setErrorFlag] = useState(false);

  const handleCalcular = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorFlag(false);
    setResultado(null);

    const numCarac = parseFloat(numCaracStr);
    const size = parseInt(tamLauda);

    if (!numCaracStr || isNaN(numCarac) || numCarac <= 0) {
      setErrorFlag(true);
      return;
    }

    const total = numCarac / size;
    const arred = Math.round(total * 100) / 100;
    
    setResultado({
      value: arred,
      label: arred <= 1 ? "lauda" : "laudas"
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalcular();
    }
  };

  const lines = [
    ["1.250 car.", "Contratos jurídicos", "~0,8 pág A4"],
    ["1.400 car.", "Revisão literária", "~0,9 pág A4"],
    ["1.600 car.", "Padrão editorial", "~1,0 pág A4"],
    ["1.800 car.", "Textos técnicos", "~1,1 pág A4"],
    ["2.100 car.", "Laudas amplas", "~1,3 pág A4"],
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in font-sans">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Calculadora de Laudas</h2>
        <p className="text-xs text-slate-500 font-medium">Converta o número de caracteres em laudas editoriais de forma rápida e precisa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Main calculation card */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Header styled like App Identity */}
          <div className="bg-slate-900 px-5 py-5 text-center border-b border-slate-850">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-base mx-auto mb-2 shadow-sm">
              <BookOpen size={16} />
            </div>
            <h3 className="text-white font-bold text-base tracking-tight uppercase">Conversor Editorial</h3>
            <p className="text-slate-400 text-xs mt-0.5">Converta caracteres em laudas em poucos segundos</p>
          </div>

          {/* Form container */}
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="txtNumero" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Número de caracteres
              </label>
              <input
                type="number"
                id="txtNumero"
                placeholder="Ex: 45000"
                value={numCaracStr}
                onChange={(e) => setNumCaracStr(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tamanho da lauda
              </label>
              <AutocompleteSelect
                options={[
                  { value: '1250', label: '1.250 caracteres (Contratos / Jurídico)', sublabel: 'Padrão para documentos jurídicos e contratuais' },
                  { value: '1400', label: '1.400 caracteres (Revisão Lit.)', sublabel: 'Trabalhos acadêmicos e revisão de literatura' },
                  { value: '1600', label: '1.600 caracteres (Padrão Editorial)', sublabel: 'Padrão tradicional de mercado editorial brasileiro' },
                  { value: '1800', label: '1.800 caracteres (Textos Técnicos)', sublabel: 'Padrão para livros acadêmicos e manuais técnicos' },
                  { value: '2100', label: '2.100 caracteres (Laudas Amplas)', sublabel: 'Lauda aberta / ampla para tradução e imprensa' },
                ]}
                value={tamLauda}
                onChange={(val) => setTamLauda(val || '1600')}
                placeholder="Selecione o tamanho da lauda..."
                searchPlaceholder="Pesquisar tamanho de lauda..."
              />
            </div>

            <button
              onClick={() => handleCalcular()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Calcular
            </button>

            {/* Success Results Card */}
            {resultado !== null && (
              <div className="bg-indigo-50/50 border-2 border-indigo-500/20 rounded-xl p-5 text-center transition-all animate-fade-in mt-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resultado da Conversão</p>
                <p className="text-4xl font-extrabold text-indigo-600 tracking-tight leading-none my-1">
                  {resultado.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-indigo-700 capitalize">
                  {resultado.label}
                </p>
              </div>
            )}

            {/* Error message */}
            {errorFlag && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm flex items-center gap-2 mt-4">
                <AlertCircle size={16} className="shrink-0" />
                <span>Por favor, digite um número de caracteres válido para prosseguir.</span>
              </div>
            )}
          </div>
        </div>

        {/* Informative Side Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <HelpCircle size={16} className="text-indigo-500" />
              Como usar
            </h4>
            <ol className="text-xs text-slate-650 space-y-3 list-decimal pl-4 leading-relaxed font-medium">
              <li>
                Abra seu documento no processador de texto (como Word ou Google Docs).
              </li>
              <li>
                Cole ou digite esse número de caracteres no campo ao lado.
              </li>
              <li>
                Escolha o tamanho da lauda combinado com seu cliente.
              </li>
              <li>
                Clique em <strong className="text-slate-800">Calcular</strong>.
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              Tamanhos de lauda comuns
            </h4>
            <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-slate-50 font-bold p-2 text-slate-500 uppercase tracking-tight text-[10px]">
                <span>Tamanho</span>
                <span className="text-center">Uso típico</span>
                <span className="text-right">Equivalência</span>
              </div>
              <div className="divide-y divide-slate-150 font-medium text-slate-600">
                {lines.map(([tam, uso, eq], idx) => (
                  <div key={idx} className="grid grid-cols-3 p-2.5 items-center hover:bg-slate-50/50">
                    <span className="text-slate-800 font-semibold">{tam}</span>
                    <span className="text-slate-500 text-center text-[11.5px]">{uso}</span>
                    <span className="text-slate-500 text-right font-mono text-[11px]">{eq}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
