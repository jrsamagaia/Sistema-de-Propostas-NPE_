import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Clock, 
  Package, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  Kanban,
  Menu,
  X,
  BookOpen,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';

import { Cost, Rate, Supply, Process, Status, Proposal, Lead, IntegrationSetting, isApprovedStatusName } from './types';

// Import subcomponents
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import CustosFixos from './components/CustosFixos';
import Insumos from './components/Insumos';
import Tempos from './components/Tempos';
import Propostas from './components/Propostas';
import Configuracoes from './components/Configuracoes';
import CalculadoraLaudas from './components/CalculadoraLaudas';
import Leads from './components/Leads';

// --- GOOGLE FIREBASE DIRECT INTEGRATION ---
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

// --- DADOS INICIAIS BASEADOS NAS PLANILHAS ---
const initialFixedCosts: Cost[] = [
  { id: 1, description: 'Pró-labore Gisele', value: 2500 },
  { id: 2, description: 'Pró-labore Jeferson', value: 2500 },
  { id: 3, description: 'Celesc', value: 100 },
  { id: 4, description: 'Unifique', value: 60 },
  { id: 5, description: 'Vivo', value: 110 },
  { id: 6, description: 'Condomínio', value: 200 },
  { id: 7, description: 'Unimed', value: 380.95 },
  { id: 8, description: 'Contador', value: 440 },
  { id: 9, description: 'Conta Azul', value: 250 },
  { id: 10, description: 'Adapta', value: 99 },
  { id: 11, description: 'Selo Instagram', value: 53 },
];

const initialRates: Rate[] = [
  { id: 1, description: 'Impostos', percentage: 10 },
  { id: 2, description: 'Taxas de Cartão', percentage: 3.99 },
  { id: 3, description: 'Lucro', percentage: 30 },
];

const initialSupplies: Supply[] = [
  { id: 1, description: 'Diagramação texto e imagem', unit: 'lauda', cost: 6.97 },
  { id: 2, description: 'Revisão', unit: 'lauda', cost: 7.84 },
  { id: 3, description: 'DESIGN CAPA', unit: 'unidade', cost: 350.00 },
  { id: 4, description: 'Ficha catalográfica', unit: 'unidade', cost: 66.00 },
  { id: 5, description: 'Direitos Autorais', unit: 'unidade', cost: 25.00 },
  { id: 6, description: 'ISBN', unit: 'unidade', cost: 28.00 },
  { id: 7, description: 'CONSULTORIA INDIVIDUAL', unit: 'hora', cost: 52.29 },
  { id: 8, description: 'Livro 150 p pb 15x21 (boneco)', unit: 'unidade', cost: 84.16 },
  { id: 9, description: 'Publicação Amazon', unit: 'minuto', cost: 18.00 },
];

const initialProcesses: Process[] = [
  { id: 1, action: 'LIVRO INFANTIL', unit: 'lauda', time: 6 },
  { id: 2, action: 'LIVRO COM IMAGEM', unit: 'lauda', time: 5 },
  { id: 3, action: 'CRIAÇÃO DE CAPA', unit: 'hora', time: 1.5 },
  { id: 4, action: 'Publicação conteúdo EP', unit: 'minutos', time: 0.3 },
];

const initialStatuses: Status[] = [
  { id: 1, name: 'Em desenvolvimento', order: 1, color: 'blue-light' },
  { id: 2, name: 'Enviada para aprovação', order: 2, color: 'green-light' },
  { id: 3, name: 'Aprovada', order: 3, color: 'green-dark' },
  { id: 4, name: 'Contrato/Pedido Gráfica', order: 4, color: 'orange-dark' },
  { id: 5, name: 'Contato Futuro', order: 5, color: 'blue-dark' },
  { id: 6, name: 'Não aprovada', order: 6, color: 'red' }
];

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className={`w-full flex items-center ${
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-6 py-1.5'
      } text-sm transition-colors border-l-4 cursor-pointer text-left ${
        active 
          ? 'bg-slate-800 border-amber-500 text-white font-medium shadow-inner' 
          : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <span className="shrink-0 flex items-center justify-center">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('kanban'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPropostasMenuOpen, setIsPropostasMenuOpen] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Auto-collapse sidebar when Kanban Funil is active for maximal screen real estate
  useEffect(() => {
    if (activeTab === 'kanban') {
      setIsSidebarCollapsed(true);
    }
  }, [activeTab]);

  // Auto-expand menu when proposal tabs are active
  useEffect(() => {
    if (activeTab === 'propostas' || activeTab === 'propostas-aprovadas') {
      setIsPropostasMenuOpen(true);
    }
  }, [activeTab]);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [fixedCosts, setFixedCosts] = useState<Cost[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<IntegrationSetting[]>([]);
  const [proposalToEdit, setProposalToEdit] = useState<Proposal | 'new' | null>(null);

  const totalFixedCosts = fixedCosts.reduce((acc, curr) => acc + curr.value, 0);
  const totalRatesPercent = rates.reduce((acc, curr) => acc + curr.percentage, 0);
  const markupMultiplier = totalRatesPercent >= 100 ? 1 : 1 / (1 - (totalRatesPercent / 100));

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch data only after user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const loadFromFirestore = async (
      collectionName: string,
      setState: React.Dispatch<React.SetStateAction<any[]>>,
      initialData: any[] | null,
      sortFn?: (a: any, b: any) => number
    ) => {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        let data: any[] = [];
        const seenIds = new Set<string>();
        querySnapshot.forEach((docSnap) => {
          const docData = docSnap.data();
          const idKey = String(docData.id || docSnap.id);
          if (!seenIds.has(idKey)) {
            seenIds.add(idKey);
            data.push(docData);
          }
        });
        
        if (data.length === 0 && initialData) {
          for (const item of initialData) {
            await setDoc(doc(db, collectionName, String(item.id)), item);
          }
          data = [...initialData];
        }
        
        if (sortFn) data.sort(sortFn);
        setState(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, collectionName);
      }
    };

    const loadAllData = async () => {
      setIsLoading(true);
      setDbError(null);
      try {
        await Promise.race([
          Promise.all([
            loadFromFirestore('costs', setFixedCosts as React.Dispatch<React.SetStateAction<any[]>>, initialFixedCosts, (a, b) => a.id - b.id),
            loadFromFirestore('rates', setRates as React.Dispatch<React.SetStateAction<any[]>>, initialRates, (a, b) => a.id - b.id),
            loadFromFirestore('supplies', setSupplies as React.Dispatch<React.SetStateAction<any[]>>, initialSupplies, (a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)),
            loadFromFirestore('processes', setProcesses as React.Dispatch<React.SetStateAction<any[]>>, initialProcesses, (a, b) => a.id - b.id),
            loadFromFirestore('statuses', setStatuses as React.Dispatch<React.SetStateAction<any[]>>, initialStatuses, (a, b) => (a.order || a.id) - (b.order || b.id)),
            loadFromFirestore('proposals', setProposals as React.Dispatch<React.SetStateAction<any[]>>, null, (a, b) => b.id - a.id),
            loadFromFirestore('leads', setLeads as React.Dispatch<React.SetStateAction<any[]>>, null, (a, b) => b.id - a.id),
            loadFromFirestore('settings', setSettings as React.Dispatch<React.SetStateAction<any[]>>, null, (a, b) => a.id.localeCompare(b.id))
          ]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT_LIMIT: A conexão ao Firestore demorou mais de 12 segundos. Isso quase sempre indica que a base de dados (Cloud Firestore) não foi criada/inicializada no seu painel do Firebase Console para o projeto "orcamentos-editora-npe".')), 12000)
          )
        ]);
      } catch (err: any) {
        console.error("Erro ao carregar dados do Firestore:", err);
        let msg = "Não foi possível conectar ao banco de dados Firestore. ";
        if (err.message && err.message.startsWith('TIMEOUT_LIMIT:')) {
          msg = err.message.replace('TIMEOUT_LIMIT: ', '');
        } else {
          try {
            const parsed = JSON.parse(err.message);
            if (parsed && parsed.error) {
              msg += `Erro: ${parsed.error} (Operação: ${parsed.operationType} na coleção "${parsed.path}")`;
            } else {
              msg += err.message;
            }
          } catch (_) {
            msg += err.message || String(err);
          }
        }
        setDbError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [currentUser]);

  const saveToDb = async (collectionName: string, item: any) => {
    const updateState = (setState: React.Dispatch<React.SetStateAction<any[]>>, sortFn?: (a: any, b: any) => number) => {
      setState(prev => {
        const itemStrId = String(item.id);
        const exists = prev.some(p => String(p.id) === itemStrId);
        const newState = exists 
          ? prev.map(p => String(p.id) === itemStrId ? item : p) 
          : [...prev, item];
        const seen = new Set<string>();
        const unique = newState.filter(p => {
          const k = String(p.id);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        return sortFn ? unique.sort(sortFn) : unique;
      });
    };

    if (collectionName === 'costs') updateState(setFixedCosts as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => a.id - b.id);
    if (collectionName === 'rates') updateState(setRates as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => a.id - b.id);
    if (collectionName === 'supplies') updateState(setSupplies as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));
    if (collectionName === 'processes') updateState(setProcesses as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => a.id - b.id);
    if (collectionName === 'statuses') updateState(setStatuses as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => (a.order || a.id) - (b.order || b.id));
    if (collectionName === 'proposals') updateState(setProposals as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => b.id - a.id);
    if (collectionName === 'leads') updateState(setLeads as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => b.id - a.id);
    if (collectionName === 'settings') updateState(setSettings as React.Dispatch<React.SetStateAction<any[]>>, (a, b) => a.id.localeCompare(b.id));

    try {
      // Strips out undefined properties that cause Firestore setDoc to fail
      const cleanedItem = JSON.parse(JSON.stringify(item));
      await setDoc(doc(db, collectionName, String(item.id)), cleanedItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${item.id}`);
    }
  };

  const removeFromDb = async (collectionName: string, id: number | string) => {
    const removeState = (setState: React.Dispatch<React.SetStateAction<any[]>>) => {
      const idStr = String(id);
      setState(prev => prev.filter(p => String(p.id) !== idStr));
    };

    if (collectionName === 'costs') removeState(setFixedCosts as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'rates') removeState(setRates as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'supplies') removeState(setSupplies as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'processes') removeState(setProcesses as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'statuses') removeState(setStatuses as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'proposals') removeState(setProposals as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'leads') removeState(setLeads as React.Dispatch<React.SetStateAction<any[]>>);
    if (collectionName === 'settings') removeState(setSettings as React.Dispatch<React.SetStateAction<any[]>>);

    try {
      await deleteDoc(doc(db, collectionName, String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  const updateProposalStatus = async (id: number, newStatus: string, approvedValue?: number, approvedPaymentMethod?: string, approvedInstallmentsDetails?: string, approvedDate?: string) => {
    const prop = proposals.find(p => p.id === id);
    if (prop) {
      const isApproved = isApprovedStatusName(newStatus);
      const updatedProp = { 
        ...prop, 
        status: newStatus,
        approvedValue: isApproved ? (approvedValue !== undefined ? approvedValue : prop.approvedValue) : prop.approvedValue,
        approvedPaymentMethod: isApproved ? (approvedPaymentMethod !== undefined ? approvedPaymentMethod : prop.approvedPaymentMethod) : prop.approvedPaymentMethod,
        approvedInstallmentsDetails: isApproved ? (approvedInstallmentsDetails !== undefined ? approvedInstallmentsDetails : prop.approvedInstallmentsDetails) : prop.approvedInstallmentsDetails,
        approvedDate: isApproved 
          ? (approvedDate || prop.approvedDate || new Date().toLocaleDateString('pt-BR'))
          : undefined
      };
      await saveToDb('proposals', updatedProp);
    }
  };

  const updateStatusName = async (oldName: string, newName: string, statusObj: Status) => {
    await saveToDb('statuses', { ...statusObj, name: newName });
    if (oldName !== newName) {
      const propsToUpdate = proposals.filter(p => p.status === oldName);
      for (const p of propsToUpdate) {
        await saveToDb('proposals', { ...p, status: newName });
      }
    }
  };

  const reorderStatuses = async (newStatuses: Status[]) => {
    const orderedStatuses = newStatuses.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStatuses(orderedStatuses);
    try {
      await Promise.all(
        orderedStatuses.map(status => {
          const cleanedItem = JSON.parse(JSON.stringify(status));
          return setDoc(doc(db, 'statuses', String(status.id)), cleanedItem);
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'statuses');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 flex-col gap-4">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="text-slate-400 font-medium animate-pulse">Confirmando identidade segura...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 flex-col px-4 font-sans">
        <div className="w-full max-w-sm bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl mx-auto mb-5 shadow-lg">
            N
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-1">Editora NPE</h2>
          <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
            Sistema de Gestão de Propostas Comerciais, Orçamentos e Fluxo de Vendas (Kanban) integrado com o Google Firebase.
          </p>
          
          <button
            onClick={async () => {
              try {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
              } catch (err) {
                console.error("Erro ao autenticar com o Google:", err);
              }
            }}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2.5 px-4 rounded-xl shadow transition-all cursor-pointer text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.513 0-6.36-2.846-6.36-6.359s2.847-6.36 6.36-6.36c1.554 0 2.964.552 4.07 1.472l3.12-3.12C19.141 2.22 15.937 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.702 0 12.24-5.32 12.24-12.24 0-.814-.09-1.583-.242-2.315h-11.24z"
              />
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 flex-col gap-4">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="text-slate-600 font-medium animate-pulse">A conectar ao banco de dados pelo Google Firestore...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 flex-col px-4 font-sans">
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-red-500/30 shadow-2xl text-center">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-5">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-2">Conexão do Banco de Dados</h2>
          <p className="text-xs text-red-400 mb-6 bg-red-950/40 p-4 rounded-xl border border-red-900/30 max-h-36 overflow-y-auto break-words text-left font-mono">
            {dbError}
          </p>
          <div className="text-left text-xs text-slate-400 mb-6 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-300">Causas comuns deste erro:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>O novo projeto Firebase não tem o <strong>Cloud Firestore</strong> ativado no painel.</li>
              <li>As variáveis de ambiente no Vercel têm algum erro de digitação ou espaço em branco.</li>
              <li>A nova implantação no Vercel ainda não foi concluída para aplicar as chaves.</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setDbError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2 px-4 rounded-xl shadow transition-all cursor-pointer text-sm"
            >
              Tentar Novamente
            </button>
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  setDbError(null);
                } catch (err) {
                  console.error("Erro ao desconectar:", err);
                }
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl shadow transition-all cursor-pointer text-sm"
            >
              Desconectar / Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      
      {/* Sidebar - Matching ConnectFlow design style (Desktop only) */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex shrink-0 transition-all duration-300 ease-in-out`}>
        <div className={`p-3 border-b border-slate-800 flex-shrink-0 flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
              N
            </div>
            {!isSidebarCollapsed && (
              <span className="text-white font-semibold tracking-tight text-base truncate">Editora NPE</span>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral (apenas ícones)"}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-1.5 space-y-0.5 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="px-6 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Painel de Vendas</div>
          )}
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<Kanban size={18} />} label="Kanban (Funil)" active={activeTab === 'kanban'} onClick={() => setActiveTab('kanban')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<Users size={18} />} label="Contatos e Leads" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} collapsed={isSidebarCollapsed} />
          
          {!isSidebarCollapsed ? (
            <div className="px-6 py-1 pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parâmetros e Custos</div>
          ) : (
            <div className="my-1 border-t border-slate-800/80 mx-2"></div>
          )}
          <NavItem icon={<Calculator size={18} />} label="Custos Fixos e Taxas" active={activeTab === 'custos'} onClick={() => setActiveTab('custos')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<Package size={18} />} label="Insumos e Serviços" active={activeTab === 'insumos'} onClick={() => setActiveTab('insumos')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<Clock size={18} />} label="Tempos de Processo" active={activeTab === 'tempos'} onClick={() => setActiveTab('tempos')} collapsed={isSidebarCollapsed} />
          
          {!isSidebarCollapsed ? (
            <div className="px-6 py-1 pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operações</div>
          ) : (
            <div className="my-1 border-t border-slate-800/80 mx-2"></div>
          )}
          <NavItem icon={<BookOpen size={18} />} label="Calculadora de Laudas" active={activeTab === 'laudas'} onClick={() => setActiveTab('laudas')} collapsed={isSidebarCollapsed} />
          
          {/* Submenu de Orçamentos e Propostas */}
          {isSidebarCollapsed ? (
            <NavItem 
              icon={<FileText size={18} />} 
              label="Orçamentos & Propostas" 
              active={activeTab === 'propostas' || activeTab === 'propostas-aprovadas'} 
              onClick={() => setActiveTab('propostas')} 
              collapsed={true} 
            />
          ) : (
            <div className="space-y-0.5">
              <button 
                onClick={() => setIsPropostasMenuOpen(!isPropostasMenuOpen)}
                className={`w-full flex items-center justify-between px-6 py-1.5 text-sm transition-colors border-l-4 cursor-pointer text-left ${
                  (activeTab === 'propostas' || activeTab === 'propostas-aprovadas') 
                    ? 'bg-slate-800 border-amber-500 text-white font-medium' 
                    : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} />
                  <span>Orçamentos & Propostas</span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`transform transition-transform duration-200 text-slate-400 ${isPropostasMenuOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              {isPropostasMenuOpen && (
                <div className="pl-6 bg-slate-900/40 animate-fade-in flex flex-col space-y-0.5">
                  <button 
                    onClick={() => setActiveTab('propostas')}
                    className={`w-full flex items-center gap-3 py-1.5 px-6 text-xs transition-all border-l-2 cursor-pointer text-left ${
                      activeTab === 'propostas' 
                        ? 'border-amber-500 text-white font-semibold bg-slate-800/30' 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span>Propostas em Andamento</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('propostas-aprovadas')}
                    className={`w-full flex items-center gap-3 py-1.5 px-6 text-xs transition-all border-l-2 cursor-pointer text-left ${
                      activeTab === 'propostas-aprovadas' 
                        ? 'border-amber-500 text-white font-semibold bg-slate-800/30' 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Propostas Aprovadas</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <NavItem icon={<Settings size={18} />} label="Backup e Dados" active={activeTab === 'config'} onClick={() => setActiveTab('config')} collapsed={isSidebarCollapsed} />
        </nav>

        {/* User Profile & Logout at Bottom of Sidebar */}
        <div className={`p-2.5 mt-auto bg-slate-800/60 m-2 rounded-xl border border-slate-750/70 shrink-0 flex items-center ${isSidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between gap-2'}`}>
          <div className="flex items-center gap-2.5 min-w-0" title={currentUser?.displayName || currentUser?.email || ''}>
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || "User"} 
                className="w-7 h-7 rounded-full border border-slate-700 shrink-0 object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 border border-indigo-500/50 flex items-center justify-center font-bold text-white text-xs shrink-0">
                {(currentUser?.displayName || currentUser?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {currentUser?.displayName || currentUser?.email}
                </span>
                <span className="text-[10px] text-slate-400 truncate leading-tight">
                  Editora NPE
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => signOut(auth)}
            className={`text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-md font-bold tracking-wider transition-colors cursor-pointer shrink-0 uppercase flex items-center justify-center gap-1 ${isSidebarCollapsed ? 'p-1 text-xs' : 'text-[11px] px-2 py-1'}`}
            title="Sair do sistema"
          >
            <LogOut size={13} />
            {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Slide Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slide Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 md:hidden transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-white text-base shadow-sm">
              N
            </div>
            <span className="text-white font-semibold tracking-tight text-base">Editora NPE</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-full cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <div className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Painel de Vendas</div>
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'dashboard' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('kanban'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'kanban' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <Kanban size={18} />
            <span>Kanban (Funil)</span>
          </button>
          <button 
            onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'leads' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={18} />
            <span>Contatos e Leads</span>
          </button>
          
          <div className="px-6 py-2 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parâmetros e Custos</div>
          <button 
            onClick={() => { setActiveTab('custos'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'custos' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <Calculator size={18} />
            <span>Custos Fixos e Taxas</span>
          </button>
          <button 
            onClick={() => { setActiveTab('insumos'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'insumos' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <Package size={18} />
            <span>Insumos e Serviços</span>
          </button>
          <button 
            onClick={() => { setActiveTab('tempos'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'tempos' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <Clock size={18} />
            <span>Tempos de Processo</span>
          </button>
          
          <div className="px-6 py-2 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operações</div>
          <button 
            onClick={() => { setActiveTab('laudas'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'laudas' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <BookOpen size={18} />
            <span>Calculadora de Laudas</span>
          </button>
          {/* Submenu de Orçamentos e Propostas (Mobile) */}
          <div className="space-y-0.5">
            <button 
              onClick={() => setIsPropostasMenuOpen(!isPropostasMenuOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${
                (activeTab === 'propostas' || activeTab === 'propostas-aprovadas') 
                  ? 'bg-slate-800 border-amber-500 text-white font-medium' 
                  : 'border-transparent text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <span>Orçamentos & Propostas</span>
              </div>
              <ChevronDown 
                size={14} 
                className={`transform transition-transform duration-200 text-slate-400 ${isPropostasMenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            {isPropostasMenuOpen && (
              <div className="pl-6 bg-slate-950/20 flex flex-col space-y-0.5">
                <button 
                  onClick={() => { setActiveTab('propostas'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2 px-6 text-xs transition-all border-l-2 cursor-pointer text-left ${
                    activeTab === 'propostas' 
                      ? 'border-amber-500 text-white font-semibold bg-slate-800/30' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span>Propostas em Andamento</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('propostas-aprovadas'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2 px-6 text-xs transition-all border-l-2 cursor-pointer text-left ${
                    activeTab === 'propostas-aprovadas' 
                      ? 'border-amber-500 text-white font-semibold bg-slate-800/30' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Propostas Aprovadas</span>
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => { setActiveTab('config'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-4 cursor-pointer text-left ${activeTab === 'config' ? 'bg-slate-800 border-amber-500 text-white font-medium' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={18} />
            <span>Backup e Dados</span>
          </button>
        </nav>

        {/* User Profile & Logout at Bottom of Mobile Sidebar */}
        <div className="p-3 bg-slate-800/60 m-3 rounded-xl border border-slate-750/70 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || "User"} 
                className="w-8 h-8 rounded-full border border-slate-700 shrink-0 object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-500/50 flex items-center justify-center font-bold text-white text-xs shrink-0">
                {(currentUser?.displayName || currentUser?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {currentUser?.displayName || currentUser?.email}
              </span>
              <span className="text-[10px] text-slate-400 truncate leading-tight">
                Editora NPE
              </span>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 py-1 rounded-md font-bold tracking-wider transition-colors cursor-pointer shrink-0 uppercase flex items-center gap-1"
          >
            <LogOut size={13} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header - Compact, High-Efficiency Navigation */}
        <header className="h-12 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-4 shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center border border-slate-200 shadow-2xs"
              title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {isSidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
            <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'kanban' && 'Painel de Negócios (Funil)'}
              {activeTab === 'leads' && 'Contatos e Leads'}
              {activeTab === 'custos' && 'Despesas & Precificação'}
              {activeTab === 'insumos' && 'Catálogo Geral de Insumos'}
              {activeTab === 'tempos' && 'Tempo de Processos'}
              {activeTab === 'laudas' && 'Calculadora de Laudas'}
              {activeTab === 'propostas' && 'Propostas em Andamento'}
              {activeTab === 'propostas-aprovadas' && 'Propostas Aprovadas'}
              {activeTab === 'config' && 'Backup e Dados'}
            </h1>
          </div>
          
          <button
            onClick={() => {
              setProposalToEdit('new');
              setActiveTab('propostas');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Nova Proposta</span>
          </button>
        </header>

        {/* Mobile menu header */}
        <header className="md:hidden bg-slate-900 text-white px-3.5 py-2.5 flex justify-between items-center shadow-md shrink-0 z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xs font-bold text-white truncate max-w-[150px]">
              {activeTab === 'kanban' ? 'Painel (Funil)' : 'Editora NPE'}
            </h1>
          </div>

          <button
            onClick={() => {
              setProposalToEdit('new');
              setActiveTab('propostas');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus size={13} />
            <span>Nova</span>
          </button>
        </header>

        {/* Main Content Pane */}
        <div className="flex-1 overflow-auto p-3.5 md:p-5 bg-slate-50/50">
          
          {notification && (
            <div className="fixed top-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce z-50 font-semibold border border-emerald-500">
              <CheckCircle size={18} />
              {notification}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard 
              proposals={proposals}
              goToProposals={() => {
                setProposalToEdit('new');
                setActiveTab('propostas');
              }}
              totalRatesPercent={totalRatesPercent}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard 
              proposals={proposals}
              statuses={statuses}
              updateProposalStatus={updateProposalStatus}
              saveStatus={(s) => saveToDb('statuses', s)}
              removeStatus={(id) => removeFromDb('statuses', id)}
              updateStatusName={updateStatusName}
              onReorderStatuses={reorderStatuses}
              goToNewProposal={() => {
                setProposalToEdit('new');
                setActiveTab('propostas');
              }}
              onEditProposal={(prop) => {
                setProposalToEdit(prop);
                setActiveTab('propostas');
              }}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'custos' && (
            <CustosFixos 
              costs={fixedCosts} 
              rates={rates} 
              saveCost={(c) => saveToDb('costs', c)}
              removeCost={(id) => removeFromDb('costs', id)}
              saveRate={(r) => saveToDb('rates', r)}
              removeRate={(id) => removeFromDb('rates', id)}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'insumos' && (
            <Insumos 
              supplies={supplies} 
              saveSupply={(s) => saveToDb('supplies', s)}
              removeSupply={(id) => removeFromDb('supplies', id)}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'tempos' && (
            <Tempos 
              processes={processes} 
              saveProcess={(p) => saveToDb('processes', p)}
              removeProcess={(id) => removeFromDb('processes', id)}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'laudas' && (
            <CalculadoraLaudas />
          )}

          {(activeTab === 'propostas' || activeTab === 'propostas-aprovadas') && (
            <Propostas 
              supplies={supplies} 
              rates={rates}
              markupMultiplier={markupMultiplier}
              proposals={proposals}
              statuses={statuses}
              settings={settings}
              leads={leads}
              saveProposal={(p) => saveToDb('proposals', p)}
              removeProposal={(id) => removeFromDb('proposals', id)}
              showNotification={showNotification}
              proposalToEdit={proposalToEdit}
              onClearProposalToEdit={() => setProposalToEdit(null)}
              showOnlyApproved={activeTab === 'propostas-aprovadas'}
            />
          )}

          {activeTab === 'leads' && (
            <Leads 
              leads={leads}
              saveLead={(lead) => saveToDb('leads', lead)}
              removeLead={(id) => removeFromDb('leads', id)}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'config' && (
            <Configuracoes 
              data={{ fixedCosts, rates, supplies, processes, statuses, proposals }}
              settings={settings}
              saveToDb={saveToDb}
              showNotification={showNotification}
            />
          )}

        </div>

        {/* Bottom Navigation Bar - Mobile Only */}
        <nav className="md:hidden bg-slate-900 border-t border-slate-800 flex items-center justify-around py-2 z-30 shrink-0 text-slate-400">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-semibold">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('kanban')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${activeTab === 'kanban' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Kanban size={20} />
            <span className="text-[10px] font-semibold">Kanban</span>
          </button>
          <button 
            onClick={() => setActiveTab('propostas')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-colors ${activeTab === 'propostas' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <FileText size={20} />
            <span className="text-[10px] font-semibold">Propostas</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer text-slate-400 hover:text-white"
          >
            <Menu size={20} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
