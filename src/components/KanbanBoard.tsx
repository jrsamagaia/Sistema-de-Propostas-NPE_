import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  CheckCircle, 
  X, 
  Pencil, 
  Trash2, 
  GripVertical, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Palette,
  Check
} from 'lucide-react';
import { Proposal, Status, getInstallmentScheduleText, isApprovedStatusName } from '../types';
import AutocompleteSelect from './AutocompleteSelect';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface StatusColorOption {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  headerBorder: string;
  badgeBg: string;
  badgeText: string;
  columnBg: string;
  columnBorder: string;
  topBarBg: string;
  summaryBg: string;
  summaryText: string;
  swatchBg: string;
}

export const STATUS_COLOR_OPTIONS: Record<string, StatusColorOption> = {
  'blue-light': {
    id: 'blue-light',
    name: 'Azul Claro',
    headerBg: 'bg-sky-500 text-white border-sky-600',
    headerText: 'text-white',
    headerBorder: 'border-sky-600',
    badgeBg: 'bg-sky-100 text-sky-950 border border-sky-300 font-bold',
    badgeText: 'text-sky-950 font-bold',
    columnBg: 'bg-sky-50/70',
    columnBorder: 'border-sky-300',
    topBarBg: 'bg-sky-500',
    summaryBg: 'bg-sky-100 text-sky-950 border-sky-200',
    summaryText: 'text-sky-950',
    swatchBg: 'bg-sky-400'
  },
  'green-light': {
    id: 'green-light',
    name: 'Verde Claro',
    headerBg: 'bg-emerald-500 text-white border-emerald-600',
    headerText: 'text-white',
    headerBorder: 'border-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold',
    badgeText: 'text-emerald-950 font-bold',
    columnBg: 'bg-emerald-50/70',
    columnBorder: 'border-emerald-300',
    topBarBg: 'bg-emerald-500',
    summaryBg: 'bg-emerald-100 text-emerald-950 border-emerald-200',
    summaryText: 'text-emerald-950',
    swatchBg: 'bg-emerald-400'
  },
  'green-dark': {
    id: 'green-dark',
    name: 'Verde Escuro',
    headerBg: 'bg-emerald-800 text-white border-emerald-900',
    headerText: 'text-white',
    headerBorder: 'border-emerald-900',
    badgeBg: 'bg-emerald-950 text-white border border-emerald-700 font-bold',
    badgeText: 'text-white font-bold',
    columnBg: 'bg-emerald-50/40',
    columnBorder: 'border-emerald-600/40',
    topBarBg: 'bg-emerald-800',
    summaryBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    summaryText: 'text-emerald-950',
    swatchBg: 'bg-emerald-800'
  },
  'orange-dark': {
    id: 'orange-dark',
    name: 'Laranja Escuro',
    headerBg: 'bg-orange-600 text-white border-orange-700',
    headerText: 'text-white',
    headerBorder: 'border-orange-700',
    badgeBg: 'bg-orange-950 text-white border border-orange-600 font-bold',
    badgeText: 'text-white font-bold',
    columnBg: 'bg-orange-50/70',
    columnBorder: 'border-orange-300',
    topBarBg: 'bg-orange-600',
    summaryBg: 'bg-orange-100 text-orange-950 border-orange-200',
    summaryText: 'text-orange-950',
    swatchBg: 'bg-orange-600'
  },
  'blue-dark': {
    id: 'blue-dark',
    name: 'Azul Escuro',
    headerBg: 'bg-blue-900 text-white border-blue-950',
    headerText: 'text-white',
    headerBorder: 'border-blue-950',
    badgeBg: 'bg-blue-950 text-white border border-blue-800 font-bold',
    badgeText: 'text-white font-bold',
    columnBg: 'bg-blue-50/60',
    columnBorder: 'border-blue-300',
    topBarBg: 'bg-blue-900',
    summaryBg: 'bg-blue-100 text-blue-950 border-blue-200',
    summaryText: 'text-blue-950',
    swatchBg: 'bg-blue-900'
  },
  'red': {
    id: 'red',
    name: 'Vermelho',
    headerBg: 'bg-rose-600 text-white border-rose-700',
    headerText: 'text-white',
    headerBorder: 'border-rose-700',
    badgeBg: 'bg-rose-950 text-white border border-rose-600 font-bold',
    badgeText: 'text-white font-bold',
    columnBg: 'bg-rose-50/70',
    columnBorder: 'border-rose-300',
    topBarBg: 'bg-rose-600',
    summaryBg: 'bg-rose-100 text-rose-950 border-rose-200',
    summaryText: 'text-rose-950',
    swatchBg: 'bg-rose-600'
  },
  'purple': {
    id: 'purple',
    name: 'Roxo / Púrpura',
    headerBg: 'bg-purple-700 text-white border-purple-800',
    headerText: 'text-white',
    headerBorder: 'border-purple-800',
    badgeBg: 'bg-purple-950 text-white border border-purple-600 font-bold',
    badgeText: 'text-white font-bold',
    columnBg: 'bg-purple-50/60',
    columnBorder: 'border-purple-300',
    topBarBg: 'bg-purple-700',
    summaryBg: 'bg-purple-100 text-purple-950 border-purple-200',
    summaryText: 'text-purple-950',
    swatchBg: 'bg-purple-700'
  },
  'amber': {
    id: 'amber',
    name: 'Amarelo / Dourado',
    headerBg: 'bg-amber-400 text-amber-950 border-amber-500',
    headerText: 'text-amber-950',
    headerBorder: 'border-amber-500',
    badgeBg: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
    badgeText: 'text-amber-950 font-bold',
    columnBg: 'bg-amber-50/60',
    columnBorder: 'border-amber-300',
    topBarBg: 'bg-amber-400',
    summaryBg: 'bg-amber-100 text-amber-950 border-amber-300',
    summaryText: 'text-amber-950',
    swatchBg: 'bg-amber-400'
  }
};

export const getStatusColorTheme = (status: Status): StatusColorOption => {
  if (status.color && STATUS_COLOR_OPTIONS[status.color]) {
    return STATUS_COLOR_OPTIONS[status.color];
  }
  const name = (status.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  if (name.includes('desenvolvimento') || name.includes('inicio') || name.includes('criacao') || name.includes('rascunho')) {
    return STATUS_COLOR_OPTIONS['blue-light'];
  }
  // Check negatives/losses FIRST so "Não aprovada" is NEVER mistaken for approved
  if (name.includes('nao') || name.includes('recusad') || name.includes('reprovad') || name.includes('cancelad') || name.includes('perdid')) {
    return STATUS_COLOR_OPTIONS['red'];
  }
  if (name.includes('enviad') || name.includes('aprovacao')) {
    return STATUS_COLOR_OPTIONS['green-light'];
  }
  if (name.includes('aprovad') || name.includes('ganh') || name.includes('fechad')) {
    return STATUS_COLOR_OPTIONS['green-dark'];
  }
  if (name.includes('contrato') || name.includes('grafica') || name.includes('pedido') || name.includes('producao')) {
    return STATUS_COLOR_OPTIONS['orange-dark'];
  }
  if (name.includes('futuro') || name.includes('contato') || name.includes('standby') || name.includes('espera')) {
    return STATUS_COLOR_OPTIONS['blue-dark'];
  }
  return STATUS_COLOR_OPTIONS['blue-light'];
};

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
  const isApproved = isApprovedStatusName(prop.status);
  if (isApproved) {
    if (prop.approvedDate) {
      const parsedApproved = parseProposalDate(prop.approvedDate);
      if (parsedApproved) return parsedApproved;
    }
    return parseProposalDate(prop.date);
  }

  // Para propostas não aprovadas: filtrar pela Validade da Proposta
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
  const [newStatusColor, setNewStatusColor] = useState<string>('blue-light');

  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusName, setEditingStatusName] = useState('');
  const [editingStatusColor, setEditingStatusColor] = useState<string>('blue-light');

  // Filtering states - default to current month and year
  const [filterMonth, setFilterMonth] = useState<string>(() => new Date().getMonth().toString()); // 'all' | '0'..'11'
  const [filterYear, setFilterYear] = useState<string>(() => new Date().getFullYear().toString()); // 'all' | '2026'..
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Approval Modal States - STRICTLY only opened when moving to an approved status!
  const [proposalForApproval, setProposalForApproval] = useState<Proposal | null>(null);
  const [approvedValue, setApprovedValue] = useState<string>('');
  const [approvedPaymentMethod, setApprovedPaymentMethod] = useState<string>('Pix');
  const [approvedInstallmentsDetails, setApprovedInstallmentsDetails] = useState<string>('');
  const [approvedDate, setApprovedDate] = useState<string>('');
  const [targetStatusForApproval, setTargetStatusForApproval] = useState<string>('');

  const handleConfirmApproval = () => {
    if (!proposalForApproval) return;
    const numericValue = parseFloat(approvedValue) || proposalForApproval.sellPrice;
    
    const isInstallmentsMethod = 
      approvedPaymentMethod === 'Cartão de Crédito Parcelado' || 
      approvedPaymentMethod === 'Entrada + Parcelas' ||
      approvedPaymentMethod === 'Pix parcelado';
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
    // Don't drag column if interacting with interactive controls
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
          // ONLY trigger approval modal if the target status is genuinely APPROVED
          // NEVER trigger for "Não aprovada" or other stages!
          if (prop && isApprovedStatusName(targetStatusName)) {
            setProposalForApproval(prop);
            setApprovedValue((prop.approvedValue !== undefined ? prop.approvedValue : prop.sellPrice).toString());
            setApprovedPaymentMethod(prop.approvedPaymentMethod || 'Pix');
            setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
            setApprovedDate(formatToISO(prop.approvedDate));
            setTargetStatusForApproval(targetStatusName);
          } else {
            updateProposalStatus(propId, targetStatusName);
            showNotification(`Proposta movida para "${targetStatusName}".`);
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
        if (prop && isApprovedStatusName(targetStatusName)) {
          setProposalForApproval(prop);
          setApprovedValue((prop.approvedValue !== undefined ? prop.approvedValue : prop.sellPrice).toString());
          setApprovedPaymentMethod(prop.approvedPaymentMethod || 'Pix');
          setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
          setApprovedDate(formatToISO(prop.approvedDate));
          setTargetStatusForApproval(targetStatusName);
        } else {
          updateProposalStatus(propId, targetStatusName);
          showNotification(`Proposta movida para "${targetStatusName}".`);
        }
      }
    } catch (err) {
      console.error("Erro no drop:", err);
    }
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    const newOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.order || 0)) + 1 : 1;
    const newStatus: Status = {
      id: Date.now(),
      name: newStatusName.trim(),
      order: newOrder,
      color: newStatusColor
    };
    saveStatus(newStatus);
    setNewStatusName('');
    setNewStatusColor('blue-light');
    setIsAddingStatus(false);
    showNotification(`Nova raia "${newStatus.name}" adicionada com sucesso.`);
  };

  const handleStartEditStatus = (status: Status) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
    setEditingStatusColor(status.color || 'blue-light');
  };

  const handleSaveEditStatus = async (status: Status) => {
    if (!editingStatusName.trim()) return;
    const updatedStatus: Status = {
      ...status,
      name: editingStatusName.trim(),
      color: editingStatusColor
    };
    await updateStatusName(status.name, editingStatusName.trim(), updatedStatus);
    setEditingStatusId(null);
    showNotification(`Raia "${editingStatusName.trim()}" atualizada.`);
  };

  const handleDeleteStatus = (status: Status) => {
    const count = proposals.filter(p => p.status === status.name).length;
    if (count > 0) {
      if (!window.confirm(`Atenção: Existem ${count} propostas nesta etapa. Deseja realmente excluir esta coluna?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Excluir a etapa "${status.name}"?`)) {
        return;
      }
    }
    removeStatus(status.id);
    showNotification(`Etapa "${status.name}" removida.`);
  };

  // Available Years from proposals
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(new Date().getFullYear());
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
      const isApproved = isApprovedStatusName(curr.status);
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

  return (
    <div className="h-full flex flex-col space-y-2 animate-fade-in w-full">
      {/* Month Navigator & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 font-sans">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Period Navigator */}
          <div className="inline-flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-2 py-1 hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-r border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              title="Mês anterior"
            >
              <ChevronLeft size={14} />
            </button>
            
            <div className="relative flex items-center px-2 py-1 hover:bg-slate-50 cursor-pointer transition-colors group">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 whitespace-nowrap min-w-[120px] justify-center select-none">
                {filterMonth === 'all' 
                  ? 'Todos os Períodos'
                  : `${MONTH_NAMES[parseInt(filterMonth, 10)]} de ${filterYear === 'all' ? new Date().getFullYear() : filterYear}`}
                <ChevronDown size={11} className="text-slate-400 group-hover:text-slate-600 ml-1" />
              </span>
              
              <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-40 w-48 animate-fade-in text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMonth('all')}
                  className={`text-left px-2.5 py-1.5 rounded-md font-semibold ${filterMonth === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Todos os meses
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {MONTH_NAMES.map((mName, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFilterMonth(idx.toString())}
                      className={`text-left px-2 py-1 rounded text-[11px] truncate ${filterMonth === idx.toString() ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {mName.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="px-2 py-1 hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-l border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              title="Próximo mês"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Year Filter Dropdown */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="all">Todos os Anos</option>
            {availableYears.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>

          {/* Quick Filter Reset */}
          {(filterMonth !== 'all' || filterYear !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterMonth('all');
                setFilterYear('all');
                setSearchQuery('');
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}

          {/* Search Box */}
          <div className="relative min-w-[150px] max-w-xs flex-1">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={12} />
            </span>
            <input
              type="text"
              placeholder="Buscar no funil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg pl-7 pr-6 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Results Summary & Quick Add Raia */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 self-end md:self-center">
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
            {filteredProposals.length} {filteredProposals.length === 1 ? 'proposta' : 'propostas'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-800 font-mono text-xs">
            Total: R$ {totalFilteredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <button
            onClick={() => setIsAddingStatus(true)}
            className="ml-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Criar nova raia/etapa no funil"
          >
            <Plus size={13} />
            <span>Nova Raia</span>
          </button>
        </div>
      </div>

      {/* Main Kanban Columns Container - Optimized for Full Visibility Across All Screens */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-1 w-full">
        <div className="flex h-full gap-2.5 w-full min-w-0">
          {statuses.map((status, index) => {
            const propsInStatus = filteredProposals.filter(p => p.status === status.name);
            const totalValueInStatus = propsInStatus.reduce((acc, curr) => {
              const isApproved = isApprovedStatusName(curr.status);
              const val = (isApproved && curr.approvedValue !== undefined) ? curr.approvedValue : curr.sellPrice;
              return acc + val;
            }, 0);

            const theme = getStatusColorTheme(status);

            // Conditional styling for Drag & Drop highlights
            const isHovered = hoveredIndex === index;
            const isCurrentlyDragged = draggedType === 'column' && draggedIndex === index;
            
            let colBorderClass = theme.columnBorder;
            let colBgClass = theme.columnBg;
            
            if (draggedType === 'proposal' && isHovered) {
              colBorderClass = "border-indigo-500 ring-2 ring-indigo-300 shadow-md";
              colBgClass = "bg-indigo-50/70";
            } else if (draggedType === 'column' && isHovered && draggedIndex !== index) {
              colBorderClass = "border-indigo-600 border-dashed border-2 ring-2 ring-indigo-200 scale-[1.01]";
              colBgClass = "bg-indigo-50/60";
            } else if (isCurrentlyDragged) {
              colBorderClass = "border-slate-300 opacity-40";
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
                className={`flex flex-col flex-1 min-w-[195px] md:min-w-[210px] lg:min-w-[220px] max-w-[320px] shrink-0 lg:shrink rounded-xl border transition-all duration-150 shadow-2xs ${colBorderClass} ${colBgClass}`}
              >
                {/* Column Header with Distinct Background Color and Controls */}
                <div className={`p-1.5 px-2 border-b rounded-t-xl flex justify-between items-center ${theme.headerBg} ${theme.headerBorder}`}>
                  {editingStatusId === status.id ? (
                    <div className="flex flex-col gap-1.5 w-full p-2 bg-white rounded-lg shadow-lg border border-slate-200 text-slate-800 animate-fade-in z-30">
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={editingStatusName}
                          onChange={(e) => setEditingStatusName(e.target.value)}
                          placeholder="Nome da etapa"
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSaveEditStatus(status)} 
                          className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Salvar alterações"
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button 
                          onClick={() => setEditingStatusId(null)} 
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Color swatch selector for column */}
                      <div className="pt-1 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cor da Raia:</span>
                        <div className="grid grid-cols-4 gap-1">
                          {Object.values(STATUS_COLOR_OPTIONS).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEditingStatusColor(opt.id)}
                              className={`flex items-center justify-center p-1 rounded border text-center transition-all cursor-pointer ${
                                editingStatusColor === opt.id ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 font-bold' : 'border-slate-200 bg-white'
                              }`}
                              title={opt.name}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full ${opt.swatchBg} border inline-block`}></span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span 
                          className="text-white/70 hover:text-white cursor-grab active:cursor-grabbing shrink-0 p-0.5 rounded transition-colors"
                          title="Arraste para reordenar esta coluna"
                        >
                          <GripVertical size={12} />
                        </span>
                        <h3 className={`font-bold text-[10px] md:text-[11px] uppercase tracking-wider truncate ${theme.headerText}`} title={status.name}>
                          {status.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex gap-0.5 opacity-80 hover:opacity-100">
                          <button 
                            onClick={() => handleStartEditStatus(status)} 
                            className="p-0.5 rounded hover:bg-black/15 transition-colors cursor-pointer" 
                            title="Editar nome e cor da raia"
                          >
                            <Pencil size={11} className={theme.headerText} />
                          </button>
                          <button 
                            onClick={() => handleDeleteStatus(status)} 
                            className="p-0.5 rounded hover:bg-black/15 transition-colors cursor-pointer" 
                            title="Excluir coluna"
                          >
                            <Trash2 size={11} className={theme.headerText} />
                          </button>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                          {propsInStatus.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Column Subheader with Estimated Total */}
                <div className={`px-2 py-0.5 border-b text-[9px] font-bold flex justify-between items-center ${theme.summaryBg}`}>
                  <span className="opacity-75 uppercase tracking-wider text-[8.5px]">Total:</span>
                  <span className="font-mono font-bold">R$ {totalValueInStatus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Proposals Card Container */}
                <div className="flex-1 p-1.5 overflow-y-auto flex flex-col gap-1.5 min-h-[120px]">
                  {propsInStatus.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-[10px] border border-dashed border-slate-300/70 rounded-lg p-2 text-center bg-white/30">
                      Nenhuma proposta
                    </div>
                  ) : (
                    propsInStatus.map((prop, pIdx) => {
                      const isApproved = isApprovedStatusName(prop.status);

                      return (
                        <div 
                          key={`${prop.id}_${pIdx}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, prop.id)}
                          onDragEnd={handleDragEnd}
                          className="proposal-card bg-white p-2 rounded-lg shadow-2xs border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group relative font-sans"
                        >
                          <div className="text-[8.5px] font-bold text-slate-400 mb-0.5 flex items-center justify-between pr-4">
                            <span>#{prop.id.toString().slice(-5)}</span>
                            <span className="truncate max-w-[90px]" title={isApproved ? `Aprovada: ${prop.approvedDate || prop.date}` : `Criada: ${prop.date}${prop.validityDate ? ` | Validade: ${prop.validityDate}` : ''}`}>
                              {isApproved && prop.approvedDate
                                ? `Aprov: ${prop.approvedDate}`
                                : (prop.validityDate ? `Val: ${prop.validityDate}` : prop.date)}
                            </span>
                          </div>

                          {prop.clientName && (
                            <div className="text-[10.5px] font-bold text-indigo-900 truncate leading-tight mb-0.5">
                              {prop.clientName}
                            </div>
                          )}

                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditProposal(prop);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-slate-50 border border-slate-200 rounded text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Editar proposta"
                          >
                            <Pencil size={9} />
                          </button>

                          <h4 className="font-semibold text-slate-700 leading-tight my-0.5 pr-3 text-[11px] line-clamp-2" title={prop.name}>
                            {prop.name}
                          </h4>
                          
                          {isApproved && prop.approvedPaymentMethod && (
                            <div className="mb-1 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 text-[9px] text-emerald-900 space-y-0.2">
                              <div className="flex justify-between items-center">
                                <span className="truncate">Pgto: <strong>{prop.approvedPaymentMethod}</strong></span>
                                {prop.approvedValue !== undefined && (
                                  <span className="font-bold font-mono text-emerald-800 shrink-0 ml-1">
                                    R$ {prop.approvedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                              {prop.approvedInstallmentsDetails && (
                                <div className="text-[8.5px] text-emerald-700 italic border-t border-emerald-200/60 pt-0.2 line-clamp-1">
                                  {prop.approvedInstallmentsDetails}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-100">
                            <span className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.2 rounded font-medium">
                              {prop.items.length} {prop.items.length === 1 ? 'item' : 'itens'}
                            </span>
                            <span className="font-bold text-emerald-600 text-[11px] font-mono">
                              R$ {prop.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Mobile Quick Status Changer */}
                          <div className="mt-1.5 pt-1 border-t border-dashed border-slate-100 flex items-center justify-between gap-1 md:hidden">
                            <span className="text-[8.5px] uppercase font-bold text-slate-400">Etapa:</span>
                            <select 
                              value={prop.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (isApprovedStatusName(newStatus)) {
                                  setProposalForApproval(prop);
                                  setApprovedValue((prop.approvedValue !== undefined ? prop.approvedValue : prop.sellPrice).toString());
                                  setApprovedPaymentMethod(prop.approvedPaymentMethod || 'Pix');
                                  setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
                                  setApprovedDate(formatToISO(prop.approvedDate));
                                  setTargetStatusForApproval(newStatus);
                                } else {
                                  updateProposalStatus(prop.id, newStatus);
                                  showNotification(`Proposta movida para "${newStatus}".`);
                                }
                              }}
                              className="bg-slate-50 border border-slate-200 rounded text-[9.5px] py-0.5 px-1 font-bold text-slate-700 max-w-[120px] focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                              {statuses.map(st => (
                                <option key={st.id} value={st.name}>{st.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* Compact Add New Status Column Box */}
          <div className="flex flex-col min-w-[140px] max-w-[200px] shrink-0 pt-0.5">
            {isAddingStatus ? (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-md flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Plus size={13} className="text-indigo-600" />
                    Nova Raia
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingStatus(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nome da Etapa:</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Em Negociação..."
                    autoFocus
                    value={newStatusName}
                    onChange={e => setNewStatusName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 flex items-center gap-1">
                    <Palette size={11} className="text-slate-400" />
                    Cor da Raia:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {Object.values(STATUS_COLOR_OPTIONS).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewStatusColor(opt.id)}
                        className={`flex flex-col items-center justify-center p-1 rounded border text-center transition-all cursor-pointer ${
                          newStatusColor === opt.id 
                            ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 font-bold' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        title={opt.name}
                      >
                        <span className={`w-3 h-3 rounded-full ${opt.swatchBg} border mb-0.5`}></span>
                        <span className="text-[8px] text-slate-700 truncate w-full leading-none">{opt.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1 border-t border-slate-100">
                  <button 
                    onClick={handleAddStatus} 
                    className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex-1 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={() => setIsAddingStatus(false)} 
                    className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold flex-1 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingStatus(true)}
                className="h-[44px] border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-700 transition-all gap-1.5 text-xs font-bold cursor-pointer shadow-2xs"
              >
                <Plus size={14} /> + Raia
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Approval Details Modal - STRICTLY ONLY for Approved proposals */}
      {proposalForApproval && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" id="approval-modal-wrapper">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-fade-in text-slate-800 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
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

              {(approvedPaymentMethod === 'Cartão de Crédito Parcelado' || approvedPaymentMethod === 'Entrada + Parcelas' || approvedPaymentMethod === 'Pix parcelado') && (
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
