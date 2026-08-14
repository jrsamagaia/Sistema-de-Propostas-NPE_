import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Mail, Phone, MapPin, UserPlus, CheckCircle, X } from 'lucide-react';
import { Lead } from '../types';

interface LeadsProps {
  leads: Lead[];
  saveLead: (lead: Lead) => void;
  removeLead: (id: number) => void;
  showNotification: (msg: string) => void;
}

export default function Leads({
  leads,
  saveLead,
  removeLead,
  showNotification,
}: LeadsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setEditingLeadId(null);
    setIsFormOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showNotification('Nome e Telefone são campos obrigatórios!');
      return;
    }

    // Clean phone numbers: remove non-numeric characters for easier WhatsApp links
    // But preserve leading + if present. Let's keep it clean
    const cleanedPhone = phone.trim().replace(/[^\d+]/g, '');

    const leadData: Lead = {
      id: editingLeadId || Date.now(),
      name: name.trim(),
      phone: cleanedPhone,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    };

    saveLead(leadData);
    showNotification(editingLeadId ? 'Lead atualizado com sucesso!' : 'Novo lead cadastrado com sucesso!');
    resetForm();
  };

  const handleEdit = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setName(lead.name);
    setPhone(lead.phone);
    setEmail(lead.email || '');
    setAddress(lead.address || '');
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza de que deseja excluir este lead?')) {
      removeLead(id);
      showNotification('Lead excluído.');
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Cadastro de Leads</h2>
          <p className="text-slate-500 font-medium">Cadastre e gerencie os contatos dos clientes para envio automático de propostas por WhatsApp.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <UserPlus size={18} />
            Cadastrar Lead
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              {editingLeadId ? 'Editar Lead' : 'Novo Lead / Cliente'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nome completo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nome do cliente"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Telefone (WhatsApp com DDD) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 47999999999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Insira somente números com o DDD (ex: 47991234567)</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">E-mail (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Endereço completo com CEP (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                {editingLeadId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                <th className="py-3.5 px-6 font-semibold">Nome</th>
                <th className="py-3.5 px-6 font-semibold">Contato</th>
                <th className="py-3.5 px-6 font-semibold">Endereço e CEP</th>
                <th className="py-3.5 px-6 w-24 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">Nenhum lead cadastrado ou encontrado.</td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{lead.name}</div>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        <span className="font-mono">{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Mail size={14} className="text-slate-400" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {lead.address ? (
                        <div className="flex items-start gap-2 text-slate-600 max-w-sm text-xs">
                          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{lead.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Não informado</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(lead)} 
                          className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded transition-colors cursor-pointer" 
                          title="Editar lead"
                        >
                          <Pencil size={15}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(lead.id)} 
                          className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded transition-colors cursor-pointer" 
                          title="Excluir lead"
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
