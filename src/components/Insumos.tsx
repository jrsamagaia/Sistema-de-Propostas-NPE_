import React, { useState } from 'react';
import { Pencil, Trash2, Plus, CheckCircle, X, Search, Layers, ChevronDown, ChevronRight, Copy, Archive, RotateCcw, Check } from 'lucide-react';
import { Supply, SupplyVariation } from '../types';
import AutocompleteSelect from './AutocompleteSelect';
import { ceil2, formatMoney } from '../utils/math';

interface InsumosProps {
  supplies: Supply[];
  saveSupply: (supply: Supply) => void;
  removeSupply: (id: number) => void;
  showNotification: (msg: string) => void;
}

export default function Insumos({
  supplies,
  saveSupply,
  removeSupply,
  showNotification,
}: InsumosProps) {
  const [desc, setDesc] = useState('');
  const [unit, setUnit] = useState('unidade');
  const [cost, setCost] = useState('');
  const [type, setType] = useState<'produto' | 'servico'>('servico');
  const [multiplier, setMultiplier] = useState('1.60');
  const [shippingCost, setShippingCost] = useState('');
  const [shippingQty, setShippingQty] = useState('');
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<SupplyVariation[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'servico' | 'produto' | 'inativos'>('servico');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSupplyIds, setExpandedSupplyIds] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedSupplyIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleActive = (supply: Supply, e?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBeActive = supply.active === false ? true : false;
    const updatedSupply: Supply = {
      ...supply,
      active: willBeActive,
    };
    saveSupply(updatedSupply);
    if (!willBeActive) {
      showNotification(`"${supply.description}" foi inativado e movido para a aba "Inativos".`);
    } else {
      showNotification(`"${supply.description}" foi reativado com sucesso e retornou para a aba "${supply.type === 'produto' ? 'Impressão' : 'Serviços'}".`);
    }
  };

  const handleAddVariation = () => {
    const defaultQty = variations.length > 0 
      ? (variations[variations.length - 1].quantity * 2) 
      : 50;
    const defaultCost = variations.length > 0 
      ? variations[variations.length - 1].cost 
      : ceil2(parseFloat(cost) || 0.50);
    const defaultMult = ceil2(parseFloat(multiplier) || 1.60);

    const newVar: SupplyVariation = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      quantity: defaultQty,
      unit: unit || 'unidade',
      cost: defaultCost,
      multiplier: defaultMult,
    };
    setVariations([...variations, newVar]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleUpdateVariation = (index: number, field: keyof SupplyVariation, value: any) => {
    const updated = [...variations];
    let finalValue = value;
    if (field === 'cost' || field === 'multiplier') {
      finalValue = ceil2(value);
    }
    updated[index] = {
      ...updated[index],
      [field]: finalValue,
    };
    setVariations(updated);
  };

  const handleApplyPresetVariations = () => {
    const baseM = ceil2(parseFloat(multiplier) || 1.60);
    const now = Date.now();
    const preset: SupplyVariation[] = [
      { id: `${now}_var_50`, quantity: 50, unit: unit || 'unidade', cost: 0.73, multiplier: baseM },
      { id: `${now}_var_100`, quantity: 100, unit: unit || 'unidade', cost: 0.51, multiplier: baseM },
      { id: `${now}_var_250`, quantity: 250, unit: unit || 'unidade', cost: 0.23, multiplier: baseM },
      { id: `${now}_var_500`, quantity: 500, unit: unit || 'unidade', cost: 0.14, multiplier: baseM },
    ];
    setVariations(preset);
    setHasVariations(true);
    if (!cost) setCost('0.73');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !unit) return;
    
    const parsedCost = ceil2(parseFloat(cost) || (variations.length > 0 ? variations[0].cost : 0));
    if (!parsedCost && (!hasVariations || variations.length === 0)) return;

    const parsedMultiplier = type === 'produto' ? ceil2(parseFloat(multiplier) || 1.0) : 1.0;
    const parsedShippingCost = type === 'produto' && shippingCost ? ceil2(parseFloat(shippingCost)) : undefined;
    const parsedShippingQty = type === 'produto' && shippingQty ? parseInt(shippingQty, 10) : undefined;

    const currentSupply = editingId ? supplies.find(s => s.id === editingId) : null;
    const createdAt = currentSupply?.createdAt || Date.now();

    const supplyData: Supply = {
      id: editingId || Date.now(),
      description: desc,
      unit: unit.toLowerCase(),
      cost: parsedCost,
      type: type,
      multiplier: parsedMultiplier,
      shippingCost: parsedShippingCost,
      shippingQty: parsedShippingQty,
      hasVariations: type === 'produto' ? hasVariations : false,
      variations: (type === 'produto' && hasVariations) ? variations.map(v => ({
        ...v,
        cost: ceil2(v.cost),
        multiplier: v.multiplier !== undefined ? ceil2(v.multiplier) : undefined
      })) : [],
      createdAt: createdAt,
      active: currentSupply ? (currentSupply.active !== undefined ? currentSupply.active : true) : true
    };

    if (editingId) {
      saveSupply(supplyData);
      setEditingId(null);
      showNotification('Insumo atualizado!');
    } else {
      saveSupply(supplyData);
      showNotification('Insumo cadastrado!');
    }

    setDesc(''); 
    setUnit('unidade'); 
    setCost('');
    setType('servico');
    setMultiplier('1.60');
    setShippingCost('');
    setShippingQty('');
    setHasVariations(false);
    setVariations([]);
  };

  const handleEdit = (supply: Supply) => {
    setEditingId(supply.id);
    setDesc(supply.description);
    setUnit(supply.unit);
    setCost(supply.cost.toString());
    const supplyType = supply.type || 'servico';
    setType(supplyType);
    setMultiplier((supply.multiplier !== undefined ? supply.multiplier : 1.60).toString());
    setShippingCost(supply.shippingCost !== undefined ? supply.shippingCost.toString() : '');
    setShippingQty(supply.shippingQty !== undefined ? supply.shippingQty.toString() : '');
    setHasVariations(!!supply.hasVariations);
    setVariations(supply.variations && supply.variations.length > 0 ? supply.variations : []);
    setActiveTab(supplyType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDesc(''); 
    setUnit('unidade'); 
    setCost('');
    setType('servico');
    setMultiplier('1.60');
    setShippingCost('');
    setShippingQty('');
    setHasVariations(false);
    setVariations([]);
  };

  // Ordenação decrescente: da data de criação maior para a menor
  const sortedSupplies = [...supplies].sort((a, b) => {
    const timeA = a.createdAt || a.id;
    const timeB = b.createdAt || b.id;
    return timeB - timeA;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Catálogo de Insumos</h2>
        <p className="text-xs text-slate-500 font-medium">Cadastre os serviços, impressões e materiais (com suporte a variações de tiragem/quantidade).</p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição do Serviço ou Material</label>
              <input 
                type="text" 
                placeholder="Ex: Marcador de Página, Diagramação, Capa..."
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                required 
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Insumo</label>
              <AutocompleteSelect
                options={[
                  { value: 'servico', label: 'Serviço', sublabel: 'Serviços editoriais (lauda, hora, projeto)' },
                  { value: 'produto', label: 'Impressão / Gráfica', sublabel: 'Materiais impressos (com Fator e Variações)' },
                ]}
                value={type}
                onChange={(val) => {
                  const newType = (val as 'produto' | 'servico') || 'servico';
                  setType(newType);
                  if (newType === 'servico') {
                    setMultiplier('1.0');
                    setHasVariations(false);
                  } else {
                    setMultiplier('1.60');
                  }
                }}
                placeholder="Selecione o tipo..."
                searchPlaceholder="Pesquisar tipo de insumo..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unidade (Ex: Unidade)</label>
              <input 
                type="text" 
                placeholder="Ex: unidade, lauda"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" 
                value={unit} 
                onChange={e => setUnit(e.target.value)} 
                required 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                {hasVariations ? 'Custo Base Ref. (R$)' : 'Custo Base (R$)'}
              </label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white font-mono" 
                value={cost} 
                onChange={e => setCost(e.target.value)} 
                required={!hasVariations} 
              />
            </div>
          </div>

          {type === 'produto' && (
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 mt-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
                <div>
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={15} className="text-indigo-600" />
                    Parâmetros de Impressão & Variações
                  </p>
                  <p className="text-[11px] text-indigo-600/80">Configure o multiplicador e se o produto possui variações por tiragem/quantidade.</p>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50/50 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={hasVariations}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasVariations(checked);
                      if (checked && variations.length === 0) {
                        handleAddVariation();
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-indigo-900">
                    Variação por Quantidade (Tiragens)
                  </span>
                </label>
              </div>

              {/* Parâmetros Globais de Impressão */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 uppercase mb-1">Fator Multiplicador Padrão</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white font-semibold text-indigo-700" 
                    value={multiplier} 
                    onChange={e => {
                      const val = e.target.value;
                      setMultiplier(val);
                      // Se tem variações, atualiza o multiplicador das variações que ainda usavam o anterior
                      if (hasVariations && variations.length > 0) {
                        const parsed = parseFloat(val) || 1.0;
                        setVariations(variations.map(v => ({ ...v, multiplier: parsed })));
                      }
                    }} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 uppercase mb-1">Valor do Frete (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="Opcional"
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white font-semibold text-indigo-700" 
                    value={shippingCost} 
                    onChange={e => setShippingCost(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 uppercase mb-1">Quantidade de Itens (Frete)</label>
                  <input 
                    type="number" 
                    step="1" 
                    min="1"
                    placeholder="Opcional"
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white font-semibold text-indigo-700" 
                    value={shippingQty} 
                    onChange={e => setShippingQty(e.target.value)} 
                  />
                </div>
              </div>

              {/* Tabela de Variações de Quantidade */}
              {hasVariations && (
                <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-3 mt-2 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers size={14} className="text-indigo-600" />
                        Tabela de Variações de Quantidade e Preços
                      </h4>
                      <p className="text-[11px] text-slate-500">Cadastre as diferentes tiragens com seus custos unitários e preços calculados.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {variations.length === 0 && (
                        <button
                          type="button"
                          onClick={handleApplyPresetVariations}
                          className="text-[11px] bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Carregar exemplo: 50, 100, 250 e 500 un"
                        >
                          <Copy size={13} /> Exemplo (50, 100, 250, 500)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddVariation}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Plus size={14} /> Adicionar Variação
                      </button>
                    </div>
                  </div>

                  {variations.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs">
                      Nenhuma variação adicionada. Clique em <strong>"+ Adicionar Variação"</strong> ou use o botão de <strong>"Exemplo"</strong>.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-indigo-950 text-white font-semibold">
                          <tr>
                            <th className="p-2.5 w-10 text-center">#</th>
                            <th className="p-2.5 w-28">Quantidade</th>
                            <th className="p-2.5 w-24">Unidade</th>
                            <th className="p-2.5 w-28 text-right">Custo Base (R$)</th>
                            <th className="p-2.5 w-24 text-center">Fator</th>
                            <th className="p-2.5 text-right">Custo Calc. Unit.</th>
                            <th className="p-2.5 text-right font-bold">Total Previsto</th>
                            <th className="p-2.5 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {variations.map((v, vIdx) => {
                            const vMult = v.multiplier !== undefined ? ceil2(v.multiplier) : ceil2(parseFloat(multiplier) || 1.0);
                            const vUnitCostCalc = ceil2(v.cost * vMult);
                            const vTotalCalc = ceil2(vUnitCostCalc * (v.quantity || 1));

                            return (
                              <tr key={v.id || vIdx} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="p-2.5 text-center font-bold text-slate-400">{vIdx + 1}</td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={v.quantity}
                                    onChange={(e) => handleUpdateVariation(vIdx, 'quantity', parseInt(e.target.value, 10) || 1)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-bold text-indigo-950"
                                    required
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.unit || unit || 'unidade'}
                                    onChange={(e) => handleUpdateVariation(vIdx, 'unit', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 uppercase text-slate-600 text-center"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={v.cost}
                                    onChange={(e) => handleUpdateVariation(vIdx, 'cost', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono text-right"
                                    required
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={vMult}
                                    onChange={(e) => handleUpdateVariation(vIdx, 'multiplier', parseFloat(e.target.value) || 1.0)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono text-center text-indigo-700 font-semibold"
                                  />
                                </td>
                                <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                                  R$ {vUnitCostCalc.toFixed(2)}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                  R$ {vTotalCalc.toFixed(2)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariation(vIdx)}
                                    className="text-red-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                                    title="Remover variação"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
              >
                <X size={18} /> Cancelar
              </button>
            )}
            <button 
              type="submit" 
              className={`text-white px-6 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              {editingId ? <><CheckCircle size={18} /> Atualizar Insumo</> : <><Plus size={18} /> Adicionar Insumo</>}
            </button>
          </div>
        </form>

        {/* Abas e Campo de Pesquisa */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pt-6 border-t border-slate-100">
          {/* Abas */}
          {(() => {
            const countServicos = sortedSupplies.filter(s => (s.type || 'servico') === 'servico' && s.active !== false).length;
            const countProdutos = sortedSupplies.filter(s => s.type === 'produto' && s.active !== false).length;
            const countInativos = sortedSupplies.filter(s => s.active === false).length;

            return (
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('servico')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'servico'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Serviços</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'servico' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'}`}>
                    {countServicos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('produto')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'produto'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Impressão</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'produto' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {countProdutos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inativos')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'inativos'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-amber-700'
                  }`}
                >
                  <Archive size={13} />
                  <span>Inativos</span>
                  {countInativos > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'inativos' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                      {countInativos}
                    </span>
                  )}
                </button>
              </div>
            );
          })()}

          {/* Pesquisa */}
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por descrição..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-slate-400 font-medium transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Título da Tabela */}
        <div className="mb-4 text-left flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'servico' && 'Serviços Ativos'}
            {activeTab === 'produto' && 'Impressões e Materiais Ativos'}
            {activeTab === 'inativos' && 'Insumos e Produtos Inativos'}
            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {sortedSupplies.filter(s => {
                if (activeTab === 'inativos') {
                  return s.active === false && s.description.toLowerCase().includes(searchQuery.toLowerCase());
                }
                const sType = s.type || 'servico';
                const matchesTab = sType === activeTab && s.active !== false;
                const matchesSearch = s.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
              }).length}
            </span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            {activeTab === 'inativos' 
              ? 'Marque o checkbox para reativar um insumo a qualquer momento' 
              : 'Desmarque o checkbox para inativar um insumo e enviá-lo para a aba Inativos'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-900 text-white font-semibold">
              {activeTab === 'servico' && (
                <tr>
                  <th className="p-4 w-16">#</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-center">Und Medida</th>
                  <th className="p-4 text-right">Custo Base</th>
                  <th className="p-4 text-center w-36">Ações</th>
                </tr>
              )}
              {activeTab === 'produto' && (
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4 w-16">#</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-center">Und Medida</th>
                  <th className="p-4 text-right">Custo Base</th>
                  <th className="p-4 text-center">Fator</th>
                  <th className="p-4 text-right">Vl. Frete</th>
                  <th className="p-4 text-center">Qtd</th>
                  <th className="p-4 text-right">Custo Calculado</th>
                  <th className="p-4 text-center w-36">Ações</th>
                </tr>
              )}
              {activeTab === 'inativos' && (
                <tr>
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4 w-16">#</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-center">Und Medida</th>
                  <th className="p-4 text-right">Custo Base</th>
                  <th className="p-4 text-center">Fator</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center w-44">Ações</th>
                </tr>
              )}
            </thead>
            <tbody>
              {sortedSupplies
                .filter(s => {
                  if (activeTab === 'inativos') {
                    return s.active === false && s.description.toLowerCase().includes(searchQuery.toLowerCase());
                  }
                  const sType = s.type || 'servico';
                  const matchesTab = sType === activeTab && s.active !== false;
                  const matchesSearch = s.description.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesTab && matchesSearch;
                })
                .map((s, index) => {
                  const isProduct = s.type === 'produto';
                  const mult = isProduct ? ceil2(s.multiplier || 1.0) : 1.0;
                  const shippingCostVal = isProduct && s.shippingCost !== undefined ? ceil2(s.shippingCost) : 0;
                  const shippingQtyVal = isProduct && s.shippingQty !== undefined ? s.shippingQty : 0;
                  const calculatedCost = ceil2((s.cost * mult) + (shippingQtyVal > 0 ? (shippingCostVal / shippingQtyVal) : 0));
                  const hasVars = isProduct && s.hasVariations && s.variations && s.variations.length > 0;
                  const isExpanded = expandedSupplyIds.includes(s.id);
                  
                  if (activeTab === 'servico') {
                    return (
                      <tr key={`${s.id}_${index}`} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-400 font-medium">{index + 1}</td>
                        <td className="p-4 font-medium text-slate-800">{s.description}</td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold">{s.unit}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">R$ {ceil2(s.cost).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer p-1" title="Editar"><Pencil size={17}/></button>
                            <button onClick={() => removeSupply(s.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1" title="Excluir"><Trash2 size={17}/></button>
                            <label 
                              className="inline-flex items-center gap-1 cursor-pointer select-none bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                              title="Desmarque a caixa para inativar este serviço"
                            >
                              <input 
                                type="checkbox"
                                checked={s.active !== false}
                                onChange={(e) => handleToggleActive(s, e)}
                                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-[10px] font-bold text-emerald-800">Ativo</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  } else if (activeTab === 'produto') {
                    return (
                      <React.Fragment key={`${s.id}_${index}`}>
                        <tr className={`border-b border-gray-100 hover:bg-slate-50 transition-colors ${hasVars ? 'bg-indigo-50/20' : ''}`}>
                          <td className="p-3 text-center">
                            {hasVars && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(s.id)}
                                className="p-1 rounded hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                                title={isExpanded ? 'Recolher variações' : 'Ver variações'}
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-slate-400 font-medium">{index + 1}</td>
                          <td className="p-4 font-medium text-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{s.description}</span>
                              {hasVars && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(s.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-200 transition-colors cursor-pointer"
                                >
                                  <Layers size={11} /> {s.variations!.length} Variações de Qtd
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold">{s.unit}</span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">
                            {hasVars ? (
                              <span className="text-xs text-slate-600">
                                {ceil2(Math.min(...s.variations!.map(v => v.cost))).toFixed(2)} ~ {ceil2(Math.max(...s.variations!.map(v => v.cost))).toFixed(2)}
                              </span>
                            ) : (
                              `R$ ${ceil2(s.cost).toFixed(2)}`
                            )}
                          </td>
                          <td className="p-4 text-center font-mono font-medium text-slate-600">
                            <span className="text-indigo-600 font-bold">{mult.toFixed(2)}x</span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">
                            {s.shippingCost !== undefined ? `R$ ${ceil2(s.shippingCost).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-4 text-center font-mono text-slate-500">
                            {hasVars ? (
                              <span className="text-xs text-indigo-700 font-semibold">
                                {s.variations!.map(v => v.quantity).join(', ')} un
                              </span>
                            ) : (
                              s.shippingQty !== undefined ? s.shippingQty : '-'
                            )}
                          </td>
                          <td className="p-4 text-right font-mono text-emerald-600 font-bold">
                            {hasVars ? (
                              <span className="text-xs">
                                A partir de R$ {ceil2(Math.min(...s.variations!.map(v => v.cost * (v.multiplier !== undefined ? v.multiplier : mult)))).toFixed(2)}
                              </span>
                            ) : (
                              `R$ ${calculatedCost.toFixed(2)}`
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer p-1" title="Editar"><Pencil size={17}/></button>
                              <button onClick={() => removeSupply(s.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1" title="Excluir"><Trash2 size={17}/></button>
                              <label 
                                className="inline-flex items-center gap-1 cursor-pointer select-none bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                                title="Desmarque a caixa para inativar este produto"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={s.active !== false}
                                  onChange={(e) => handleToggleActive(s, e)}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-emerald-800">Ativo</span>
                              </label>
                            </div>
                          </td>
                        </tr>

                        {/* Linha expandida com a tabela detalhada de variações */}
                        {hasVars && isExpanded && (
                          <tr className="bg-indigo-50/40 border-b border-indigo-100">
                            <td colSpan={10} className="p-4 pl-12">
                              <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                    <Layers size={13} className="text-indigo-600" />
                                    Tabela de Tiragens & Valores: {s.description}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {s.variations!.length} opções de tiragens configuradas
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead className="text-slate-500 uppercase font-semibold text-[10px] bg-slate-50">
                                      <tr>
                                        <th className="p-2">Opção / Tiragem</th>
                                        <th className="p-2 text-center">Unidade</th>
                                        <th className="p-2 text-right">Custo Base Unit.</th>
                                        <th className="p-2 text-center">Fator</th>
                                        <th className="p-2 text-center">Qtdade</th>
                                        <th className="p-2 text-right">Custo Calc. Unitário</th>
                                        <th className="p-2 text-right font-bold text-indigo-950">Total da Tiragem</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {s.variations!.map((v, vIndex) => {
                                        const vMult = v.multiplier !== undefined ? ceil2(v.multiplier) : mult;
                                        const vUnitCalc = ceil2(v.cost * vMult);
                                        const vTotal = ceil2(vUnitCalc * (v.quantity || 1));

                                        return (
                                          <tr key={v.id || vIndex} className="hover:bg-slate-50/80">
                                            <td className="p-2 font-bold text-slate-800">
                                              {vIndex + 1} - {s.description} ({v.quantity} {v.unit || s.unit || 'unidades'})
                                            </td>
                                            <td className="p-2 text-center text-slate-500 uppercase">{v.unit || s.unit}</td>
                                            <td className="p-2 text-right font-mono text-slate-600">R$ {ceil2(v.cost).toFixed(2)}</td>
                                            <td className="p-2 text-center font-mono text-indigo-600 font-semibold">{vMult.toFixed(2)}x</td>
                                            <td className="p-2 text-center font-mono font-bold text-slate-800">{v.quantity}</td>
                                            <td className="p-2 text-right font-mono text-slate-700 font-semibold">R$ {vUnitCalc.toFixed(2)}</td>
                                            <td className="p-2 text-right font-mono font-bold text-emerald-600">R$ {vTotal.toFixed(2)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  } else {
                    // ABA INATIVOS
                    return (
                      <React.Fragment key={`${s.id}_${index}`}>
                        <tr className="border-b border-gray-100 hover:bg-amber-50/30 transition-colors bg-slate-50/40">
                          <td className="p-3 text-center">
                            {hasVars && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(s.id)}
                                className="p-1 rounded hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                                title={isExpanded ? 'Recolher variações' : 'Ver variações'}
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-slate-400 font-medium">{index + 1}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isProduct 
                                ? 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isProduct ? 'Impressão' : 'Serviço'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-700">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-600">{s.description}</span>
                              {hasVars && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(s.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300 transition-colors cursor-pointer"
                                >
                                  <Layers size={11} /> {s.variations!.length} Variações
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs uppercase font-semibold">{s.unit}</span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">R$ {ceil2(s.cost).toFixed(2)}</td>
                          <td className="p-4 text-center font-mono text-xs text-slate-500">
                            {isProduct ? `${mult.toFixed(2)}x` : '-'}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                              Inativo
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <label 
                                className="inline-flex items-center gap-1 cursor-pointer select-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 transition-colors font-bold text-xs shadow-2xs"
                                title="Marque a caixa para reativar este produto"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={false}
                                  onChange={(e) => handleToggleActive(s, e)}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span>Reativar</span>
                              </label>
                              <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer p-1" title="Editar"><Pencil size={17}/></button>
                              <button onClick={() => removeSupply(s.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1" title="Excluir Definitivamente"><Trash2 size={17}/></button>
                            </div>
                          </td>
                        </tr>

                        {/* Linha expandida de variações para itens inativos */}
                        {hasVars && isExpanded && (
                          <tr className="bg-indigo-50/40 border-b border-indigo-100">
                            <td colSpan={9} className="p-4 pl-12">
                              <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                    <Layers size={13} className="text-indigo-600" />
                                    Tabela de Tiragens & Valores: {s.description}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {s.variations!.length} opções de tiragens configuradas
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead className="text-slate-500 uppercase font-semibold text-[10px] bg-slate-50">
                                      <tr>
                                        <th className="p-2">Opção / Tiragem</th>
                                        <th className="p-2 text-center">Unidade</th>
                                        <th className="p-2 text-right">Custo Base Unit.</th>
                                        <th className="p-2 text-center">Fator</th>
                                        <th className="p-2 text-center">Qtdade</th>
                                        <th className="p-2 text-right">Custo Calc. Unitário</th>
                                        <th className="p-2 text-right font-bold text-indigo-950">Total da Tiragem</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {s.variations!.map((v, vIndex) => {
                                        const vMult = v.multiplier !== undefined ? ceil2(v.multiplier) : mult;
                                        const vUnitCalc = ceil2(v.cost * vMult);
                                        const vTotal = ceil2(vUnitCalc * (v.quantity || 1));

                                        return (
                                          <tr key={v.id || vIndex} className="hover:bg-slate-50/80">
                                            <td className="p-2 font-bold text-slate-800">
                                              {vIndex + 1} - {s.description} ({v.quantity} {v.unit || s.unit || 'unidades'})
                                            </td>
                                            <td className="p-2 text-center text-slate-500 uppercase">{v.unit || s.unit}</td>
                                            <td className="p-2 text-right font-mono text-slate-600">R$ {ceil2(v.cost).toFixed(2)}</td>
                                            <td className="p-2 text-center font-mono text-indigo-600 font-semibold">{vMult.toFixed(2)}x</td>
                                            <td className="p-2 text-center font-mono font-bold text-slate-800">{v.quantity}</td>
                                            <td className="p-2 text-right font-mono text-slate-700 font-semibold">R$ {vUnitCalc.toFixed(2)}</td>
                                            <td className="p-2 text-right font-mono font-bold text-emerald-600">R$ {vTotal.toFixed(2)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }
                })}
              {sortedSupplies.filter(s => {
                if (activeTab === 'inativos') {
                  return s.active === false && s.description.toLowerCase().includes(searchQuery.toLowerCase());
                }
                const sType = s.type || 'servico';
                const matchesTab = sType === activeTab && s.active !== false;
                const matchesSearch = s.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
              }).length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'servico' ? 5 : (activeTab === 'produto' ? 10 : 9)} className="p-8 text-center text-slate-400">
                    {activeTab === 'inativos' ? 'Nenhum insumo ou produto inativo.' : 'Nenhum insumo ativo encontrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
