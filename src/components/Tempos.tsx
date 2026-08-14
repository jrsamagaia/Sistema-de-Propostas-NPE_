import React, { useState } from 'react';
import { Pencil, Trash2, Plus, CheckCircle, X } from 'lucide-react';
import { Process } from '../types';

interface TemposProps {
  processes: Process[];
  saveProcess: (process: Process) => void;
  removeProcess: (id: number) => void;
  showNotification: (msg: string) => void;
}

export default function Tempos({
  processes,
  saveProcess,
  removeProcess,
  showNotification,
}: TemposProps) {
  const [action, setAction] = useState('');
  const [unit, setUnit] = useState('');
  const [time, setTime] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action || !unit || !time) return;
    
    if (editingId) {
      saveProcess({ id: editingId, action, unit: unit.toLowerCase(), time: parseFloat(time) });
      setEditingId(null);
      showNotification('Tempo atualizado!');
    } else {
      saveProcess({ id: Date.now(), action, unit: unit.toLowerCase(), time: parseFloat(time) });
      showNotification('Tempo de processo cadastrado!');
    }
    setAction(''); 
    setUnit(''); 
    setTime('');
  };

  const handleEdit = (process: Process) => {
    setEditingId(process.id);
    setAction(process.action);
    setUnit(process.unit);
    setTime(process.time.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAction(''); 
    setUnit(''); 
    setTime('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Tempo de Processos</h2>
        <p className="text-slate-500 font-medium">Mapeamento do tempo investido na execução de tarefas específicas.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Ação (Ex: Criação de Capa)" 
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" 
            value={action} 
            onChange={e => setAction(e.target.value)} 
            required
          />
          <input 
            type="text" 
            placeholder="Unidade (Ex: Hora)" 
            className="w-full md:w-32 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" 
            value={unit} 
            onChange={e => setUnit(e.target.value)} 
            required
          />
          <input 
            type="number" 
            step="0.1" 
            placeholder="Tempo Gasto" 
            className="w-full md:w-32 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" 
            value={time} 
            onChange={e => setTime(e.target.value)} 
            required
          />
          <div className="flex gap-2">
            <button 
              type="submit" 
              className={`p-2 rounded cursor-pointer text-white flex items-center justify-center ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
              title={editingId ? "Atualizar" : "Adicionar"}
            >
              {editingId ? <CheckCircle size={20}/> : <Plus size={20}/>}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="bg-gray-200 text-gray-600 p-2 rounded hover:bg-gray-300 cursor-pointer flex items-center justify-center"
                title="Cancelar"
              >
                <X size={20}/>
              </button>
            )}
          </div>
        </form>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-800 font-semibold">
              <tr className="border-b border-gray-200">
                <th className="p-3">Ação Mapeada</th>
                <th className="p-3 text-center">Unidade</th>
                <th className="p-3 text-center">Tempo Est.</th>
                <th className="p-3 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {processes.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{p.action}</td>
                  <td className="p-3 text-center uppercase text-xs font-semibold text-slate-500">{p.unit}</td>
                  <td className="p-3 text-center bg-slate-50/50 font-mono font-medium">{p.time}</td>
                  <td className="p-3 text-center flex justify-center gap-3">
                    <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1" title="Editar"><Pencil size={16}/></button>
                    <button onClick={() => removeProcess(p.id)} className="text-red-500 hover:text-red-700 cursor-pointer p-1" title="Excluir"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {processes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">Nenhum processo cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
