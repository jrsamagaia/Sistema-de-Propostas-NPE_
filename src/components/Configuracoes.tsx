import React, { useState, useEffect } from 'react';
import { Download, Upload, Loader2, Save, MessageSquare, Mail, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Cost, Rate, Supply, Process, Status, Proposal, IntegrationSetting } from '../types';

interface BackupData {
  fixedCosts: Cost[];
  rates: Rate[];
  supplies: Supply[];
  processes: Process[];
  statuses: Status[];
  proposals: Proposal[];
}

interface ConfiguracoesProps {
  data: BackupData;
  settings: IntegrationSetting[];
  saveToDb: (collectionName: string, item: any) => Promise<void>;
  showNotification: (msg: string) => void;
}

type TabType = 'servers' | 'backup';

export default function Configuracoes({
  data,
  settings,
  saveToDb,
  showNotification,
}: ConfiguracoesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('servers');
  const [isImporting, setIsImporting] = useState(false);

  // WhatsApp states
  const [waUrl, setWaUrl] = useState('');
  const [waKey, setWaKey] = useState('');
  const [waInstance, setWaInstance] = useState('');
  const [isWaSaving, setIsWaSaving] = useState(false);
  const [waTestStatus, setWaTestStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // Email states
  const [mailHost, setMailHost] = useState('');
  const [mailPort, setMailPort] = useState('587');
  const [mailUser, setMailUser] = useState('');
  const [mailPass, setMailPass] = useState('');
  const [mailFrom, setMailFrom] = useState('');
  const [mailSsl, setMailSsl] = useState(false);
  const [isMailSaving, setIsMailSaving] = useState(false);
  const [showMailPass, setShowMailPass] = useState(false);
  const [mailTestStatus, setMailTestStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // Load configuration from settings prop
  useEffect(() => {
    const whatsapp = settings.find(s => s.id === 'whatsapp');
    if (whatsapp) {
      setWaUrl(whatsapp.apiUrl || '');
      setWaKey(whatsapp.apiKey || '');
      setWaInstance(whatsapp.instanceName || '');
    }

    const email = settings.find(s => s.id === 'email');
    if (email) {
      setMailHost(email.smtpHost || '');
      setMailPort(email.smtpPort || '587');
      setMailUser(email.smtpUser || '');
      setMailPass(email.smtpPass || '');
      setMailFrom(email.smtpFrom || '');
      setMailSsl(email.smtpSsl || false);
    }
  }, [settings]);

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_editora_npe_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup exportado com sucesso!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedText = event.target?.result as string;
        const importedData = JSON.parse(importedText);
        
        const restore = async (collectionName: string, items: any[]) => {
          if (Array.isArray(items)) {
            for (const item of items) {
              await saveToDb(collectionName, item);
            }
          }
        };

        await restore('costs', importedData.fixedCosts || importedData.costs);
        await restore('rates', importedData.rates);
        await restore('supplies', importedData.supplies);
        await restore('processes', importedData.processes);
        await restore('statuses', importedData.statuses);
        await restore('proposals', importedData.proposals);

        showNotification('Dados importados e sincronizados com sucesso!');
      } catch (err) {
        console.error(err);
        showNotification('Erro ao importar. Verifique se o arquivo é um JSON válido.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWaSaving(true);
    try {
      await saveToDb('settings', {
        id: 'whatsapp',
        apiUrl: waUrl.trim(),
        apiKey: waKey.trim(),
        instanceName: waInstance.trim()
      });
      showNotification('Configurações do WhatsApp salvas com sucesso!');
    } catch (error) {
      console.error(error);
      showNotification('Erro ao salvar configurações do WhatsApp.');
    } finally {
      setIsWaSaving(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMailSaving(true);
    try {
      await saveToDb('settings', {
        id: 'email',
        smtpHost: mailHost.trim(),
        smtpPort: mailPort.trim(),
        smtpUser: mailUser.trim(),
        smtpPass: mailPass,
        smtpFrom: mailFrom.trim(),
        smtpSsl: mailSsl
      });
      showNotification('Configurações do servidor de e-mail salvas com sucesso!');
    } catch (error) {
      console.error(error);
      showNotification('Erro ao salvar configurações do servidor de e-mail.');
    } finally {
      setIsMailSaving(false);
    }
  };

  const handleTestWhatsapp = async () => {
    setWaTestStatus({ type: 'loading', message: 'Testando conexão com a Evolution API...' });
    try {
      let response;
      let resData;
      let useFallback = false;

      try {
        response = await fetch('/api/test-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: {
              apiUrl: waUrl,
              apiKey: waKey,
              instanceName: waInstance
            }
          })
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html') || response.status === 404) {
          useFallback = true;
        } else {
          resData = await response.json();
          if (!response.ok) {
            throw new Error(resData.error || 'Erro ao conectar com a Evolution API.');
          }
        }
      } catch (err: any) {
        if (err.message?.includes('JSON') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch')) {
          useFallback = true;
        } else {
          throw err;
        }
      }

      if (useFallback) {
        console.log("Servidor Express não detectado (provavelmente hospedado no Vercel). Usando fallback direto do cliente...");
        const baseUrl = waUrl.trim().replace(/\/$/, "");
        const directUrl = `${baseUrl}/instance/connectionState/${waInstance.trim()}`;
        
        const directResponse = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'apikey': waKey.trim()
          }
        });

        if (!directResponse.ok) {
          const errText = await directResponse.text();
          throw new Error(`Erro retornado pela Evolution API direta (${directResponse.status}): ${errText}`);
        }

        resData = await directResponse.json();
      }

      const connectionState = resData?.instance?.state || resData?.state || 'open';
      if (connectionState === 'open' || connectionState === 'connected') {
        setWaTestStatus({
          type: 'success',
          message: `Conexão bem-sucedida! Instância "${waInstance}" está online e conectada ao WhatsApp.`
        });
      } else {
        setWaTestStatus({
          type: 'error',
          message: `Servidor acessado, mas a instância está com status: "${connectionState}". Por favor, escaneie o QR Code no painel da Evolution API.`
        });
      }
    } catch (error: any) {
      setWaTestStatus({
        type: 'error',
        message: error?.message || 'Falha de comunicação com o servidor Evolution API.'
      });
    }
  };

  const handleTestEmail = async () => {
    setMailTestStatus({ type: 'loading', message: 'Testando conexão SMTP com o servidor de e-mail...' });
    try {
      let response;
      let resData;
      let useFallback = false;

      try {
        response = await fetch('/api/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: {
              smtpHost: mailHost,
              smtpPort: mailPort,
              smtpUser: mailUser,
              smtpPass: mailPass,
              smtpSsl: mailSsl
            }
          })
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.status === 404) {
          useFallback = true;
        } else if (contentType.includes('text/html')) {
          const errText = await response.text();
          const cleanText = errText.replace(/<[^>]*>/g, '').substring(0, 180).trim();
          throw new Error(`Erro retornado pelo servidor (${response.status}): ${cleanText || 'Erro desconhecido.'}`);
        } else {
          resData = await response.json();
          if (!response.ok) {
            throw new Error(resData.error || 'Erro ao conectar ao servidor SMTP.');
          }
        }
      } catch (err: any) {
        if (err.message?.includes('JSON') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch')) {
          useFallback = true;
        } else {
          throw err;
        }
      }

      if (useFallback) {
        throw new Error("O teste de conexão SMTP necessita do servidor Express de e-mail ativo. Se você está hospedado na Vercel, certifique-se de fazer o deploy (implantar) da versão mais recente contendo o arquivo vercel.json e a pasta /api para ativar as Serverless Functions.");
      }

      setMailTestStatus({
        type: 'success',
        message: 'Teste SMTP realizado com sucesso! O servidor de e-mail está configurado corretamente.'
      });
    } catch (error: any) {
      setMailTestStatus({
        type: 'error',
        message: error?.message || 'Falha ao autenticar ou conectar no servidor SMTP.'
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in" id="config-panel">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Painel de Configurações</h2>
          <p className="text-xs text-slate-500 font-medium">Configure as integrações de envio (WhatsApp e E-mail) ou gerencie os backups do sistema.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'servers'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            id="tab-servers-btn"
          >
            Servidores e Integrações
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            id="tab-backup-btn"
          >
            Cópia de Segurança (Backup)
          </button>
        </div>
      </div>

      {activeTab === 'servers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="servers-panel">
          {/* WhatsApp Settings Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between" id="whatsapp-settings-card">
            <form onSubmit={handleSaveWhatsapp} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Servidor do WhatsApp</h3>
                  <p className="text-xs text-slate-400 font-medium">Evolution API v1/v2</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">URL do Servidor API</label>
                  <input
                    type="url"
                    placeholder="https://evoapi.seuservidor.com"
                    value={waUrl}
                    onChange={(e) => setWaUrl(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Informe o endereço raiz da sua API Evolution instalada.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chave de API (ApiKey)</label>
                  <input
                    type="password"
                    placeholder="Sua chave secreta de API"
                    value={waKey}
                    onChange={(e) => setWaKey(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    placeholder="Ex: EditoraNPE2"
                    value={waInstance}
                    onChange={(e) => setWaInstance(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isWaSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isWaSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleTestWhatsapp}
                  disabled={!waUrl || !waKey || !waInstance}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                >
                  Testar Conexão
                </button>
              </div>
            </form>

            {/* Test connection result banner */}
            {waTestStatus.type !== 'idle' && (
              <div className={`mt-4 p-4 rounded-lg text-xs flex items-start gap-2.5 border ${
                waTestStatus.type === 'loading'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : waTestStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {waTestStatus.type === 'loading' && <Loader2 size={16} className="animate-spin shrink-0 mt-0.5" />}
                {waTestStatus.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
                {waTestStatus.type === 'error' && <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />}
                <div className="font-medium">{waTestStatus.message}</div>
              </div>
            )}
          </div>

          {/* Email Settings Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between" id="email-settings-card">
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Servidor de E-mail</h3>
                  <p className="text-xs text-slate-400 font-medium">SMTP Autenticado</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Host SMTP</label>
                    <input
                      type="text"
                      placeholder="Ex: mail.editoranpe.com.br"
                      value={mailHost}
                      onChange={(e) => setMailHost(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Porta</label>
                    <input
                      type="text"
                      placeholder="587"
                      value={mailPort}
                      onChange={(e) => setMailPort(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Usuário / E-mail</label>
                    <input
                      type="email"
                      placeholder="contato@editoranpe.com.br"
                      value={mailUser}
                      onChange={(e) => setMailUser(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Senha SMTP</label>
                    <div className="relative">
                      <input
                        type={showMailPass ? 'text' : 'password'}
                        placeholder="Sua senha secreta"
                        value={mailPass}
                        onChange={(e) => setMailPass(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMailPass(!showMailPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showMailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Remetente Customizado</label>
                  <input
                    type="text"
                    placeholder="Ex: Editora NPE <financeiro@editoranpe.com.br>"
                    value={mailFrom}
                    onChange={(e) => setMailFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Deixe vazio para usar o e-mail de usuário como remetente padrão.</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mailSsl"
                    checked={mailSsl}
                    onChange={(e) => setMailSsl(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="mailSsl" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">Usar SSL/TLS Seguro (obrigatório para porta 465)</label>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isMailSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isMailSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar E-mail
                </button>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={!mailHost || !mailUser || !mailPass}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                >
                  Testar Servidor
                </button>
              </div>
            </form>

            {/* Test connection result banner */}
            {mailTestStatus.type !== 'idle' && (
              <div className={`mt-4 p-4 rounded-lg text-xs flex items-start gap-2.5 border ${
                mailTestStatus.type === 'loading'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : mailTestStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {mailTestStatus.type === 'loading' && <Loader2 size={16} className="animate-spin shrink-0 mt-0.5" />}
                {mailTestStatus.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
                {mailTestStatus.type === 'error' && <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />}
                <div className="font-medium">{mailTestStatus.message}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="backup-panel">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Download size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Exportar Backup</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Faz o download de um arquivo contendo todas as propostas, insumos, custos e kanban atuais. Ideal para guardar na nuvem como segurança.</p>
            <button 
              onClick={handleExport}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={20} /> Baixar Arquivo de Backup
            </button>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Importar Dados</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Carrega um arquivo de backup baixado anteriormente. Os dados serão mesclados com o banco atual do sistema.</p>
            
            <label className={`w-full ${isImporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'} text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}>
              {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              {isImporting ? 'Importando do arquivo...' : 'Selecionar Arquivo JSON'}
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                className="hidden" 
                disabled={isImporting} 
              />
            </label>
          </div>
        </div>
      )}
      
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-600 text-sm font-semibold">
        <strong>Nota sobre Sincronização Nuvem:</strong> Suas configurações e dados do orçamentador são sincronizados em tempo real no seu banco de dados na nuvem Google Firebase. Se você exportar o backup, poderá importar as informações a qualquer momento em novas instalações.
      </div>
    </div>
  );
}
