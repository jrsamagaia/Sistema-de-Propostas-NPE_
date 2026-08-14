import React, { useState } from 'react';
import { Pencil, Trash2, Plus, CheckCircle, X, Search } from 'lucide-react';
import { Supply } from '../types';
import AutocompleteSelect from './AutocompleteSelect';

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
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState<'produto' | 'servico'>('servico');
  const [multiplier, setMultiplier] = useState('1.0');
  const [shippingCost, setShippingCost] = useState('');
  const [shippingQty, setShippingQty] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'servico' | 'produto'>('servico');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !unit || !cost) return;
    
    const parsedCost = parseFloat(cost);
    const parsedMultiplier = type === 'produto' ? (parseFloat(multiplier) || 1.0) : 1.0;
    const parsedShippingCost = type === 'produto' && shippingCost ? parseFloat(shippingCost) : undefined;
    const parsedShippingQty = type === 'produto' && shippingQty ? parseInt(shippingQty, 10) : undefined;

    if (editingId) {
      saveSupply({ 
        id: editingId, 
        description: desc, 
        unit: unit.toLowerCase(), 
        cost: parsedCost,
        type: type,
        multiplier: parsedMultiplier,
        shippingCost: parsedShippingCost,
        shippingQty: parsedShippingQty
      });
      setEditingId(null);
      showNotification('Insumo atualizado!');
    } else {
      saveSupply({ 
        id: Date.now(), 
        description: desc, 
        unit: unit.toLowerCase(), 
        cost: parsedCost,
        type: type,
        multiplier: parsedMultiplier,
        shippingCost: parsedShippingCost,
        shippingQty: parsedShippingQty
      });
      showNotification('Insumo cadastrado!');
    }
    setDesc(''); 
    setUnit(''); 
    setCost('');
    setType('servico');
    setMultiplier('1.0');
    setShippingCost('');
    setShippingQty('');
  };

  const handleEdit = (supply: Supply) => {
    setEditingId(supply.id);
    setDesc(supply.description);
    setUnit(supply.unit);
    setCost(supply.cost.toString());
    const supplyType = supply.type || 'servico';
    setType(supplyType);
    setMultiplier((supply.multiplier !== undefined ? supply.multiplier : 1.0).toString());
    setShippingCost(supply.shippingCost !== undefined ? supply.shippingCost.toString() : '');
    setShippingQty(supply.shippingQty !== undefined ? supply.shippingQty.toString() : '');
    setActiveTab(supplyType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDesc(''); 
    setUnit(''); 
    setCost('');
    setType('servico');
    setMultiplier('1.0');
    setShippingCost('');
    setShippingQty('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Catálogo de Insumos</h2>
        <p className="text-slate-500 font-medium">Cadastre os serviços, impressões e materiais que compõem seus projetos.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição do Serviço ou Material</label>
              <input 
                type="text" 
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
                  { value: 'produto', label: 'Impressão / Gráfica', sublabel: 'Materiais impressos (com Fator Multiplicador)' },
                ]}
                value={type}
                onChange={(val) => {
                  const newType = (val as 'produto' | 'servico') || 'servico';
                  setType(newType);
                  if (newType === 'servico') setMultiplier('1.0');
                }}
                placeholder="Selecione o tipo..."
                searchPlaceholder="Pesquisar tipo de insumo..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unidade (Ex: Lauda)</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" 
                value={unit} 
                onChange={e => setUnit(e.target.value)} 
                required 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Custo Base (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white font-mono" 
                value={cost} 
                onChange={e => setCost(e.target.value)} 
                required 
              />
            </div>
          </div>

          {type === 'produto' && (
            <div className="bg-indigo-50/55 p-4 rounded-lg border border-indigo-100 mt-2">
              <p className="text-xs font-bold text-indigo-700 uppercase mb-3 tracking-wide">Parâmetros de Impressão</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 uppercase mb-1">Fator Multiplicador</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    className="w-full border border-indigo-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white font-semibold text-indigo-700" 
                    value={multiplier} 
                    onChange={e => setMultiplier(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 uppercase mb-1">Valor do Frete (R$)</label>
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
                  <label className="block text-xs font-semibold text-indigo-600 uppercase mb-1">Quantidade de Livros</label>
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
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('servico')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'servico'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Serviços
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('produto')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'produto'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Impressão
            </button>
          </div>

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
        <div className="mb-4 text-left">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'servico' ? 'Serviços Cadastrados' : 'Impressões e Materiais Cadastrados'}
            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {supplies.filter(s => {
                const sType = s.type || 'servico';
                const matchesTab = sType === activeTab;
                const matchesSearch = s.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
              }).length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-900 text-white font-semibold">
              {activeTab === 'servico' ? (
                <tr>
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-center">Und Medida</th>
                  <th className="p-4 text-right">Custo Base</th>
                  <th className="p-4 text-center w-28">Ações</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-center">Und Medida</th>
                  <th className="p-4 text-right">Custo Base</th>
                  <th className="p-4 text-center">Fator</th>
                  <th className="p-4 text-right">Vl. Frete</th>
                  <th className="p-4 text-center">Qtd</th>
                  <th className="p-4 text-right">Custo Calculado</th>
                  <th className="p-4 text-center w-28">Ações</th>
                </tr>
              )}
            </thead>
            <tbody>
              {supplies
                .filter(s => {
                  const sType = s.type || 'servico';
                  const matchesTab = sType === activeTab;
                  const matchesSearch = s.description.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesTab && matchesSearch;
                })
                .map((s, index) => {
                  const isProduct = s.type === 'produto';
                  const mult = isProduct ? (s.multiplier || 1.0) : 1.0;
                  const shippingCostVal = isProduct && s.shippingCost !== undefined ? s.shippingCost : 0;
                  const shippingQtyVal = isProduct && s.shippingQty !== undefined ? s.shippingQty : 0;
                  const calculatedCost = (s.cost * mult) + (shippingQtyVal > 0 ? (shippingCostVal / shippingQtyVal) : 0);
                  
                  if (activeTab === 'servico') {
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-400">{index + 1}</td>
                        <td className="p-4 font-medium text-slate-800">{s.description}</td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold">{s.unit}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">R$ {s.cost.toFixed(2)}</td>
                        <td className="p-4 text-center flex justify-center gap-3">
                          <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer p-1" title="Editar"><Pencil size={18}/></button>
                          <button onClick={() => removeSupply(s.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1" title="Excluir"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-400">{index + 1}</td>
                        <td className="p-4 font-medium text-slate-800">{s.description}</td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold">{s.unit}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">R$ {s.cost.toFixed(2)}</td>
                        <td className="p-4 text-center font-mono font-medium text-slate-600">
                          <span className="text-indigo-600 font-bold">{mult.toFixed(2)}x</span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">
                          {s.shippingCost !== undefined ? `R$ ${s.shippingCost.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4 text-center font-mono text-slate-500">
                          {s.shippingQty !== undefined ? s.shippingQty : '-'}
                        </td>
                        <td className="p-4 text-right font-mono text-emerald-600 font-bold">R$ {calculatedCost.toFixed(2)}</td>
                        <td className="p-4 text-center flex justify-center gap-3">
                          <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer p-1" title="Editar"><Pencil size={18}/></button>
                          <button onClick={() => removeSupply(s.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1" title="Excluir"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    );
                  }
                })}
              {supplies.filter(s => {
                const sType = s.type || 'servico';
                const matchesTab = sType === activeTab;
                const matchesSearch = s.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
              }).length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'servico' ? 5 : 9} className="p-8 text-center text-slate-400">
                    Nenhum insumo encontrado.
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
