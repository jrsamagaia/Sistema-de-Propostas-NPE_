import React, { useState } from 'react';
import { CheckCircle, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Cost, Rate } from '../types';
import { ceil2, formatMoney } from '../utils/math';

interface CustosFixosProps {
  costs: Cost[];
  rates: Rate[];
  saveCost: (cost: Cost) => void;
  removeCost: (id: number) => void;
  saveRate: (rate: Rate) => void;
  removeRate: (id: number) => void;
  showNotification: (msg: string) => void;
}

export default function CustosFixos({
  costs,
  rates,
  saveCost,
  removeCost,
  saveRate,
  removeRate,
  showNotification,
}: CustosFixosProps) {
  const [newCostDesc, setNewCostDesc] = useState('');
  const [newCostValue, setNewCostValue] = useState('');
  const [newRateDesc, setNewRateDesc] = useState('');
  const [newRateValue, setNewRateValue] = useState('');

  const [editingCostId, setEditingCostId] = useState<number | null>(null);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostDesc || !newCostValue) return;
    
    const parsedVal = ceil2(parseFloat(newCostValue));
    if (editingCostId) {
      saveCost({ id: editingCostId, description: newCostDesc, value: parsedVal });
      setEditingCostId(null);
      showNotification('Custo fixo atualizado!');
    } else {
      saveCost({ id: Date.now(), description: newCostDesc, value: parsedVal });
      showNotification('Custo fixo adicionado!');
    }
    setNewCostDesc(''); 
    setNewCostValue('');
  };

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateDesc || !newRateValue) return;
    
    const parsedPct = ceil2(parseFloat(newRateValue));
    if (editingRateId) {
      saveRate({ id: editingRateId, description: newRateDesc, percentage: parsedPct });
      setEditingRateId(null);
      showNotification('Taxa ou Margem atualizada!');
    } else {
      saveRate({ id: Date.now(), description: newRateDesc, percentage: parsedPct });
      showNotification('Taxa ou Margem adicionada!');
    }
    setNewRateDesc(''); 
    setNewRateValue('');
  };

  const handleEditCost = (cost: Cost) => {
    setEditingCostId(cost.id);
    setNewCostDesc(cost.description);
    setNewCostValue(cost.value.toString());
  };

  const handleEditRate = (rate: Rate) => {
    setEditingRateId(rate.id);
    setNewRateDesc(rate.description);
    setNewRateValue(rate.percentage.toString());
  };

  const cancelEditCost = () => {
    setEditingCostId(null);
    setNewCostDesc(''); 
    setNewCostValue('');
  };

  const cancelEditRate = () => {
    setEditingRateId(null);
    setNewRateDesc(''); 
    setNewRateValue('');
  };

  const totalCosts = costs.reduce((a, b) => a + b.value, 0);
  const totalRates = rates.reduce((a, b) => a + b.percentage, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Custos Fixos e Precificação</h2>
        <p className="text-xs text-slate-500 font-medium font-sans">Gerencie despesas operacionais e as taxas que compõem o Preço de Venda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Despesas Fixas Mensais</h3>
            <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
              Total: {formatMoney(totalCosts)}
            </span>
          </div>
          
          <form onSubmit={handleAddCost} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Descrição (ex: Aluguel)" 
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
              value={newCostDesc} 
              onChange={e => setNewCostDesc(e.target.value)} 
              required
            />
            <input 
              type="number" 
              step="0.01" 
              placeholder="R$ Valor" 
              className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white" 
              value={newCostValue} 
              onChange={e => setNewCostValue(e.target.value)} 
              required
            />
            <button 
              type="submit" 
              className={`p-2.5 rounded-lg cursor-pointer text-white transition-colors flex items-center justify-center ${editingCostId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`} 
              title={editingCostId ? "Atualizar" : "Adicionar"}
            >
              {editingCostId ? <CheckCircle size={18}/> : <Plus size={18}/>}
            </button>
            {editingCostId && (
              <button 
                type="button" 
                onClick={cancelEditCost} 
                className="bg-slate-100 text-slate-600 p-2.5 rounded-lg hover:bg-slate-200 cursor-pointer" 
                title="Cancelar"
              >
                <X size={18}/>
              </button>
            )}
          </form>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-800 font-bold sticky top-0 border-b border-slate-200 header-font uppercase tracking-wider">
                <tr>
                  <th className="p-3">Descrição</th>
                  <th className="p-3 text-right">Valor Mensal</th>
                  <th className="p-3 text-center w-24">Ação</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(c => (
                  <tr key={c.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-700">{c.description}</td>
                    <td className="p-3 text-right font-mono text-slate-900">{formatMoney(c.value)}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button onClick={() => handleEditCost(c)} className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-1" title="Editar"><Pencil size={15}/></button>
                      <button onClick={() => removeCost(c.id)} className="text-red-500 hover:text-red-700 cursor-pointer p-1" title="Excluir"><Trash2 size={15}/></button>
                    </td>
                  </tr>
                ))}
                {costs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">Nenhum custo cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Composição do Preço (%)</h3>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold">
              Total: {ceil2(totalRates).toFixed(2)}%
            </span>
          </div>

          <form onSubmit={handleAddRate} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Descrição (ex: Comissão)" 
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
              value={newRateDesc} 
              onChange={e => setNewRateDesc(e.target.value)} 
              required
            />
            <input 
              type="number" 
              step="0.01" 
              placeholder="% Percentual" 
              className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white" 
              value={newRateValue} 
              onChange={e => setNewRateValue(e.target.value)} 
              required
            />
            <button 
              type="submit" 
              className={`p-2.5 rounded-lg cursor-pointer text-white transition-colors flex items-center justify-center ${editingRateId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`} 
              title={editingRateId ? "Atualizar" : "Adicionar"}
            >
              {editingRateId ? <CheckCircle size={18}/> : <Plus size={18}/>}
            </button>
            {editingRateId && (
              <button 
                type="button" 
                onClick={cancelEditRate} 
                className="bg-slate-100 text-slate-600 p-2.5 rounded-lg hover:bg-slate-200 cursor-pointer" 
                title="Cancelar"
              >
                <X size={18}/>
              </button>
            )}
          </form>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-800 font-bold sticky top-0 border-b border-slate-200 header-font uppercase tracking-wider">
                <tr>
                  <th className="p-3">Descrição (Impostos, Lucro, etc)</th>
                  <th className="p-3 text-right">% Percentual</th>
                  <th className="p-3 text-center w-24">Ação</th>
                </tr>
              </thead>
              <tbody>
                {rates.map(r => (
                  <tr key={r.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-700">{r.description}</td>
                    <td className="p-3 text-right font-mono text-slate-900 font-semibold">{ceil2(r.percentage).toFixed(2)}%</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button onClick={() => handleEditRate(r)} className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-1" title="Editar"><Pencil size={15}/></button>
                      <button onClick={() => removeRate(r.id)} className="text-red-500 hover:text-red-700 cursor-pointer p-1" title="Excluir"><Trash2 size={15}/></button>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">Nenhuma taxa cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold uppercase tracking-wide">* Estas porcentagens são subtraídas de 100% para gerar o fator multiplicador final das propostas.</p>
        </div>
      </div>
    </div>
  );
}
