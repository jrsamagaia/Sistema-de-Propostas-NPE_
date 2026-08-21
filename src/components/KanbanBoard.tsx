import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, X, Pencil, Trash2, GripVertical, Search, DollarSign, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Proposal, Status, getInstallmentScheduleText } from '../types';
import AutocompleteSelect from './AutocompleteSelect';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const parseProposalDate = (dateStr?: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // DD/MM/YYYY
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }

  // YYYY-MM-DD
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const getEffectiveDate = (prop: Proposal): Date | null => {
  const isApproved = prop.status && prop.status.toLowerCase().includes('aprovad');
  if (isApproved) {
    if (prop.approvedDate) {
      const parsedApproved = parseProposalDate(prop.approvedDate);
      if (parsedApproved) return parsedApproved;
    }
    return parseProposalDate(prop.date);
  }

  // Para propostas com status diferente de aprovada: filtrar pela Validade da Proposta
  if (prop.validityDate) {
    const parsedValidity = parseProposalDate(prop.validityDate);
    if (parsedValidity) return parsedValidity;
  }

  if (prop.date && prop.validationDays) {
    const baseDate = parseProposalDate(prop.date);
    if (baseDate) {
      const vDate = new Date(baseDate);
      vDate.setDate(vDate.getDate() + prop.validationDays);
      return vDate;
    }
  }

  return parseProposalDate(prop.date);
};

const formatToISO = (dateStr?: string) => {
  if (!dateStr) {
    const localToday = new Date();
    return `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
  }
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatToBR = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

interface KanbanBoardProps {
  proposals: Proposal[];
  statuses: Status[];
  updateProposalStatus: (id: number, newStatus: string, approvedValue?: number, approvedPaymentMethod?: string, approvedInstallmentsDetails?: string, approvedDate?: string) => void;
  saveStatus: (status: Status) => void;
  removeStatus: (id: number) => void;
  updateStatusName: (oldName: string, newName: string, statusObj: Status) => Promise<void>;
  onReorderStatuses: (newStatuses: Status[]) => void;
  goToNewProposal: () => void;
  onEditProposal: (prop: Proposal) => void;
  showNotification: (msg: string) => void;
}

export default function KanbanBoard({
  proposals,
  statuses,
  updateProposalStatus,
  saveStatus,
  removeStatus,
  updateStatusName,
  onReorderStatuses,
  goToNewProposal,
  onEditProposal,
  showNotification,
}: KanbanBoardProps) {
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusName, setEditingStatusName] = useState('');

  // Filtering states - default to current month and year
  const [filterMonth, setFilterMonth] = useState<string>(() => new Date().getMonth().toString()); // 'all' | '0'..'11'
  const [filterYear, setFilterYear] = useState<string>(() => new Date().getFullYear().toString()); // 'all' | '2026'..
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Approval Modal States
  const [proposalForApproval, setProposalForApproval] = useState<Proposal | null>(null);
  const [approvedValue, setApprovedValue] = useState<string>('');
  const [approvedPaymentMethod, setApprovedPaymentMethod] = useState<string>('Pix');
  const [approvedInstallmentsDetails, setApprovedInstallmentsDetails] = useState<string>('');
  const [approvedDate, setApprovedDate] = useState<string>('');
  const [targetStatusForApproval, setTargetStatusForApproval] = useState<string>('');

  const handleConfirmApproval = () => {
    if (!proposalForApproval) return;
    const numericValue = parseFloat(approvedValue) || proposalForApproval.sellPrice;
    
    // We only pass the installments details if the selected payment method supports/needs them
    const isInstallmentsMethod = 
      approvedPaymentMethod === 'Cartão de Crédito Parcelado' || 
      approvedPaymentMethod === 'Entrada + Parcelas';
    const installmentsDetails = isInstallmentsMethod ? approvedInstallmentsDetails : '';

    updateProposalStatus(
      proposalForApproval.id, 
      targetStatusForApproval, 
      numericValue, 
      approvedPaymentMethod,
      installmentsDetails,
      formatToBR(approvedDate)
    );
    showNotification(`Proposta aprovada com sucesso! Valor: R$ ${numericValue.toFixed(2)} - Pagamento: ${approvedPaymentMethod}`);
    setProposalForApproval(null);
    setApprovedInstallmentsDetails('');
    setApprovedDate('');
  };

  // Drag and Drop State
  const [draggedType, setDraggedType] = useState<'proposal' | 'column' | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Proposal drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, proposalId: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'proposal', id: proposalId }));
    e.dataTransfer.setData('text/plain', proposalId.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedType('proposal');
    (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedType(null);
    setHoveredIndex(null);
  };

  // Column drag handlers
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const target = e.target as HTMLElement;
    // Don't drag column if we are editing text, interacting with buttons/inputs, or dragging cards
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'BUTTON' || 
      target.tagName === 'SELECT' || 
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') ||
      target.closest('.proposal-card')
    ) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'column', index }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedType('column');
    setDraggedIndex(index);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.4';
  };

  const handleColumnDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedType(null);
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredIndex !== index) {
      setHoveredIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number, targetStatusName: string) => {
    e.preventDefault();
    setHoveredIndex(null);
    setDraggedType(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!dataStr) return;

      if (dataStr.trim().startsWith('{')) {
        const data = JSON.parse(dataStr);
        if (data.type === 'proposal') {
          const propId = Number(data.id);
          const prop = proposals.find(p => p.id === propId);
          if (prop && targetStatusName.toLowerCase().includes('aprovad')) {
            setProposalForApproval(prop);
            setApprovedValue(prop.sellPrice.toString());
            setApprovedPaymentMethod(prop.approvedPaymentMethod || 'Pix');
            setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
            setApprovedDate(formatToISO(prop.approvedDate));
            setTargetStatusForApproval(targetStatusName);
          } else {
            updateProposalStatus(propId, targetStatusName);
          }
        } else if (data.type === 'column') {
          const sourceIndex = data.index;
          if (sourceIndex !== targetIndex) {
            const reordered = [...statuses];
            const [removed] = reordered.splice(sourceIndex, 1);
            reordered.splice(targetIndex, 0, removed);
            onReorderStatuses(reordered);
            showNotification("Ordem das colunas alterada com sucesso.");
          }
        }
      } else {
        // Fallback for simple proposal ID string
        const propId = Number(dataStr);
        const prop = proposals.find(p => p.id === propId);
        if (prop && targetStatusName.toLowerCase().includes('aprovad')) {
          setProposalForApproval(prop);
          setApprovedValue(prop.sellPrice.toString());
          setApprovedPaymentMethod(prop.approvedPaymentMethod || 'Pix');
          setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
          setApprovedDate(formatToISO(prop.approvedDate));
          setTargetStatusForApproval(targetStatusName);
        } else {
          updateProposalStatus(propId, targetStatusName);
        }
      }
    } catch (err) {
      console.error("Erro no drop:", err);
    }
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    const newOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.order || 0)) + 1 : 1;
    saveStatus({
      id: Date.now(),
      name: newStatusName.trim(),
      order: newOrder,
    });
    setNewStatusName('');
    setIsAddingStatus(false);
    showNotification("Nova coluna adicionada.");
  };

  const handleStartEditStatus = (status: Status) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
  };

  const handleSaveEditStatus = (status: Status) => {
    if (!editingStatusName.trim()) return;
    updateStatusName(status.name, editingStatusName.trim(), status);
    setEditingStatusId(null);
    showNotification("Coluna renomeada com sucesso.");
  };

  const handleDeleteStatus = (status: Status) => {
    const hasProposals = proposals.some(p => p.status === status.name);
    if (hasProposals) {
      showNotification("Atenção: Não é possível excluir esta coluna pois existem propostas nela. Mova as propostas antes.");
      return;
    }
    removeStatus(status.id);
    showNotification("Coluna excluída.");
  };

  // Filter proposals by month, year and search query
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearSet = new Set<number>([currentYear]);
    proposals.forEach(p => {
      const d = getEffectiveDate(p);
      if (d) {
        yearSet.add(d.getFullYear());
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(prop => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (prop.name || '').toLowerCase().includes(q);
        const matchClient = (prop.clientName || '').toLowerCase().includes(q);
        const matchId = prop.id.toString().includes(q);
        if (!matchName && !matchClient && !matchId) return false;
      }

      // 2. Month and Year filter
      if (filterMonth !== 'all' || filterYear !== 'all') {
        const d = getEffectiveDate(prop);
        if (!d) return false;

        if (filterMonth !== 'all') {
          const targetMonth = parseInt(filterMonth, 10);
          if (d.getMonth() !== targetMonth) return false;
        }

        if (filterYear !== 'all') {
          const targetYear = parseInt(filterYear, 10);
          if (d.getFullYear() !== targetYear) return false;
        }
      }

      return true;
    });
  }, [proposals, filterMonth, filterYear, searchQuery]);

  const totalFilteredValue = useMemo(() => {
    return filteredProposals.reduce((acc, curr) => {
      const isApproved = curr.status && curr.status.toLowerCase().includes('aprovad');
      const val = (isApproved && curr.approvedValue !== undefined) ? curr.approvedValue : curr.sellPrice;
      return acc + val;
    }, 0);
  }, [filteredProposals]);

  const handlePrevMonth = () => {
    if (filterMonth === 'all') {
      const now = new Date();
      setFilterMonth(now.getMonth().toString());
      setFilterYear(now.getFullYear().toString());
      return;
    }
    let m = parseInt(filterMonth, 10);
    let y = filterYear === 'all' ? new Date().getFullYear() : parseInt(filterYear, 10);
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setFilterMonth(m.toString());
    setFilterYear(y.toString());
  };

  const handleNextMonth = () => {
    if (filterMonth === 'all') {
      const now = new Date();
      setFilterMonth(now.getMonth().toString());
      setFilterYear(now.getFullYear().toString());
      return;
    }
    let m = parseInt(filterMonth, 10);
    let y = filterYear === 'all' ? new Date().getFullYear() : parseInt(filterYear, 10);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setFilterMonth(m.toString());
    setFilterYear(y.toString());
  };

  const getColumnStyle = (statusName: string) => {
    const name = statusName.toLowerCase();
    if (name.includes('desenvolvimento') || name.includes('novo') || name.includes('iníci')) {
      return 'bg-slate-100 border-slate-200 text-slate-700';
    }
    if (name.includes('aprovação') || name.includes('enviad') || name.includes('análise')) {
      return 'bg-blue-50 border-blue-200 text-blue-700';
    }
    if (name.includes('não') || name.includes('cancelad') || name.includes('perdid') || name.includes('recusad')) {
      return 'bg-rose-50 border-rose-200 text-rose-700';
    }
    if (name.includes('aprovad') || name.includes('ganho') || name.includes('fechad') || name.includes('concluíd')) {
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
    return 'bg-amber-50 border-amber-200 text-amber-800'; 
  };

  return (
    <div className="h-full flex flex-col space-y-3 animate-fade-in">
      {/* Month Navigator & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-sans">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month / Period Navigator with < [Mês de Ano ⌄] > */}
          <div className="inline-flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-r border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="relative flex items-center px-3 py-1.5 hover:bg-slate-50 cursor-pointer transition-colors group">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap min-w-[135px] justify-center select-none">
                {filterMonth === 'all' 
                  ? 'Todos os Períodos'
                  : `${MONTH_NAMES[parseInt(filterMonth, 10)]} de ${filterYear === 'all' ? new Date().getFullYear() : filterYear}`
                }
                <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </span>
              <select
                value={filterMonth === 'all' ? 'all' : `${filterMonth}-${filterYear}`}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setFilterMonth('all');
                    setFilterYear('all');
                  } else {
                    const [m, y] = e.target.value.split('-');
                    setFilterMonth(m);
                    setFilterYear(y);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Selecionar período"
              >
                <option value="all">Todos os Períodos</option>
                {availableYears.map(yr => (
                  MONTH_NAMES.map((mName, idx) => (
                    <option key={`${idx}-${yr}`} value={`${idx}-${yr}`}>
                      {mName} de {yr}
                    </option>
                  ))
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-l border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar por proposta/cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 self-end md:self-center">
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
            {filteredProposals.length} {filteredProposals.length === 1 ? 'proposta' : 'propostas'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-800 font-mono text-[12px]">
            Total: R$ {totalFilteredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-6 min-w-max">
          {statuses.map((status, index) => {
            const propsInStatus = filteredProposals.filter(p => p.status === status.name);
            const totalValueInStatus = propsInStatus.reduce((acc, curr) => {
              const isApproved = curr.status && curr.status.toLowerCase().includes('aprovad');
              const val = (isApproved && curr.approvedValue !== undefined) ? curr.approvedValue : curr.sellPrice;
              return acc + val;
            }, 0);

            // Conditional styling for Drag & Drop highlights
            const isHovered = hoveredIndex === index;
            const isCurrentlyDragged = draggedType === 'column' && draggedIndex === index;
            
            let colBorderClass = "border-slate-200";
            let colBgClass = "bg-slate-50/50";
            
            if (draggedType === 'proposal' && isHovered) {
              colBorderClass = "border-indigo-400 ring-2 ring-indigo-100";
              colBgClass = "bg-indigo-50/30";
            } else if (draggedType === 'column' && isHovered && draggedIndex !== index) {
              colBorderClass = "border-indigo-500 border-dashed border-2 ring-2 ring-indigo-100 scale-[1.01]";
              colBgClass = "bg-indigo-50/40";
            } else if (isCurrentlyDragged) {
              colBorderClass = "border-slate-200 opacity-40";
              colBgClass = "bg-slate-100";
            }

            return (
              <div 
                key={status.id}
                draggable={editingStatusId !== status.id}
                onDragStart={(e) => handleColumnDragStart(e, index)}
                onDragEnd={handleColumnDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index, status.name)}
                className={`flex flex-col w-[320px] rounded-xl border shrink-0 group/col transition-all duration-200 ${colBorderClass} ${colBgClass}`}
              >
                <div className={`p-4 border-b rounded-t-xl flex justify-between items-center ${getColumnStyle(status.name)}`}>
                  {editingStatusId === status.id ? (
                    <div className="flex gap-2 w-full">
                      <input 
                        type="text" 
                        value={editingStatusName}
                        onChange={(e) => setEditingStatusName(e.target.value)}
                        className="w-full text-sm font-bold bg-white/80 border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEditStatus(status)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer"><CheckCircle size={18}/></button>
                      <button onClick={() => setEditingStatusId(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer"><X size={18}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span 
                          className="text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing shrink-0 p-0.5 hover:bg-white/50 rounded transition-colors"
                          title="Arraste para reordenar esta coluna"
                        >
                          <GripVertical size={14} />
                        </span>
                        <h3 className="font-bold text-xs uppercase tracking-wider truncate" title={status.name}>
                          {status.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="hidden group-hover/col:flex gap-1.5">
                          <button onClick={() => handleStartEditStatus(status)} className="p-1 bg-white/50 rounded hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" title="Editar nome"><Pencil size={13}/></button>
                          <button onClick={() => handleDeleteStatus(status)} className="p-1 bg-white/50 rounded hover:bg-white text-slate-500 hover:text-rose-600 transition-colors cursor-pointer" title="Excluir coluna"><Trash2 size={13}/></button>
                        </div>
                        <span className="bg-white/60 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          {propsInStatus.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="px-4 py-2 bg-white/60 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex justify-between">
                  <span>Valor Estimado:</span>
                  <span className="text-slate-700 font-mono">R$ {totalValueInStatus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[150px]">
                  {propsInStatus.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      Sem propostas nesta etapa
                    </div>
                  ) : (
                    propsInStatus.map((prop, pIdx) => (
                      <div 
                        key={`${prop.id}_${pIdx}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, prop.id)}
                        onDragEnd={handleDragEnd}
                        className="proposal-card bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                      >
                        <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center justify-between pr-6">
                          <span>#{prop.id.toString().slice(-6)}</span>
                          <span className="truncate" title={prop.status.toLowerCase().includes('aprovad') ? `Aprovada em ${prop.approvedDate || prop.date}` : `Criada: ${prop.date}${prop.validityDate ? ` | Validade: ${prop.validityDate}` : ''}`}>
                            {prop.status.toLowerCase().includes('aprovad') && prop.approvedDate
                              ? `Aprovada: ${prop.approvedDate}`
                              : (prop.validityDate ? `Válida até: ${prop.validityDate}` : prop.date)}
                          </span>
                        </div>
                        {prop.clientName && (
                          <div className="text-[11px] font-semibold text-indigo-600 truncate mb-1">
                            {prop.clientName}
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditProposal(prop);
                          }}
                          className="absolute top-3.5 right-3.5 p-1 bg-slate-50 border border-slate-200 rounded-md text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Editar proposta"
                        >
                          <Pencil size={11} />
                        </button>
                        <h4 className="font-bold text-slate-800 leading-tight mb-3 pr-6 text-sm">{prop.name}</h4>
                        
                        {prop.approvedPaymentMethod && (
                          <div className="mb-2 bg-emerald-50/80 border border-emerald-100 rounded-lg p-2 text-[11px] text-emerald-800 space-y-0.5 font-sans">
                            <div className="flex justify-between items-center">
                              <span>Pgto: <strong className="font-bold">{prop.approvedPaymentMethod}</strong></span>
                              {prop.approvedValue !== undefined && (
                                <span className="font-bold font-mono text-emerald-700">
                                  R$ {prop.approvedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            {prop.approvedInstallmentsDetails && (
                              <div className="text-[10px] text-emerald-700 italic border-t border-emerald-100/50 pt-0.5 mt-0.5">
                                {prop.approvedInstallmentsDetails}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                          <span className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-semibold">
                            {prop.items.length} {prop.items.length === 1 ? 'item' : 'itens'}
                          </span>
                          <span className="font-bold text-emerald-600 text-sm font-mono">
                            R$ {prop.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Mobile quick status selector */}
                        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100 flex items-center justify-between gap-1 md:hidden">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Etapa:</span>
                          <select 
                            value={prop.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus.toLowerCase().includes('aprovad')) {
                                setProposalForApproval(prop);
                                setApprovedValue(prop.sellPrice.toString());
                                setApprovedPaymentMethod(prop.approvedPaymentMethod || 'Pix');
                                setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
                                setApprovedDate(formatToISO(prop.approvedDate));
                                setTargetStatusForApproval(newStatus);
                              } else {
                                updateProposalStatus(prop.id, newStatus);
                              }
                            }}
                            className="bg-slate-50 border border-slate-200 rounded text-[11px] py-1 px-1.5 font-bold text-slate-700 max-w-[150px] focus:ring-1 focus:ring-indigo-500 outline-none"
                          >
                            {statuses.map(st => (
                              <option key={st.id} value={st.name}>{st.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col w-[280px] shrink-0 pt-2">
            {isAddingStatus ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="Nome da coluna..."
                  autoFocus
                  value={newStatusName}
                  onChange={e => setNewStatusName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddStatus} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-semibold flex-1 hover:bg-indigo-700 transition-colors cursor-pointer">Salvar</button>
                  <button onClick={() => setIsAddingStatus(false)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded text-xs font-semibold flex-1 hover:bg-slate-200 transition-colors cursor-pointer">Cancelar</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingStatus(true)}
                className="h-[60px] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:border-indigo-400 hover:text-indigo-600 transition-all gap-2 text-xs font-semibold cursor-pointer"
              >
                <Plus size={16} /> Nova Etapa do Funil
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Approval Details Modal */}
      {proposalForApproval && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6" id="approval-modal-wrapper">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-fade-in text-slate-800 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Confirmar Proposta Aprovada
              </h3>
              <button 
                onClick={() => setProposalForApproval(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Projeto</p>
              <h4 className="font-bold text-slate-800 text-sm leading-snug">{proposalForApproval.name}</h4>
              <div className="flex justify-between pt-1 text-xs">
                <span className="text-slate-500 font-medium">Orçamento original:</span>
                <span className="font-bold text-slate-700 font-mono">R$ {proposalForApproval.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Valor de Venda Aprovado (R$) <span className="text-red-500">*</span></label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-400 text-sm font-semibold">R$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={approvedValue}
                    onChange={(e) => setApprovedValue(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <AutocompleteSelect
                  label="Forma de Pagamento"
                  required
                  options={[
                    { value: 'Pix', label: 'Pix (À vista)', sublabel: 'Pagamento instantâneo via QR Code ou Chave' },
                    { value: 'Pix parcelado', label: 'Pix Parcelado', sublabel: 'Pagamento via PIX dividido em parcelas mensais' },
                    { value: 'Cartão de Crédito', label: 'Cartão de Crédito (À vista)', sublabel: 'Pagamento em 1x no cartão' },
                    { value: 'Cartão de Crédito Parcelado', label: 'Cartão de Crédito Parcelado', sublabel: 'Pagamento parcelado com ou sem juros' },
                    { value: 'Boleto Bancário', label: 'Boleto Bancário', sublabel: 'Emissão de boleto para pagamento' },
                    { value: 'Transferência Bancária / TED', label: 'Transferência Bancária / TED', sublabel: 'Depósito ou transferência direta' },
                    { value: 'Entrada + Parcelas', label: 'Entrada + Parcelas', sublabel: 'Sinal de entrada e saldo em parcelas' },
                    { value: 'Outro', label: 'Outro', sublabel: 'Condição personalizada ou troca' },
                  ]}
                  value={approvedPaymentMethod}
                  onChange={(val) => setApprovedPaymentMethod(val || 'Pix')}
                  placeholder="Selecione a forma de pagamento..."
                  searchPlaceholder="Pesquisar forma de pagamento..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Data de Aprovação <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={approvedDate}
                  onChange={(e) => setApprovedDate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 bg-white font-semibold"
                  required
                />
              </div>

              {(approvedPaymentMethod === 'Cartão de Crédito Parcelado' || approvedPaymentMethod === 'Entrada + Parcelas') && (
                <div className="animate-fade-in space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalhamento de Entrada / Parcelas <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Entrada R$ 500,00 + 3x de R$ 377,31"
                    value={approvedInstallmentsDetails}
                    onChange={(e) => setApprovedInstallmentsDetails(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 bg-white placeholder-slate-400 font-semibold"
                  />

                  {/* Sugestões baseadas nas condições salvas na proposta */}
                  {approvedPaymentMethod === 'Cartão de Crédito Parcelado' && proposalForApproval.cardInstallmentOptions && proposalForApproval.cardInstallmentOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 self-center">Opções da proposta:</span>
                      {proposalForApproval.cardInstallmentOptions.map((opt, idx) => {
                        const totalComJuros = proposalForApproval.sellPrice * (1 + (opt.interestPercent || 0) / 100);
                        const parcela = totalComJuros / (opt.installments || 1);
                        const schedule = opt.withEntry ? getInstallmentScheduleText(opt.installments, true) : '';
                        const text = `${opt.installments}x de R$ ${parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${schedule ? ` (${schedule})` : ''}${opt.interestPercent ? ` (${opt.interestPercent}% juros)` : ' (sem juros)'}`;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setApprovedInstallmentsDetails(text);
                              setApprovedValue(totalComJuros.toFixed(2));
                            }}
                            className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer"
                          >
                            {opt.installments}x {opt.withEntry ? '(Entrada)' : ''} {opt.interestPercent ? `(+${opt.interestPercent}%)` : '(s/ juros)'}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {approvedPaymentMethod === 'Entrada + Parcelas' && proposalForApproval.paymentDirectTerms && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 self-center">Condição da proposta:</span>
                      <button
                        type="button"
                        onClick={() => setApprovedInstallmentsDetails(proposalForApproval.paymentDirectTerms || '')}
                        className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer"
                      >
                        {proposalForApproval.paymentDirectTerms}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProposalForApproval(null)}
                className="flex-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-md hover:shadow-emerald-900/10 cursor-pointer text-center"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
