import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, Save, Settings, X, FileText, Printer, Clock, Send, Loader2, Search, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Proposal, Supply, Rate, Status, ProposalItem, Lead, IntegrationSetting, CardInstallmentOption, getInstallmentScheduleText } from '../types';
import PropostaPDFModal from './PropostaPDFModal';
import AutocompleteSelect from './AutocompleteSelect';

interface PropostasProps {
  supplies: Supply[];
  rates: Rate[];
  markupMultiplier: number;
  proposals: Proposal[];
  statuses: Status[];
  settings?: IntegrationSetting[];
  leads: Lead[];
  saveProposal: (proposal: Proposal) => void;
  removeProposal: (id: number) => void;
  showNotification: (msg: string) => void;
  proposalToEdit?: Proposal | 'new' | null;
  onClearProposalToEdit?: () => void;
  showOnlyApproved?: boolean;
}

export default function Propostas({
  supplies,
  rates,
  markupMultiplier,
  proposals,
  statuses,
  settings = [],
  leads = [],
  saveProposal,
  removeProposal,
  showNotification,
  proposalToEdit,
  onClearProposalToEdit,
  showOnlyApproved = false,
}: PropostasProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [proposalName, setProposalName] = useState('');
  const [projectType, setProjectType] = useState<'editorial' | 'cultural'>('editorial');
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);

  // Proposal Creation & Validity Dates
  const [proposalDate, setProposalDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [proposalValidityDate, setProposalValidityDate] = useState<string>(() => {
    const valD = new Date();
    valD.setDate(valD.getDate() + 15);
    return `${valD.getFullYear()}-${String(valD.getMonth() + 1).padStart(2, '0')}-${String(valD.getDate()).padStart(2, '0')}`;
  });

  // Approved values states
  const [approvedValue, setApprovedValue] = useState<number | undefined>(undefined);
  const [approvedPaymentMethod, setApprovedPaymentMethod] = useState<string>('');
  const [approvedInstallmentsDetails, setApprovedInstallmentsDetails] = useState<string>('');
  const [approvedDate, setApprovedDate] = useState<string>('');

  // Filters and grouping states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const getMonthYearInfo = (dateStr: string) => {
    const date = parseDate(dateStr);
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const month = date.getMonth();
    const year = date.getFullYear();
    return {
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${monthNames[month]} de ${year}`,
      year,
      month
    };
  };

  useEffect(() => {
    if (!proposalToEdit) return;

    if (proposalToEdit === 'new') {
      setIsCreating(true);
      setProposalName('');
      setProjectType('editorial');
      const todayISO = formatToISO(new Date().toLocaleDateString('pt-BR'));
      setProposalDate(todayISO);
      const valD = new Date();
      valD.setDate(valD.getDate() + 15);
      setProposalValidityDate(`${valD.getFullYear()}-${String(valD.getMonth() + 1).padStart(2, '0')}-${String(valD.getDate()).padStart(2, '0')}`);
      setItems([]);
      setEditingProposalId(null);
      setEditingItemId(null);
      setSelectedSupplyId('');
      setQuantity(1);
      setPaymentMethodCash(true);
      setPaymentMethodInstallments(true);
      setPaymentDiscountPercent(5);
      setPaymentEntryPercent(50);
      setPaymentInstallments(10);
      setPaymentInterestPercent(10);
      setCardInstallmentOptions([{ id: '1', installments: 10, interestPercent: 10 }]);
      setPaymentDirectTerms('Entrada, 30 e 60 dias');
      setPaymentCustomText('');
      setValidationDays(15);
      setDeliveryDays(30);
      setBookFeaturesDescription('');
      setSelectedLeadId('');
      setClientName('');
      setClientPhone('');
      setApprovedValue(undefined);
      setApprovedPaymentMethod('');
      setApprovedInstallmentsDetails('');
    } else {
      setEditingProposalId(proposalToEdit.id);
      setProposalName(proposalToEdit.name);
      setProjectType(proposalToEdit.projectType || 'editorial');
      
      const editDateISO = formatToISO(proposalToEdit.date);
      setProposalDate(editDateISO);
      if (proposalToEdit.validityDate) {
        setProposalValidityDate(formatToISO(proposalToEdit.validityDate));
      } else {
        const baseD = parseDate(proposalToEdit.date);
        const vDays = proposalToEdit.validationDays != null ? proposalToEdit.validationDays : 15;
        const vD = new Date(baseD);
        vD.setDate(vD.getDate() + vDays);
        setProposalValidityDate(`${vD.getFullYear()}-${String(vD.getMonth() + 1).padStart(2, '0')}-${String(vD.getDate()).padStart(2, '0')}`);
      }
      
      const normalizedItems = proposalToEdit.items.map(item => {
        if (item.type === 'produto' && (!item.shippingCost || item.shippingCost <= 0)) {
          const matchedSupply = supplies.find(s => s.id === item.supplyId);
          if (matchedSupply) {
            const catalogShippingQty = matchedSupply.shippingQty && matchedSupply.shippingQty > 0 ? matchedSupply.shippingQty : 0;
            const catalogShippingCost = matchedSupply.shippingCost || 0;
            const catalogFreightPerUnit = catalogShippingQty > 0 ? (catalogShippingCost / catalogShippingQty) : 0;
            const itemMult = item.multiplier || matchedSupply.multiplier || 1.0;
            const itemBaseCost = item.baseCost !== undefined ? item.baseCost : matchedSupply.cost;
            const expectedCost = (itemBaseCost * itemMult) + catalogFreightPerUnit;
            return {
              ...item,
              cost: expectedCost,
              shippingCost: 0
            };
          }
        }
        return item;
      });
      setItems(normalizedItems);
      setPaymentMethodCash(proposalToEdit.paymentMethodCash !== undefined ? proposalToEdit.paymentMethodCash : true);
      setPaymentMethodInstallments(proposalToEdit.paymentMethodInstallments !== undefined ? proposalToEdit.paymentMethodInstallments : true);
      setPaymentDiscountPercent(proposalToEdit.paymentDiscountPercent !== undefined ? proposalToEdit.paymentDiscountPercent : 5);
      setPaymentEntryPercent(proposalToEdit.paymentEntryPercent != null ? proposalToEdit.paymentEntryPercent : 50);
      setPaymentInstallments(proposalToEdit.paymentInstallments != null ? proposalToEdit.paymentInstallments : 10);
      setPaymentInterestPercent(proposalToEdit.paymentInterestPercent != null ? proposalToEdit.paymentInterestPercent : 10);
      setPaymentDirectTerms(proposalToEdit.paymentDirectTerms || 'Entrada, 30 e 60 dias');
      const loadedOptions: CardInstallmentOption[] = (proposalToEdit.cardInstallmentOptions && proposalToEdit.cardInstallmentOptions.length > 0)
        ? proposalToEdit.cardInstallmentOptions
        : [{
            id: '1',
            installments: proposalToEdit.paymentInstallments != null ? proposalToEdit.paymentInstallments : 10,
            interestPercent: proposalToEdit.paymentInterestPercent != null ? proposalToEdit.paymentInterestPercent : 10
          }];
      setCardInstallmentOptions(loadedOptions);
      setPaymentCustomText(proposalToEdit.paymentCustomText || '');
      setValidationDays(proposalToEdit.validationDays != null ? proposalToEdit.validationDays : 15);
      setDeliveryDays(proposalToEdit.deliveryDays != null ? proposalToEdit.deliveryDays : 30);
      setBookFeaturesDescription(proposalToEdit.bookFeaturesDescription || '');
      setSelectedLeadId(proposalToEdit.leadId != null ? proposalToEdit.leadId : '');
      setClientName(proposalToEdit.clientName || '');
      setClientPhone(proposalToEdit.clientPhone || '');
      setApprovedValue(proposalToEdit.approvedValue);
      setApprovedPaymentMethod(proposalToEdit.approvedPaymentMethod || '');
      setApprovedInstallmentsDetails(proposalToEdit.approvedInstallmentsDetails || '');
      setIsCreating(true);
      setEditingItemId(null);
      setSelectedSupplyId('');
      setQuantity(1);
    }

    if (onClearProposalToEdit) {
      onClearProposalToEdit();
    }
  }, [proposalToEdit, onClearProposalToEdit]);
  
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [supplyTypeFilter, setSupplyTypeFilter] = useState<'todos' | 'servico' | 'produto'>('todos');
  const [supplySearchQuery, setSupplySearchQuery] = useState('');
  const [isSupplySearchOpen, setIsSupplySearchOpen] = useState(false);
  const supplyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(event.target as Node)) {
        setIsSupplySearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [quantity, setQuantity] = useState<number | string>(1);
  const [itemFreight, setItemFreight] = useState<number | string>('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const handleSupplyChange = (supplyIdStr: string) => {
    setSelectedSupplyId(supplyIdStr);
    if (!supplyIdStr) {
      setItemFreight('');
      setSupplySearchQuery('');
      return;
    }
    const supply = supplies.find(s => s.id === parseInt(supplyIdStr));
    if (supply) {
      setSupplySearchQuery(supply.description);
      setItemFreight('');
    } else {
      setItemFreight('');
    }
  };

  // Client states
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Conditions of payment states
  const [paymentMethodCash, setPaymentMethodCash] = useState<boolean>(true);
  const [paymentMethodInstallments, setPaymentMethodInstallments] = useState<boolean>(true);
  const [paymentDiscountPercent, setPaymentDiscountPercent] = useState<number>(5);
  const [paymentEntryPercent, setPaymentEntryPercent] = useState<number>(50);
  const [paymentInstallments, setPaymentInstallments] = useState<number>(10);
  const [paymentInterestPercent, setPaymentInterestPercent] = useState<number>(10);
  const [cardInstallmentOptions, setCardInstallmentOptions] = useState<CardInstallmentOption[]>([
    { id: '1', installments: 10, interestPercent: 10 }
  ]);
  const [paymentDirectTerms, setPaymentDirectTerms] = useState<string>('Entrada, 30 e 60 dias');
  const [paymentCustomText, setPaymentCustomText] = useState<string>('');

  const handleAddCardInstallmentOption = () => {
    const lastOption = cardInstallmentOptions[cardInstallmentOptions.length - 1];
    const nextInstallments = lastOption ? (lastOption.installments >= 12 ? Math.min(48, lastOption.installments + 6) : 12) : 12;
    const nextInterest = lastOption ? Number((lastOption.interestPercent + 2.5).toFixed(1)) : 12;
    setCardInstallmentOptions([
      ...cardInstallmentOptions,
      { 
        id: Date.now().toString(), 
        installments: nextInstallments, 
        interestPercent: nextInterest,
        withEntry: lastOption ? lastOption.withEntry : true
      }
    ]);
  };

  const handleRemoveCardInstallmentOption = (index: number) => {
    if (cardInstallmentOptions.length <= 1) return;
    setCardInstallmentOptions(cardInstallmentOptions.filter((_, i) => i !== index));
  };

  const handleUpdateCardInstallmentOption = (index: number, field: 'installments' | 'interestPercent' | 'withEntry', value: any) => {
    const updated = [...cardInstallmentOptions];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setCardInstallmentOptions(updated);
    if (index === 0) {
      if (field === 'installments') setPaymentInstallments(value);
      if (field === 'interestPercent') setPaymentInterestPercent(value);
    }
  };

  // Deadlines states
  const [validationDays, setValidationDays] = useState<number>(15);
  const [deliveryDays, setDeliveryDays] = useState<number>(30);
  const [bookFeaturesDescription, setBookFeaturesDescription] = useState<string>('');

  // Selected proposal for PDF layout trigger
  const [selectedProposalForPDF, setSelectedProposalForPDF] = useState<(Proposal & { triggerWhatsAppOnMount?: boolean }) | null>(null);
  const [isValidatingConfig, setIsValidatingConfig] = useState(false);

  const validateWhatsAppConfig = async (): Promise<boolean> => {
    try {
      const whatsapp = settings?.find(s => s.id === 'whatsapp');
      if (whatsapp && whatsapp.apiUrl && whatsapp.apiKey && whatsapp.instanceName) {
        return true;
      }

      // Fallback to server check
      const response = await fetch('/api/check-whatsapp-config');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Erro de validação de rede' }));
        throw new Error(errData.error || `Erro de validação: ${response.status}`);
      }
      const data = await response.json();
      if (!data.configured) {
        throw new Error("O WhatsApp (Evolution API) não está configurado. Vá na aba 'Configurações' para configurar o servidor.");
      }
      return true;
    } catch (err: any) {
      console.error("Erro ao validar configuração do WhatsApp:", err);
      showNotification(`Falha de Configuração: ${err.message || "O WhatsApp (Evolution API) não está configurado. Acesse a aba 'Configurações' no menu lateral."}`);
      return false;
    }
  };

  const handleAddItem = () => {
    if (!selectedSupplyId) return;
    const supply = supplies.find(s => s.id === parseInt(selectedSupplyId));
    if (!supply) return;

    const parsedQty = parseFloat(quantity.toString()) || 0;
    const itemType = supply.type || 'servico';
    const itemMultiplier = itemType === 'produto' ? (supply.multiplier || 1.0) : 1.0;

    let finalShippingCost: number | undefined = undefined;
    let shippingQtyVal: number = 0;
    let perUnitShipping = 0;

    if (itemType === 'produto') {
      const userFreightNum = (itemFreight !== '' && itemFreight !== null && itemFreight !== undefined)
        ? parseFloat(itemFreight.toString())
        : NaN;

      if (!isNaN(userFreightNum) && userFreightNum > 0) {
        // Frete avulso informado maior que zero
        finalShippingCost = userFreightNum;
        shippingQtyVal = supply.shippingQty && supply.shippingQty > 0 ? supply.shippingQty : (parsedQty > 0 ? parsedQty : 1);
        perUnitShipping = shippingQtyVal > 0 ? (userFreightNum / shippingQtyVal) : 0;
      } else {
        // Frete igual a ZERO ou não informado (vazio):
        // Considera o frete zerado (não será impresso no relatório)
        finalShippingCost = 0;
        // Porém utiliza o valor unitário da tela de cadastro de insumos/serviços como base
        const catalogShippingQty = supply.shippingQty && supply.shippingQty > 0 ? supply.shippingQty : 0;
        const catalogShippingCost = supply.shippingCost || 0;
        perUnitShipping = catalogShippingQty > 0 ? (catalogShippingCost / catalogShippingQty) : 0;
      }
    }

    const effectiveCost = (supply.cost * itemMultiplier) + perUnitShipping;

    if (editingItemId) {
      setItems(items.map(item => item.id === editingItemId ? {
        ...item,
        supplyId: supply.id,
        description: supply.description,
        unit: supply.unit,
        cost: effectiveCost,
        qty: parsedQty,
        type: itemType,
        multiplier: itemMultiplier,
        baseCost: supply.cost,
        shippingCost: finalShippingCost,
        shippingQty: shippingQtyVal
      } : item));
      setEditingItemId(null);
    } else {
      const newItem: ProposalItem = {
        id: Date.now(),
        supplyId: supply.id,
        description: supply.description,
        unit: supply.unit,
        cost: effectiveCost,
        qty: parsedQty,
        type: itemType,
        multiplier: itemMultiplier,
        baseCost: supply.cost,
        shippingCost: finalShippingCost,
        shippingQty: shippingQtyVal
      };
      setItems([...items, newItem]);
    }
    
    setSelectedSupplyId('');
    setSupplySearchQuery('');
    setIsSupplySearchOpen(false);
    setQuantity(1);
    setItemFreight('');
  };

  const handleEditItem = (item: ProposalItem) => {
    setEditingItemId(item.id);
    setSelectedSupplyId(item.supplyId.toString());
    const matchedSupply = supplies.find(s => s.id === item.supplyId);
    if (matchedSupply) {
      setSupplySearchQuery(matchedSupply.description);
    }
    setQuantity(item.qty);
    if (item.type === 'produto') {
      setItemFreight(item.shippingCost !== undefined && item.shippingCost > 0 ? item.shippingCost : '');
    } else {
      setItemFreight('');
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setSelectedSupplyId('');
    setSupplySearchQuery('');
    setIsSupplySearchOpen(false);
    setQuantity(1);
    setItemFreight('');
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveProposal = () => {
    if (!proposalName.trim() || items.length === 0) {
      showNotification("Por favor, dê um nome e adicione insumos à proposta.");
      return;
    }

    const sItems = items.filter(item => item.type !== 'produto');
    const pItems = items.filter(item => item.type === 'produto');

    const sCost = sItems.reduce((acc, item) => acc + (item.cost * item.qty), 0);
    
    let mProductCost = 0;
    if (pItems.length > 0) {
      const mQtyItem = pItems.reduce((min, item) => (item.qty < min.qty ? item : min), pItems[0]);
      mProductCost = mQtyItem.cost * mQtyItem.qty;
    }

    let totalCost = 0;
    let sellPrice = 0;

    if (pItems.length > 0 && sItems.length === 0) {
      totalCost = mProductCost;
      sellPrice = mProductCost;
    } else if (sItems.length > 0 && pItems.length === 0) {
      totalCost = sCost;
      sellPrice = sCost * markupMultiplier;
    } else {
      totalCost = sCost + mProductCost;
      sellPrice = (sCost * markupMultiplier) + mProductCost;
    }

    if (editingProposalId) {
      const existingProp = proposals.find(p => p.id === editingProposalId);
      if (existingProp) {
        saveProposal({
          ...existingProp,
          name: proposalName,
          projectType,
          date: formatToBR(proposalDate) || existingProp.date || new Date().toLocaleDateString('pt-BR'),
          validityDate: formatToBR(proposalValidityDate) || undefined,
          items: [...items],
          totalCost,
          sellPrice,
          paymentMethodCash,
          paymentMethodInstallments,
          paymentDiscountPercent,
          paymentEntryPercent,
          paymentInstallments: cardInstallmentOptions[0]?.installments || paymentInstallments || 10,
          paymentInterestPercent: cardInstallmentOptions[0]?.interestPercent != null ? cardInstallmentOptions[0].interestPercent : paymentInterestPercent,
          cardInstallmentOptions: cardInstallmentOptions.length > 0 ? cardInstallmentOptions : [{ id: '1', installments: paymentInstallments, interestPercent: paymentInterestPercent }],
          paymentDirectTerms: paymentDirectTerms.trim() || undefined,
          paymentCustomText,
          validationDays,
          deliveryDays,
          bookFeaturesDescription,
          markupMultiplier,
          leadId: (selectedLeadId && selectedLeadId !== '') ? Number(selectedLeadId) : undefined,
          clientName: clientName.trim() || undefined,
          clientPhone: clientPhone.trim() || undefined,
          approvedValue: approvedValue !== undefined ? approvedValue : existingProp.approvedValue,
          approvedPaymentMethod: approvedPaymentMethod || existingProp.approvedPaymentMethod,
          approvedInstallmentsDetails: approvedInstallmentsDetails || existingProp.approvedInstallmentsDetails,
          approvedDate: isApprovedStatus 
            ? (approvedDate ? formatToBR(approvedDate) : (existingProp.approvedDate || new Date().toLocaleDateString('pt-BR')))
            : undefined
        });
        showNotification('Proposta atualizada com sucesso!');
      }
    } else {
      const newId = Date.now();
      const defaultStatus = statuses.length > 0 ? statuses[0].name : 'Em desenvolvimento';
      saveProposal({
        id: newId,
        name: proposalName,
        projectType,
        date: formatToBR(proposalDate) || new Date().toLocaleDateString('pt-BR'),
        validityDate: formatToBR(proposalValidityDate) || undefined,
        items: [...items],
        totalCost,
        sellPrice,
        status: defaultStatus,
        paymentMethodCash,
        paymentMethodInstallments,
        paymentDiscountPercent,
        paymentEntryPercent,
        paymentInstallments: cardInstallmentOptions[0]?.installments || paymentInstallments || 10,
        paymentInterestPercent: cardInstallmentOptions[0]?.interestPercent != null ? cardInstallmentOptions[0].interestPercent : paymentInterestPercent,
        cardInstallmentOptions: cardInstallmentOptions.length > 0 ? cardInstallmentOptions : [{ id: '1', installments: paymentInstallments, interestPercent: paymentInterestPercent }],
        paymentDirectTerms: paymentDirectTerms.trim() || undefined,
        paymentCustomText,
        validationDays,
        deliveryDays,
        bookFeaturesDescription,
        markupMultiplier,
        leadId: (selectedLeadId && selectedLeadId !== '') ? Number(selectedLeadId) : undefined,
        clientName: clientName.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        approvedValue: approvedValue !== undefined ? approvedValue : undefined,
        approvedPaymentMethod: approvedPaymentMethod || undefined,
        approvedInstallmentsDetails: approvedInstallmentsDetails || undefined,
        approvedDate: undefined
      });
      setEditingProposalId(newId);
      showNotification('Proposta oficial salva com sucesso! Botão do PDF habilitado abaixo.');
    }
  };

  const handleEditProposal = (prop: Proposal) => {
    setEditingProposalId(prop.id);
    setProposalName(prop.name);
    setProjectType(prop.projectType || 'editorial');
    setItems([...prop.items]);
    setPaymentEntryPercent(prop.paymentEntryPercent != null ? prop.paymentEntryPercent : 50);
    setPaymentInstallments(prop.paymentInstallments != null ? prop.paymentInstallments : 10);
    setPaymentInterestPercent(prop.paymentInterestPercent != null ? prop.paymentInterestPercent : 10);
    setPaymentDirectTerms(prop.paymentDirectTerms || 'Entrada, 30 e 60 dias');
    const editOptions: CardInstallmentOption[] = (prop.cardInstallmentOptions && prop.cardInstallmentOptions.length > 0)
      ? prop.cardInstallmentOptions
      : [{
          id: '1',
          installments: prop.paymentInstallments != null ? prop.paymentInstallments : 10,
          interestPercent: prop.paymentInterestPercent != null ? prop.paymentInterestPercent : 10
        }];
    setCardInstallmentOptions(editOptions);
    setPaymentCustomText(prop.paymentCustomText || '');
    setValidationDays(prop.validationDays != null ? prop.validationDays : 15);
    setDeliveryDays(prop.deliveryDays != null ? prop.deliveryDays : 30);
    setBookFeaturesDescription(prop.bookFeaturesDescription || '');
    setSelectedLeadId(prop.leadId != null ? prop.leadId : '');
    setClientName(prop.clientName || '');
    setClientPhone(prop.clientPhone || '');
    setApprovedValue(prop.approvedValue);
    setApprovedPaymentMethod(prop.approvedPaymentMethod || '');
    setApprovedInstallmentsDetails(prop.approvedInstallmentsDetails || '');
    setApprovedDate(prop.approvedDate ? formatToISO(prop.approvedDate) : formatToISO(prop.date));
    setIsCreating(true);
  };

  const handleDeleteProposal = (id: number) => {
    removeProposal(id);
    showNotification('Proposta excluída.');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setProposalName('');
    setProjectType('editorial');
    setItems([]);
    setEditingProposalId(null);
    setEditingItemId(null);
    setSelectedSupplyId('');
    setQuantity(1);
    setPaymentEntryPercent(50);
    setPaymentInstallments(10);
    setPaymentInterestPercent(10);
    setCardInstallmentOptions([{ id: '1', installments: 10, interestPercent: 10 }]);
    setPaymentDirectTerms('Entrada, 30 e 60 dias');
    setPaymentCustomText('');
    setValidationDays(15);
    setDeliveryDays(30);
    setBookFeaturesDescription('');
    setSelectedLeadId('');
    setClientName('');
    setClientPhone('');
    setApprovedValue(undefined);
    setApprovedPaymentMethod('');
    setApprovedInstallmentsDetails('');
    setApprovedDate('');
  };

  const serviceItems = items.filter(item => item.type !== 'produto');
  const productItems = items.filter(item => item.type === 'produto');

  const currentServicesCost = serviceItems.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  
  let minProductCost = 0;
  if (productItems.length > 0) {
    const minQtyItem = productItems.reduce((min, item) => (item.qty < min.qty ? item : min), productItems[0]);
    minProductCost = minQtyItem.cost * minQtyItem.qty;
  }

  let currentTotalCost = 0;
  let currentSellPrice = 0;

  if (productItems.length > 0 && serviceItems.length === 0) {
    currentTotalCost = minProductCost;
    currentSellPrice = minProductCost;
  } else if (serviceItems.length > 0 && productItems.length === 0) {
    currentTotalCost = currentServicesCost;
    currentSellPrice = currentServicesCost * markupMultiplier;
  } else {
    currentTotalCost = currentServicesCost + minProductCost;
    currentSellPrice = (currentServicesCost * markupMultiplier) + minProductCost;
  }

  const isApprovedStatus = showOnlyApproved || (editingProposalId !== null && proposals.find(p => p.id === editingProposalId)?.status?.toLowerCase().includes('aprovad'));

  if (isCreating) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Projeto ou Proposta</label>
            <input 
              type="text" 
              className="text-2xl font-bold border-none bg-transparent focus:outline-none focus:ring-0 w-full placeholder-slate-300"
              placeholder="Ex: PROJETO LIVRO - ARTHUR, O CAMALEÃO"
              value={proposalName}
              onChange={(e) => setProposalName(e.target.value)}
              autoFocus
            />
          </div>
          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 px-4 py-2 cursor-pointer">Cancelar</button>
        </div>

        {/* Seleção do Tipo de Projeto */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Tipo de Projeto <span className="text-red-500 font-semibold">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700 select-none">
                <input
                  type="radio"
                  name="projectType"
                  value="editorial"
                  checked={projectType === 'editorial'}
                  onChange={() => setProjectType('editorial')}
                  className="w-4 h-4 text-[#E21B79] focus:ring-[#E21B79] cursor-pointer"
                />
                <span>Projeto Editorial</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700 select-none">
                <input
                  type="radio"
                  name="projectType"
                  value="cultural"
                  checked={projectType === 'cultural'}
                  onChange={() => setProjectType('cultural')}
                  className="w-4 h-4 text-[#E21B79] focus:ring-[#E21B79] cursor-pointer"
                />
                <span>Projeto Cultural</span>
              </label>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-sans max-w-sm">
            {projectType === 'editorial' ? (
              <span>Exibe relatório conceitual consolidado no PDF.</span>
            ) : (
              <span>Exibe cada item de serviço com seu valor total individual no PDF.</span>
            )}
          </div>
        </div>

        {/* Datas da Proposta: Criação e Validade */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
              Data Criação Proposta <span className="text-red-500 font-semibold">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={proposalDate}
                onChange={(e) => {
                  setProposalDate(e.target.value);
                  if (e.target.value) {
                    const newBase = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(newBase.getTime())) {
                      const newVal = new Date(newBase);
                      newVal.setDate(newVal.getDate() + (validationDays || 15));
                      setProposalValidityDate(`${newVal.getFullYear()}-${String(newVal.getMonth() + 1).padStart(2, '0')}-${String(newVal.getDate()).padStart(2, '0')}`);
                    }
                  }
                }}
                className="w-full border border-gray-200 bg-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-sans"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Data de emissão inicial do orçamento.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
              Validade da proposta <span className="text-red-500 font-semibold">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={proposalValidityDate}
                onChange={(e) => {
                  setProposalValidityDate(e.target.value);
                  if (proposalDate && e.target.value) {
                    const d1 = new Date(proposalDate + 'T00:00:00');
                    const d2 = new Date(e.target.value + 'T00:00:00');
                    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                      setValidationDays(diffDays);
                    }
                  }
                }}
                className="w-full border border-gray-200 bg-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-sans"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Data de validade do orçamento (usada no filtro mensal das propostas não aprovadas).</p>
          </div>
        </div>

        {/* Dados do Cliente para Envio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="col-span-1">
            <AutocompleteSelect
              label="Vincular Contato / Lead"
              options={[
                { value: '', label: '-- Manual ou Selecionar Lead --', sublabel: 'Preenchimento avulso dos dados' },
                ...leads.map(lead => ({
                  value: lead.id.toString(),
                  label: lead.name,
                  sublabel: lead.phone + (lead.email ? ` | ${lead.email}` : '')
                }))
              ]}
              value={selectedLeadId.toString()}
              onChange={(val) => {
                const leadId = val !== '' ? parseInt(val) : '';
                setSelectedLeadId(leadId);
                if (leadId !== '') {
                  const matchedLead = leads.find(l => l.id === leadId);
                  if (matchedLead) {
                    setClientName(matchedLead.name);
                    setClientPhone(matchedLead.phone);
                  }
                } else {
                  setClientName('');
                  setClientPhone('');
                }
              }}
              placeholder="-- Manual ou Selecionar Lead --"
              searchPlaceholder="Pesquisar por nome ou telefone..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Cliente <span className="text-red-500 font-semibold">*</span></label>
            <input
              type="text"
              placeholder="Nome do cliente destinatário"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp / Telefone <span className="text-red-500 font-semibold">*</span></label>
            <input
              type="text"
              placeholder="Ex: 11999999999"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-sans"
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Settings size={18}/> Ficha Técnica de Produção</h3>
          </div>
          
          <div className="p-6">
            {(() => {
              const selectedSupplyObj = supplies.find(s => s.id === parseInt(selectedSupplyId));
              const isPrintService = selectedSupplyObj ? selectedSupplyObj.type === 'produto' : (editingItemId ? items.find(i => i.id === editingItemId)?.type === 'produto' : false);
              
              const filteredSupplies = supplies.filter(s => {
                if (supplyTypeFilter === 'servico' && s.type !== 'servico') return false;
                if (supplyTypeFilter === 'produto' && s.type !== 'produto') return false;
                
                if (supplySearchQuery.trim()) {
                  const q = supplySearchQuery.toLowerCase().trim();
                  const desc = (s.description || '').toLowerCase();
                  const unit = (s.unit || '').toLowerCase();
                  return desc.includes(q) || unit.includes(q);
                }
                return true;
              });

              return (
                <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex-wrap md:flex-nowrap">
                  {/* CAMPO DE SELEÇÃO COM AUTOCOMPLETE E FILTRO RADIO */}
                  <div className="flex-1 w-full md:w-auto relative" ref={supplyDropdownRef}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Selecione o Insumo/Serviço <span className="text-red-500">*</span>
                      </label>

                      {/* Radio Buttons para Filtro de Categoria */}
                      <div className="flex items-center gap-3 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtro:</span>
                        <label className="inline-flex items-center gap-1 cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
                          <input
                            type="radio"
                            name="supplyTypeFilter"
                            value="todos"
                            checked={supplyTypeFilter === 'todos'}
                            onChange={() => setSupplyTypeFilter('todos')}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Todos</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
                          <input
                            type="radio"
                            name="supplyTypeFilter"
                            value="servico"
                            checked={supplyTypeFilter === 'servico'}
                            onChange={() => setSupplyTypeFilter('servico')}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Serviços</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
                          <input
                            type="radio"
                            name="supplyTypeFilter"
                            value="produto"
                            checked={supplyTypeFilter === 'produto'}
                            onChange={() => setSupplyTypeFilter('produto')}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Impressão</span>
                        </label>
                      </div>
                    </div>

                    {/* Autocomplete Input Box */}
                    <div className="relative">
                      <div className="relative flex items-center">
                        <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Digite para pesquisar por nome, categoria ou unidade..."
                          className="w-full pl-9 pr-9 py-2 border border-slate-300 bg-white rounded text-sm focus:outline-none focus:border-amber-500 font-sans shadow-2xs"
                          value={
                            isSupplySearchOpen
                              ? supplySearchQuery
                              : (selectedSupplyObj ? selectedSupplyObj.description : supplySearchQuery)
                          }
                          onFocus={() => {
                            setIsSupplySearchOpen(true);
                            if (selectedSupplyObj && !supplySearchQuery) {
                              setSupplySearchQuery(selectedSupplyObj.description);
                            }
                          }}
                          onChange={(e) => {
                            setSupplySearchQuery(e.target.value);
                            if (!isSupplySearchOpen) setIsSupplySearchOpen(true);
                          }}
                        />
                        {(selectedSupplyId || supplySearchQuery) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSupplyChange('');
                              setSupplySearchQuery('');
                              setIsSupplySearchOpen(false);
                            }}
                            className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title="Limpar seleção"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown de opções filtradas */}
                      {isSupplySearchOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {filteredSupplies.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 text-center italic">
                              Nenhum insumo ou serviço encontrado.
                            </div>
                          ) : (
                            filteredSupplies.map(s => {
                              const isProduct = s.type === 'produto';
                              const mult = isProduct ? (s.multiplier || 1.0) : 1.0;
                              const catalogShippingCost = isProduct && s.shippingCost !== undefined ? s.shippingCost : 0;
                              const catalogShippingQty = isProduct && s.shippingQty !== undefined ? s.shippingQty : 0;
                              const catalogFreightPerUnit = catalogShippingQty > 0 ? (catalogShippingCost / catalogShippingQty) : 0;
                              const effectiveCost = (s.cost * mult) + catalogFreightPerUnit;
                              const isSelected = selectedSupplyId === s.id.toString();

                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    handleSupplyChange(s.id.toString());
                                    setSupplySearchQuery(s.description);
                                    setIsSupplySearchOpen(false);
                                  }}
                                  className={`p-2.5 hover:bg-amber-50 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                                    isSelected ? 'bg-amber-50/90 font-semibold' : ''
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                        isProduct 
                                          ? 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200' 
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      }`}>
                                        {isProduct ? 'Impressão' : 'Serviço'}
                                      </span>
                                      <span className="text-xs text-slate-800 truncate font-medium">
                                        {s.description}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-xs font-bold text-slate-900">
                                      R$ {effectiveCost.toFixed(2)}
                                      <span className="text-[10px] text-slate-500 font-normal">/{s.unit}</span>
                                    </div>
                                    {isProduct && mult !== 1.0 && (
                                      <span className="text-[9px] text-slate-400 block">
                                        Base: R$ {s.cost.toFixed(2)} (Fator {mult.toFixed(2)}x)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CAMPO VALOR FRETE (R$) QUANDO FOR SERVIÇO DE IMPRESSÃO */}
                  {isPrintService && (
                    <div className="w-full md:w-36">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Frete (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans"
                        value={itemFreight}
                        onChange={(e) => setItemFreight(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="w-full md:w-32">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button 
                      onClick={handleAddItem}
                      className={`w-full md:w-auto text-white px-4 py-2 rounded font-medium transition-colors cursor-pointer ${editingItemId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                      {editingItemId ? 'Atualizar' : 'Incluir'}
                    </button>
                    {editingItemId && (
                      <button 
                        onClick={handleCancelEditItem}
                        className="bg-gray-200 text-gray-600 px-3 py-2 rounded hover:bg-gray-300 transition-colors cursor-pointer"
                        title="Cancelar Edição"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mb-6 border-collapse min-w-max">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-600">
                    <th className="py-3 px-2 font-semibold">Descrição</th>
                    <th className="py-3 px-2 font-semibold text-center">Und. Medida</th>
                    <th className="py-3 px-2 font-semibold text-center">Qtdade</th>
                    <th className="py-3 px-2 font-semibold text-right">Custo Unit</th>
                    <th className="py-3 px-2 font-semibold text-right">Total</th>
                    <th className="py-3 px-2 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 border-b border-gray-100">Nenhum item adicionado à proposta ainda.</td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-slate-800 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{item.description}</span>
                            {item.type === 'produto' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wider border border-indigo-100">Impressão</span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-pink-50 text-pink-600 uppercase tracking-wider border border-pink-100">Serviço</span>
                            )}
                          </div>
                          {item.type === 'produto' && (
                            <div className="text-[10px] text-indigo-500 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>Valor Unitário: R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              {item.shippingCost !== undefined && item.shippingCost > 0 && (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-bold">
                                  Frete: R$ {item.shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-xs uppercase tracking-wider text-slate-500 font-semibold">{item.unit}</td>
                        <td className="py-3 px-2 text-center">{item.qty}</td>
                        <td className="py-3 px-2 text-right">R$ {item.cost.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-900 font-mono">R$ {(item.cost * item.qty).toFixed(2)}</td>
                        <td className="py-3 px-2 text-center flex justify-center gap-2">
                          <button onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1" title="Editar item"><Pencil size={16}/></button>
                          <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 cursor-pointer p-1" title="Excluir item"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="text-slate-500 text-sm max-w-md text-center lg:text-left font-medium">
                <p>O preço de venda é calculado automaticamente dividindo o Custo Total pelo fator correspondente às suas taxas cadastradas na aba Custos Fixos.</p>
              </div>
              <div className="flex gap-6 items-center flex-col md:flex-row">
                <div className="text-center md:text-right">
                  <p className="text-sm font-semibold text-slate-500 uppercase">Custo Mercadoria Total</p>
                  <p className="text-2xl font-mono text-slate-700 font-bold">R$ {currentTotalCost.toFixed(2)}</p>
                </div>
                <div className="w-px h-12 bg-slate-300 hidden md:block"></div>
                <div className="text-center md:text-right bg-amber-100 px-6 py-3 rounded-lg border border-amber-200 shadow-inner">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Preço de Venda Sugerido</p>
                  <p className="text-3xl font-bold text-emerald-600 font-mono">R$ {currentSellPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            {/* Seção 1: Condições de Pagamento */}
            <div className="mt-8 border-t border-slate-200 pt-6 space-y-4 font-sans text-left">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-[#E21B79]" />
                Condições de Pagamento da Proposta
              </h4>

              {/* Checkboxes de seleção de modalidade */}
              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={paymentMethodCash}
                    onChange={(e) => setPaymentMethodCash(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#E21B79] focus:ring-[#E21B79] cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-700 uppercase">Pagamento à Vista (com desconto)</span>
                </label>
                
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={paymentMethodInstallments}
                    onChange={(e) => setPaymentMethodInstallments(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#E21B79] focus:ring-[#E21B79] cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-700 uppercase">Pagamento Parcelado</span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Painel: Pagamento à Vista */}
                <div className={`p-5 rounded-xl border transition-all duration-200 ${
                  paymentMethodCash 
                    ? 'border-indigo-100 bg-white shadow-sm' 
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}>
                  <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${paymentMethodCash ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    Configurações - Pagamento à Vista
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Desconto (%)</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!paymentMethodCash}
                        value={paymentDiscountPercent}
                        onChange={(e) => setPaymentDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-full border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans"
                        placeholder="Ex: 5"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Percentual de desconto para o pagamento à vista.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Valor Final Aprovado (com desconto)</label>
                      <div className="relative rounded-lg shadow-inner bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 font-mono font-bold h-[38px] flex items-center">
                        R$ {(currentSellPrice * (1 - paymentDiscountPercent / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Calculado automaticamente com base no desconto.</p>
                    </div>
                  </div>
                </div>

                {/* Painel: Pagamento Parcelado */}
                <div className={`p-5 rounded-xl border transition-all duration-200 ${
                  paymentMethodInstallments 
                    ? 'border-indigo-100 bg-white shadow-sm' 
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}>
                  <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${paymentMethodInstallments ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    Configurações - Pagamento Parcelado
                  </h5>
                  
                  {/* Seção 1: Condição Direta / Prazos (PIX / Boleto / Faturamento) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-5">
                    <h6 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                      <span>1. Faturamento Direto / PIX / Boleto</span>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Ex: Entrada, 30 e 60 dias</span>
                    </h6>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Entrada no Pix/Boleto (%)</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          disabled={!paymentMethodInstallments}
                          value={paymentEntryPercent}
                          onChange={(e) => setPaymentEntryPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans"
                          placeholder="Ex: 50"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {paymentEntryPercent === 100 ? 'Pagamento integral no ato.' : `Restante (${100 - paymentEntryPercent}%) na entrega ou conforme os prazos.`}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Condição de Prazos (PIX / Boleto / Faturamento)</label>
                        <input 
                          type="text"
                          disabled={!paymentMethodInstallments}
                          value={paymentDirectTerms}
                          onChange={(e) => setPaymentDirectTerms(e.target.value)}
                          className="w-full border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans font-semibold text-slate-800"
                          placeholder="Ex: Entrada, 30 e 60 dias"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-400 self-center">Sugestões rápidas:</span>
                          {[
                            'Entrada, 30 e 60 dias',
                            'Entrada (50%) + Na entrega (50%)',
                            'Entrada, 30, 60 e 90 dias',
                            '30, 60 e 90 dias'
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              disabled={!paymentMethodInstallments}
                              onClick={() => setPaymentDirectTerms(suggestion)}
                              className="text-[10px] bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Condições de Cartão de Crédito (Múltiplas Opções) */}
                  <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/80">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2 mb-3">
                      <div>
                        <h6 className="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#E21B79]"></span>
                          2. Condições de Parcelamento no Cartão de Crédito
                        </h6>
                        <p className="text-[11px] text-slate-500">Adicione quantas condições de parcelas e juros forem necessárias.</p>
                      </div>
                      <span className="text-xs font-bold text-[#E21B79] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
                        {cardInstallmentOptions.length} {cardInstallmentOptions.length === 1 ? 'condição configurada' : 'condições configuradas'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {cardInstallmentOptions.map((opt, index) => {
                        const optTotalComJuros = currentSellPrice * (1 + (opt.interestPercent || 0) / 100);
                        const optValorParcela = optTotalComJuros / (opt.installments || 1);
                        const calculatedSchedule = getInstallmentScheduleText(opt.installments, opt.withEntry);

                        return (
                          <div key={opt.id || index} className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-sm relative group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wide border border-indigo-100">
                                  Condição #{index + 1}
                                </span>
                                {opt.withEntry && (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    1ª Parcela = Entrada
                                  </span>
                                )}
                              </div>
                              {cardInstallmentOptions.length > 1 && (
                                <button
                                  type="button"
                                  disabled={!paymentMethodInstallments}
                                  onClick={() => handleRemoveCardInstallmentOption(index)}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                                  title="Remover esta condição de parcelamento"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                  Quantidade de Parcelas (Cartão)
                                </label>
                                <input 
                                  type="number"
                                  min="1"
                                  max="48"
                                  disabled={!paymentMethodInstallments}
                                  value={opt.installments}
                                  onChange={(e) => handleUpdateCardInstallmentOption(index, 'installments', Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans font-semibold"
                                  placeholder="Ex: 10"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Número de parcelas.</p>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                  Acréscimo/Juros do Parcelamento (%)
                                </label>
                                <input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  disabled={!paymentMethodInstallments}
                                  value={opt.interestPercent}
                                  onChange={(e) => handleUpdateCardInstallmentOption(index, 'interestPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans font-semibold"
                                  placeholder="Ex: 10"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">0% para sem juros.</p>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                  Valor Final Aprovado (com juros)
                                </label>
                                <div className="rounded-lg shadow-inner bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-mono font-bold flex flex-col justify-center min-h-[38px]">
                                  <span className="text-slate-900 text-sm">
                                    R$ {optTotalComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-sans font-medium">
                                    {opt.installments}x de R$ {optValorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {opt.interestPercent === 0 ? '(Sem juros)' : `(+${opt.interestPercent}%)`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Campo checkbox para pagamento de entrada como opcional e cálculo automático */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!opt.withEntry}
                                  disabled={!paymentMethodInstallments}
                                  onChange={(e) => handleUpdateCardInstallmentOption(index, 'withEntry', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-slate-700">
                                  Exigir Entrada (1ª parcela para início do projeto)
                                </span>
                              </label>

                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-slate-500 font-medium">Cronograma calculado:</span>
                                <span className="font-bold text-indigo-900 bg-white border border-indigo-200 px-2.5 py-1 rounded-md shadow-2xs">
                                  {calculatedSchedule}
                                </span>
                                <button
                                  type="button"
                                  disabled={!paymentMethodInstallments}
                                  onClick={() => setPaymentDirectTerms(calculatedSchedule)}
                                  className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                                  title="Copiar este cronograma para o campo de Faturamento Direto / PIX"
                                >
                                  Usar no Faturamento
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botão de Mais abaixo dos campos */}
                    <div className="mt-3.5 pt-2 border-t border-indigo-100">
                      <button
                        type="button"
                        disabled={!paymentMethodInstallments}
                        onClick={handleAddCardInstallmentOption}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                        Adicionar outra condição de parcelamento (Cartão)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Observações / Descrição das Condições no PDF (Opcional)</label>
                <textarea 
                  value={paymentCustomText}
                  disabled={!paymentMethodCash && !paymentMethodInstallments}
                  onChange={(e) => setPaymentCustomText(e.target.value)}
                  className="w-full border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-sans h-20 placeholder-slate-300"
                  placeholder="Ex: Os cartões aceitos são Visa, Mastercard e Elo."
                />
              </div>
            </div>

            {/* Seção 2: Prazos da Proposta e do Projeto */}
            <div className="mt-6 border-t border-slate-200 pt-6 space-y-4 font-sans text-left">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Clock size={20} className="text-[#E21B79]" />
                Validade da Proposta & Prazo de Entrega
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Prazo de Validação da Proposta (Dias corridos)</label>
                  <input 
                    type="number"
                    min="1"
                    value={validationDays}
                    onChange={(e) => setValidationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans"
                    placeholder="Ex: 15"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Defina o período em dias que a proposta e os preços sugeridos são vigentes.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Prazo de Entrega do Projeto (Dias úteis)</label>
                  <input 
                    type="number"
                    min="1"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-sans"
                    placeholder="Ex: 30"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Prazo em dias úteis ou corridos estimado para a entrega total do escopo listado.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 3: Características do Livro */}
            <div className="mt-6 border-t border-slate-200 pt-6 space-y-4 font-sans text-left">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-[#E21B79]" />
                Características do Livro (Opcional - Para Serviços)
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Descrição das características do livro</label>
                <textarea 
                  value={bookFeaturesDescription}
                  onChange={(e) => setBookFeaturesDescription(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-sans h-24 placeholder-slate-300"
                  placeholder="Descreva as características do livro (Ex: formato, número de páginas, tipo de papel, acabamento, etc.)"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Esta descrição ficará no PDF no lugar de "Pacote Editorial / Tudo o que você precisa para ter seu livro pronto para impressão e venda" se houver insumos do tipo serviço na proposta.
                </p>
              </div>
            </div>

            {/* Seção 4: Detalhes de Aprovação e Parcelamento */}
            {isApprovedStatus && (
              <div className="mt-6 border-t border-slate-200 pt-6 space-y-4 font-sans text-left bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Fechamento e Pagamento Aprovado pelo Cliente
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Valor Final Fechado/Aprovado (R$) <span className="text-red-500">*</span></label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-400 text-sm font-semibold">R$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={approvedValue !== undefined ? approvedValue : ''}
                        onChange={(e) => setApprovedValue(e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                        className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800 bg-white"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Valor final negociado (Preço sugerido: R$ {currentSellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
                    </p>
                  </div>
 
                  <div>
                    <AutocompleteSelect
                      label="Forma de Pagamento Combinada"
                      required
                      options={[
                        { value: 'Pix', label: 'Pix (À vista)', sublabel: 'Pagamento instantâneo via QR Code ou Chave' },
                        { value: 'Pix parcelado', label: 'Pix Parcelado', sublabel: 'Pagamento via PIX dividido em parcelas mensais' },
                        { value: 'Cartão de Crédito', label: 'Cartão de Crédito (À vista)', sublabel: 'Pagamento em 1x no cartão' },
                        { value: 'Cartão de Crédito Parcelado', label: 'Cartão de Crédito Parcelado', sublabel: 'Pagamento parcelado no cartão' },
                        { value: 'Boleto Bancário', label: 'Boleto Bancário', sublabel: 'Emissão de boleto para pagamento' },
                        { value: 'Transferência Bancária / TED', label: 'Transferência Bancária / TED', sublabel: 'Depósito ou transferência direta' },
                        { value: 'Entrada + Parcelas', label: 'Entrada + Parcelas', sublabel: 'Sinal de entrada e saldo em parcelas' },
                        { value: 'Outro', label: 'Outro', sublabel: 'Condição personalizada ou troca' },
                      ]}
                      value={approvedPaymentMethod}
                      onChange={(val) => setApprovedPaymentMethod(val)}
                      placeholder="-- Selecione a Forma de Pagamento --"
                      searchPlaceholder="Pesquisar forma de pagamento..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Data de Aprovação <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={approvedDate}
                      onChange={(e) => setApprovedDate(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-semibold bg-white"
                      required
                    />
                  </div>
                </div>

                {(approvedPaymentMethod === 'Cartão de Crédito Parcelado' || approvedPaymentMethod === 'Entrada + Parcelas' || approvedPaymentMethod === 'Pix parcelado' || approvedPaymentMethod === 'Outro') && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Detalhamento de Entrada / Parcelas acordadas <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Ex: Entrada de R$ 1.500,00 no Pix + 10x de R$ 432,00 no cartão"
                      value={approvedInstallmentsDetails}
                      onChange={(e) => setApprovedInstallmentsDetails(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 bg-white placeholder-slate-400 font-semibold"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Seção de botões de Ação */}
            <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col items-stretch md:items-end gap-3 font-sans">
              <button 
                onClick={handleSaveProposal}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto justify-center cursor-pointer"
              >
                <Save size={18} />
                {editingProposalId ? 'Salvar Alterações' : 'Salvar Proposta Oficial'}
              </button>

              <button 
                disabled={!proposalName.trim() || items.length === 0}
                type="button"
                onClick={() => {
                  if (proposalName.trim() && items.length > 0) {
                    const currentProp: Proposal = {
                      id: editingProposalId || Date.now(),
                      name: proposalName,
                      projectType,
                      date: new Date().toLocaleDateString('pt-BR'),
                      items: [...items],
                      totalCost: currentTotalCost,
                      sellPrice: currentSellPrice,
                      status: 'Em desenvolvimento',
                      paymentMethodCash,
                      paymentMethodInstallments,
                      paymentDiscountPercent,
                      paymentEntryPercent,
                      paymentInstallments: cardInstallmentOptions[0]?.installments || paymentInstallments || 10,
                      paymentInterestPercent: cardInstallmentOptions[0]?.interestPercent != null ? cardInstallmentOptions[0].interestPercent : paymentInterestPercent,
                      cardInstallmentOptions,
                      paymentDirectTerms,
                      paymentCustomText,
                      validationDays,
                      deliveryDays,
                      bookFeaturesDescription,
                      markupMultiplier,
                      leadId: (selectedLeadId && selectedLeadId !== '') ? Number(selectedLeadId) : undefined,
                      clientName: clientName.trim() || undefined,
                      clientPhone: clientPhone.trim() || undefined
                    };
                    setSelectedProposalForPDF(currentProp);
                  }
                }}
                className={`flex items-center gap-2 justify-center py-3.5 px-8 rounded-lg font-bold text-lg shadow-md transition-all duration-200 w-full md:w-auto text-white cursor-pointer ${
                  (proposalName.trim() && items.length > 0) 
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-[0.98]' 
                    : 'bg-red-350 cursor-not-allowed opacity-60'
                }`}
                title={(proposalName.trim() && items.length > 0) ? "Baixar ou Imprimir Proposta de Valor em PDF" : "Defina o nome da proposta e adicione itens para habilitar o PDF"}
              >
                <FileText size={20} />
                Imprimir Proposta (PDF)
              </button>

              <button 
                disabled={!proposalName.trim() || items.length === 0 || isValidatingConfig}
                type="button"
                onClick={async () => {
                  if (proposalName.trim() && items.length > 0) {
                    if (!clientName.trim() || !clientPhone.trim()) {
                      showNotification("Por favor, informe o Nome do Cliente e o WhatsApp para habilitar o envio.");
                      return;
                    }

                    setIsValidatingConfig(true);
                    const isConfigValid = await validateWhatsAppConfig();
                    setIsValidatingConfig(false);

                    if (!isConfigValid) return;

                    const currentProp: Proposal = {
                      id: editingProposalId || Date.now(),
                      name: proposalName,
                      projectType,
                      date: new Date().toLocaleDateString('pt-BR'),
                      items: [...items],
                      totalCost: currentTotalCost,
                      sellPrice: currentSellPrice,
                      status: 'Em desenvolvimento',
                      paymentDiscountPercent,
                      paymentEntryPercent,
                      paymentInstallments: cardInstallmentOptions[0]?.installments || paymentInstallments || 10,
                      paymentInterestPercent: cardInstallmentOptions[0]?.interestPercent != null ? cardInstallmentOptions[0].interestPercent : paymentInterestPercent,
                      cardInstallmentOptions,
                      paymentDirectTerms,
                      paymentCustomText,
                      validationDays,
                      deliveryDays,
                      bookFeaturesDescription,
                      markupMultiplier,
                      leadId: (selectedLeadId && selectedLeadId !== '') ? Number(selectedLeadId) : undefined,
                      clientName: clientName.trim(),
                      clientPhone: clientPhone.trim()
                    };
                    setSelectedProposalForPDF({
                      ...currentProp,
                      triggerWhatsAppOnMount: true
                    });
                  }
                }}
                className={`flex items-center gap-2 justify-center py-3.5 px-8 rounded-lg font-bold text-lg shadow-md transition-all duration-200 w-full md:w-auto text-white cursor-pointer ${
                  (proposalName.trim() && items.length > 0) 
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]' 
                    : 'bg-emerald-350 cursor-not-allowed opacity-60'
                }`}
                title={(proposalName.trim() && items.length > 0) ? "Gerar PDF e Enviar Proposta comercial via WhatsApp para o cliente" : "Defina o nome da proposta e adicione itens para habilitar o envio por WhatsApp"}
              >
                {isValidatingConfig ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
                {isValidatingConfig ? 'Validando API...' : 'Enviar Proposta (WhatsApp)'}
              </button>
              
              {(!proposalName.trim() || items.length === 0) && (
                <p className="text-[11px] text-slate-400 italic text-center md:text-right font-medium">
                  * Dê um nome ao seu projeto e adicione itens de insumos para habilitar a visualização e impressão do PDF.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Render PDF Modal inside Editor View if triggered */}
        {selectedProposalForPDF && (
          <PropostaPDFModal 
            proposal={selectedProposalForPDF} 
            onClose={() => setSelectedProposalForPDF(null)} 
          />
        )}
      </div>
    );
  }

  // 1. Filter proposals
  const filteredProposals = proposals.filter(prop => {
    const statusLower = (prop.status || '').toLowerCase().trim();
    const isApproved = (statusLower === 'aprovada' || statusLower === 'aprovadas' || statusLower.includes('aprovad')) && !statusLower.includes('não') && !statusLower.includes('nao') && !statusLower.includes('reprovad') && !statusLower.includes('recusad');
    
    if (showOnlyApproved) {
      if (!isApproved) {
        return false;
      }
    } else {
      if (isApproved) {
        return false;
      }
      const isNotApproved = statusLower === 'não aprovada' || statusLower === 'não aprovadas' || statusLower === 'reprovada' || statusLower === 'recusada';
      if (isNotApproved && filterStatus === 'Todos') {
        return false;
      }
    }

    // Search term (clientName or proposal title/name)
    const matchesSearch = 
      prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prop.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    // Status filter
    const matchesStatus = showOnlyApproved ? true : (filterStatus === 'Todos' || prop.status === filterStatus);
    
    // Date range filter
    const effectiveDateStr = (showOnlyApproved && prop.approvedDate) ? prop.approvedDate : prop.date;
    const propDate = parseDate(effectiveDateStr);
    propDate.setHours(0, 0, 0, 0);
    
    let matchesStartDate = true;
    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      const localStartDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
      matchesStartDate = propDate >= localStartDate;
    }
    
    let matchesEndDate = true;
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      const localEndDate = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
      matchesEndDate = propDate <= localEndDate;
    }
    
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // 2. Group proposals by Month/Year
  const groups: { [key: string]: { label: string; proposals: Proposal[]; sortKey: string } } = {};
  
  filteredProposals.forEach(prop => {
    const effectiveDateStr = (showOnlyApproved && prop.approvedDate) ? prop.approvedDate : prop.date;
    const info = getMonthYearInfo(effectiveDateStr);
    if (!groups[info.key]) {
      groups[info.key] = {
        label: info.label,
        proposals: [],
        sortKey: info.key
      };
    }
    groups[info.key].proposals.push(prop);
  });
  
  // Sort proposals within each group by date descending (newest first)
  Object.keys(groups).forEach(key => {
    groups[key].proposals.sort((a, b) => {
      const dateAStr = (showOnlyApproved && a.approvedDate) ? a.approvedDate : a.date;
      const dateBStr = (showOnlyApproved && b.approvedDate) ? b.approvedDate : b.date;
      return parseDate(dateBStr).getTime() - parseDate(dateAStr).getTime();
    });
  });
  
  // Sort group keys descending (newest month first)
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {showOnlyApproved ? 'Propostas Aprovadas' : 'Lista de Propostas'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {showOnlyApproved 
              ? 'Projetos aprovados e fechados com os clientes, contendo os valores finais e formas de parcelamento acordadas.'
              : 'Histórico de projetos orçados. Use o Kanban para gerenciar o andamento.'}
          </p>
        </div>
        {!showOnlyApproved && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Criar Nova Proposta
          </button>
        )}
      </div>

      {/* Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end font-sans">
        <div className={`${showOnlyApproved ? 'md:col-span-7' : 'md:col-span-4'} space-y-1.5`}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Pesquisar</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente ou título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-slate-50/50 font-semibold"
            />
          </div>
        </div>

        {!showOnlyApproved && (
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <AutocompleteSelect
              options={[
                { value: 'Todos', label: 'Todos os Status', sublabel: 'Exibir todas as propostas em andamento' },
                ...statuses
                  .filter(st => {
                    const sLower = st.name.toLowerCase().trim();
                    const isApproved = (sLower === 'aprovada' || sLower === 'aprovadas' || sLower.includes('aprovad')) && !sLower.includes('não') && !sLower.includes('nao') && !sLower.includes('reprovad') && !sLower.includes('recusad');
                    return !isApproved;
                  })
                  .map(st => ({
                    value: st.name,
                    label: st.name
                  }))
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val || 'Todos')}
              placeholder="Filtrar por status..."
              searchPlaceholder="Pesquisar status..."
            />
          </div>
        )}

        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">De (Data)</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-slate-50/50 font-semibold"
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Até (Data)</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-slate-50/50 font-semibold"
          />
        </div>

        {(searchTerm || (!showOnlyApproved && filterStatus !== 'Todos') || filterStartDate || filterEndDate) && (
          <div className="md:col-span-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('Todos');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2.5 px-3 rounded-lg transition-colors cursor-pointer border border-slate-200"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      <div className="space-y-10">
        {proposals.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 max-w-full">
            <FileText size={48} className="mx-auto mb-4 opacity-50 text-slate-500" />
            <p className="font-semibold text-slate-600">Nenhuma proposta salva no banco de dados.</p>
            <p className="text-sm mt-2">
              {showOnlyApproved 
                ? 'Crie propostas e mude o status para aprovada no funil de vendas (Kanban).'
                : 'Clique no botão acima para começar seu primeiro orçamento.'}
            </p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 max-w-full">
            <Search size={48} className="mx-auto mb-4 opacity-40 text-slate-500" />
            <p className="font-semibold text-slate-600">
              {showOnlyApproved ? 'Nenhuma proposta aprovada encontrada.' : 'Nenhuma proposta encontrada.'}
            </p>
            <p className="text-sm mt-2 text-slate-500">
              {showOnlyApproved
                ? 'Certifique-se de mover suas propostas para o status "Aprovada" no painel de Kanban.'
                : 'Tente alterar os termos de pesquisa ou os filtros de status e data.'}
            </p>
          </div>
        ) : (
          sortedGroupKeys.map(groupKey => {
            const group = groups[groupKey];
            return (
              <div key={groupKey} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={18} className="text-amber-600" />
                    {group.label}
                  </h3>
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full font-bold">
                    {group.proposals.length} {group.proposals.length === 1 ? 'proposta' : 'propostas'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-4">
                  {group.proposals.map(prop => (
                    <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row overflow-hidden min-h-[140px]">
                      {/* Left Part: White Background (Name, Client, Date & Status, Payment info) */}
                      <div className="p-5 flex-1 flex flex-col justify-between bg-white space-y-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {showOnlyApproved && prop.approvedDate ? (
                              <>
                                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 font-sans" title="Data de Aprovação">
                                  Aprovado: {prop.approvedDate}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 font-sans" title="Data de Criação">
                                  Criado em: {prop.date}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100">{prop.date}</span>
                            )}
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {prop.status || 'Sem status'}
                            </span>
                            {prop.projectType === 'cultural' ? (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                                Projeto Cultural
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Projeto Editorial
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-lg text-slate-800 line-clamp-2" title={prop.name}>{prop.name}</h3>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {prop.clientName && (
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-50/80 border border-slate-100 rounded-lg px-2.5 py-1.5 w-fit">
                              <span className="text-slate-400">Cliente:</span>
                              <strong className="text-slate-700 font-bold">{prop.clientName}</strong>
                            </div>
                          )}
                          
                          {prop.approvedPaymentMethod && (
                            <div className="text-[11px] text-emerald-700 bg-emerald-50/50 border border-emerald-100/50 rounded-lg px-2.5 py-1.5 w-fit font-semibold flex flex-wrap items-center gap-1.5">
                              <span>Pgto: <strong className="font-bold">{prop.approvedPaymentMethod}</strong></span>
                              {prop.approvedInstallmentsDetails && (
                                <span className="text-[10px] text-emerald-600 italic border-l border-emerald-200 pl-2">
                                  {prop.approvedInstallmentsDetails}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Part: Blue Background (Items, Cost, Selling Price, Actions) */}
                      <div className="bg-blue-950 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 md:w-[60%] lg:w-[55%] xl:w-[50%]">
                        {/* Center/Stats Info: Items & Cost */}
                        <div className="flex flex-row md:flex-col justify-between md:justify-center gap-4 text-sm py-2 md:py-0 px-1 min-w-[120px] border-b md:border-b-0 border-blue-900/40 pb-4 md:pb-0">
                          <div>
                            <span className="text-blue-300/80 block text-[11px] uppercase tracking-wider font-bold mb-0.5">Itens</span>
                            <span className="font-bold text-white text-base">{prop.items.length} {prop.items.length === 1 ? 'item' : 'itens'}</span>
                          </div>
                          <div className="md:mt-3">
                            <span className="text-blue-300/80 block text-[11px] uppercase tracking-wider font-bold mb-0.5">Custo Estimado</span>
                            <span className="font-semibold text-blue-100 font-mono text-base">R$ {prop.totalCost.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Value Info: Approved Value / Sell Price */}
                        <div className="bg-blue-900/40 rounded-xl px-4 py-3.5 min-w-[170px] flex flex-col justify-center border border-blue-900/50">
                          <span className="text-blue-300/80 text-[11px] uppercase tracking-wider font-bold mb-0.5">Valor de Venda</span>
                          <span className="text-2xl font-black text-amber-400 font-mono">
                            R$ {(prop.approvedValue !== undefined ? prop.approvedValue : prop.sellPrice).toFixed(2)}
                          </span>
                        </div>

                        {/* Right Actions: PDF, WhatsApp, Edit, Delete */}
                        <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2 pt-2 md:pt-0">
                          <button 
                            onClick={() => setSelectedProposalForPDF(prop)} 
                            className="bg-red-500/15 hover:bg-red-500/25 text-red-200 hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-red-500/30 w-full md:w-auto justify-center"
                            title="Visualizar Proposta Comercial em PDF / Imprimir"
                          >
                            <Printer size={15}/> 
                            <span className="uppercase text-[10px] tracking-wider">PDF</span>
                          </button>
                          
                          <button 
                            disabled={isValidatingConfig}
                            onClick={async () => {
                              if (!prop.clientPhone) {
                                showNotification("Esta proposta não tem o WhatsApp do cliente cadastrado. Edite a proposta para cadastrar.");
                                return;
                              }

                              setIsValidatingConfig(true);
                              const isConfigValid = await validateWhatsAppConfig();
                              setIsValidatingConfig(false);

                              if (!isConfigValid) return;

                              setSelectedProposalForPDF({
                                ...prop,
                                triggerWhatsAppOnMount: true
                              });
                            }} 
                            className={`bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 w-full md:w-auto justify-center ${isValidatingConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Enviar Proposta Comercial em PDF via WhatsApp"
                          >
                            {isValidatingConfig ? (
                              <Loader2 className="animate-spin" size={15}/>
                            ) : (
                              <Send size={15}/> 
                            )}
                            <span className="uppercase text-[10px] tracking-wider">
                              {isValidatingConfig ? 'VALIDANDO...' : 'WHATSAPP'}
                            </span>
                          </button>

                          <div className="flex gap-1 ml-auto md:ml-0 md:mt-2 lg:mt-0">
                            <button 
                              onClick={() => handleEditProposal(prop)} 
                              className="text-blue-200 hover:text-white hover:bg-blue-900/60 border border-transparent hover:border-blue-800 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil size={15}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteProposal(prop.id)} 
                              className="text-blue-200 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Apagar"
                            >
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PDF Modal Triggered conditionally */}
      {selectedProposalForPDF && (
        <PropostaPDFModal 
          proposal={selectedProposalForPDF} 
          onClose={() => setSelectedProposalForPDF(null)} 
          settings={settings}
        />
      )}
    </div>
  );
}
