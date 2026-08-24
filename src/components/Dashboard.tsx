import React from 'react';
import { 
  BookOpen, 
  Calculator, 
  Plus, 
  Clock, 
  FileCheck, 
  XOctagon, 
  FileStack
} from 'lucide-react';
import { Proposal } from '../types';
import { ceil2, formatMoney } from '../utils/math';

interface DashboardProps {
  proposals: Proposal[];
  goToProposals: () => void;
  totalRatesPercent: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  badgeColor?: string;
  countLabel: string;
}

function StatCard({ icon, title, value, subtitle, badgeColor = "text-indigo-600 bg-indigo-50/50 border-indigo-200/60", countLabel }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{title}</p>
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${badgeColor} border`}>
          {countLabel}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">{subtitle}</span>
      </div>
    </div>
  );
}

export default function Dashboard({
  proposals = [],
  goToProposals,
  totalRatesPercent,
}: DashboardProps) {
  // Filters and metrics
  // 1. Em desenvolvimento
  const devProposals = proposals.filter(p => {
    const statusName = (p.status || '').toLowerCase();
    return statusName.includes('desenvolvimento') || statusName.includes('novo') || statusName.includes('iníci');
  });
  const devCount = devProposals.length;
  const devValue = ceil2(devProposals.reduce((sum, p) => sum + (p.sellPrice || 0), 0));

  // 2. Em Aprovação
  const aprProposals = proposals.filter(p => {
    const statusName = (p.status || '').toLowerCase();
    return statusName.includes('aprovação') || statusName.includes('enviad') || statusName.includes('análise');
  });
  const aprCount = aprProposals.length;
  const aprValue = ceil2(aprProposals.reduce((sum, p) => sum + (p.sellPrice || 0), 0));

  // 3. Não Aprovadas
  const naProposals = proposals.filter(p => {
    const statusName = (p.status || '').toLowerCase();
    return statusName.includes('não') || statusName.includes('cancelad') || statusName.includes('perdid') || statusName.includes('recusad');
  });
  const naCount = naProposals.length;
  const naValue = ceil2(naProposals.reduce((sum, p) => sum + (p.sellPrice || 0), 0));

  // 4. Totais (Aprovadas apenas)
  const approvedProposals = proposals.filter(p => {
    const statusName = (p.status || '').toLowerCase();
    return statusName.includes('aprovad') && !statusName.includes('não');
  });
  const approvedCount = approvedProposals.length;
  const approvedValue = ceil2(approvedProposals.reduce((sum, p) => sum + (p.approvedValue !== undefined ? p.approvedValue : p.sellPrice || 0), 0));

  const formatBRL = (val: number) => {
    return formatMoney(val);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Painel de Indicadores</h2>
          <p className="text-xs text-slate-500 font-medium">Métricas consolidadas de operação da Editora NPE.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Clock size={18} className="text-amber-500" />} 
          title="Em desenvolvimento" 
          value={formatBRL(devValue)} 
          countLabel={`${devCount} ${devCount === 1 ? 'PROPOSTA' : 'PROPOSTAS'}`}
          subtitle="Em criação ou ajustes"
          badgeColor="text-amber-600 bg-amber-50/50 border-amber-200/60"
        />
        <StatCard 
          icon={<FileCheck size={18} className="text-indigo-500" />} 
          title="Em Aprovação" 
          value={formatBRL(aprValue)} 
          countLabel={`${aprCount} ${aprCount === 1 ? 'PROPOSTA' : 'PROPOSTAS'}`}
          subtitle="Enviada para o autor"
          badgeColor="text-indigo-600 bg-indigo-50/50 border-indigo-200/60"
        />
        <StatCard 
          icon={<XOctagon size={18} className="text-rose-500" />} 
          title="Não Aprovadas" 
          value={formatBRL(naValue)} 
          countLabel={`${naCount} ${naCount === 1 ? 'PROPOSTA' : 'PROPOSTAS'}`}
          subtitle="Recusadas ou pausadas"
          badgeColor="text-rose-600 bg-rose-50/50 border-rose-200/60"
        />
        <StatCard 
          icon={<FileStack size={18} className="text-emerald-500" />} 
          title="Propostas (Totais)" 
          value={formatBRL(approvedValue)} 
          countLabel={`${approvedCount} ${approvedCount === 1 ? 'PROPOSTA' : 'PROPOSTAS'}`}
          subtitle="Aprovadas pelo autor"
          badgeColor="text-emerald-600 bg-emerald-50/50 border-emerald-200/60"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
            <BookOpen size={30} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Novo Orçamento Comercial</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">Crie propostas comerciais precisas que cobrem todos os desvios de processo, insumos e margem estipulada.</p>
          <button 
            onClick={goToProposals}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100"
          >
            <Plus size={18} />
            Nova Proposta Comercial
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-indigo-500" />
            Metodologia Científica do Preço de Venda
          </h3>
          <div className="space-y-4 text-xs text-slate-600">
            <p className="leading-relaxed">O sistema calcula o preço final proporcionalmente às alíquotas cadastradas. Desse modo, as taxas se aplicam estritamente sobre o preço final gerado.</p>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-[10px] leading-relaxed border border-slate-800">
              Preço de Venda = Custo Total Insumos / (1 - (Taxas% / 100))
            </div>
            <p className="font-semibold text-slate-700">Simulação atual para fins de auditoria:</p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-500">
              <li>Custo Base da Produção: <span className="text-slate-800 font-mono">R$ 1.000,00</span></li>
              <li>Impostos + Taxas + Lucro Desejado: <span className="text-indigo-600 font-mono">{totalRatesPercent}%</span></li>
              <li>Fator Multiplicador Divisor: <span className="text-slate-800 font-mono">{(1 - (totalRatesPercent / 100)).toFixed(4)}</span></li>
              <li>Preço Sugerido Final: <span className="text-emerald-600 font-semibold font-mono">{formatMoney(totalRatesPercent >= 100 ? 0 : 1000 / (1 - (totalRatesPercent / 100)))}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
