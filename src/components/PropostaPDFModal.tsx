import React from 'react';
import { X, Printer, FileText, Send, Loader2, Mail } from 'lucide-react';
import { Proposal, IntegrationSetting, CardInstallmentOption, getInstallmentScheduleText } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper function to wait for all images inside an element to load
const waitForImages = (element: HTMLElement): Promise<void> => {
  const imgs = Array.from(element.querySelectorAll('img'));
  const promises = imgs.map((img) => {
    if (img.complete) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Avoid blocking indefinitely if one fails
    });
  });
  return Promise.all(promises).then(() => {});
};

// Helper functions to parse and convert oklch colors to rgb to prevent html2canvas crashes
function oklchToRgb(lchString: string): string {
  // Strip "oklch(" and ")"
  const inner = lchString.replace(/oklch\(/i, '').replace(/\)/, '').trim();
  // Split by slash first to separate alpha
  const partsWithAlpha = inner.split('/');
  const colorPart = partsWithAlpha[0].trim();
  const alphaPart = partsWithAlpha[1] ? partsWithAlpha[1].trim() : null;

  // Split color part by space or comma
  const colorTokens = colorPart.split(/[\s,]+/);
  if (colorTokens.length < 3) return lchString;

  let L_str = colorTokens[0];
  let C_str = colorTokens[1];
  let H_str = colorTokens[2];

  let L = L_str.endsWith('%') ? parseFloat(L_str) / 100 : parseFloat(L_str);
  let C = parseFloat(C_str);
  let H = H_str.endsWith('rad') ? parseFloat(H_str) * (180 / Math.PI) : parseFloat(H_str);
  if (H_str.endsWith('deg')) {
    H = parseFloat(H_str);
  }
  
  let alpha = 1;
  if (alphaPart) {
    alpha = alphaPart.endsWith('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
  }

  // Fallbacks for NaN
  if (isNaN(L)) L = 0.5;
  if (isNaN(C)) C = 0;
  if (isNaN(H)) H = 0;
  if (isNaN(alpha)) alpha = 1;

  const hRad = H * (Math.PI / 180);
  const lab_a = C * Math.cos(hRad);
  const lab_b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * lab_a + 0.2158037573 * lab_b;
  const m_ = L - 0.1055613458 * lab_a - 0.0638541728 * lab_b;
  const s_ = L - 0.0894841775 * lab_a - 1.2914855480 * lab_b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const fn = (c: number) => {
    if (c <= 0.0031308) {
      return 12.92 * c;
    } else {
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }
  };

  const rVal = Math.round(Math.max(0, Math.min(1, fn(rLin))) * 255);
  const gVal = Math.round(Math.max(0, Math.min(1, fn(gLin))) * 255);
  const bVal = Math.round(Math.max(0, Math.min(1, fn(bLin))) * 255);

  if (alpha === 1) {
    return `rgb(${rVal}, ${gVal}, ${bVal})`;
  } else {
    return `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
  }
}

function oklabToRgb(labString: string): string {
  // Strip "oklab(" and ")"
  const inner = labString.replace(/oklab\(/i, '').replace(/\)/, '').trim();
  // Split by slash first to separate alpha
  const partsWithAlpha = inner.split('/');
  const colorPart = partsWithAlpha[0].trim();
  const alphaPart = partsWithAlpha[1] ? partsWithAlpha[1].trim() : null;

  // Split color part by space or comma
  const colorTokens = colorPart.split(/[\s,]+/);
  if (colorTokens.length < 3) return labString;

  let L_str = colorTokens[0];
  let a_str = colorTokens[1];
  let b_str = colorTokens[2];

  let L = L_str.endsWith('%') ? parseFloat(L_str) / 100 : parseFloat(L_str);
  let lab_a = parseFloat(a_str);
  let lab_b = parseFloat(b_str);

  let alpha = 1;
  if (alphaPart) {
    alpha = alphaPart.endsWith('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
  }

  // Fallbacks for NaN
  if (isNaN(L)) L = 0.5;
  if (isNaN(lab_a)) lab_a = 0;
  if (isNaN(lab_b)) lab_b = 0;
  if (isNaN(alpha)) alpha = 1;

  const l_ = L + 0.3963377774 * lab_a + 0.2158037573 * lab_b;
  const m_ = L - 0.1055613458 * lab_a - 0.0638541728 * lab_b;
  const s_ = L - 0.0894841775 * lab_a - 1.2914855480 * lab_b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const fn = (c: number) => {
    if (c <= 0.0031308) {
      return 12.92 * c;
    } else {
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }
  };

  const rVal = Math.round(Math.max(0, Math.min(1, fn(rLin))) * 255);
  const gVal = Math.round(Math.max(0, Math.min(1, fn(gLin))) * 255);
  const bVal = Math.round(Math.max(0, Math.min(1, fn(bLin))) * 255);

  if (alpha === 1) {
    return `rgb(${rVal}, ${gVal}, ${bVal})`;
  } else {
    return `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
  }
}

function replaceOklchWithRgb(str: string): string {
  if (typeof str !== 'string') return str;
  let result = str;
  if (result.toLowerCase().includes('oklch')) {
    const globalOklchRegex = /oklch\(([^)]+)\)/gi;
    result = result.replace(globalOklchRegex, (match) => {
      try {
        return oklchToRgb(match);
      } catch (e) {
        console.warn("Failed to convert oklch to rgb:", match, e);
        return 'rgb(30, 41, 59)';
      }
    });
  }
  if (result.toLowerCase().includes('oklab')) {
    const globalOklabRegex = /oklab\(([^)]+)\)/gi;
    result = result.replace(globalOklabRegex, (match) => {
      try {
        return oklabToRgb(match);
      } catch (e) {
        console.warn("Failed to convert oklab to rgb:", match, e);
        return 'rgb(30, 41, 59)';
      }
    });
  }
  return result;
}

interface PropostaPDFModalProps {
  proposal: Proposal & { triggerWhatsAppOnMount?: boolean };
  onClose: () => void;
  isSendingOnly?: boolean;
  settings?: IntegrationSetting[];
}

export default function PropostaPDFModal({ 
  proposal, 
  onClose, 
  isSendingOnly = false,
  settings = []
}: PropostaPDFModalProps) {
  const sellPrice = proposal.sellPrice || 0;
  const projectType = proposal.projectType || 'editorial';
  
  // Extract payment options with safe fallbacks
  const entryPercent = proposal.paymentEntryPercent !== undefined ? proposal.paymentEntryPercent : 50;
  const installments = proposal.paymentInstallments !== undefined ? proposal.paymentInstallments : 10;
  const interestPercent = proposal.paymentInterestPercent !== undefined ? proposal.paymentInterestPercent : 10;
  const cardInstallmentOptions: CardInstallmentOption[] = (proposal.cardInstallmentOptions && proposal.cardInstallmentOptions.length > 0)
    ? proposal.cardInstallmentOptions
    : [{
        installments: proposal.paymentInstallments !== undefined ? proposal.paymentInstallments : 10,
        interestPercent: proposal.paymentInterestPercent !== undefined ? proposal.paymentInterestPercent : 10
      }];
  const paymentDirectTerms = proposal.paymentDirectTerms || '';
  const customText = proposal.paymentCustomText || '';
  const paymentMethodCash = proposal.paymentMethodCash !== undefined ? proposal.paymentMethodCash : true;
  const paymentMethodInstallments = proposal.paymentMethodInstallments !== undefined ? proposal.paymentMethodInstallments : true;
  const paymentDiscountPercent = proposal.paymentDiscountPercent !== undefined ? proposal.paymentDiscountPercent : 5;

  // Extract separate product options (quantities) for dynamic pricing split
  const items = proposal.items || [];
  const serviceItems = items.filter(item => item.type !== 'produto');
  const productItems = items.filter(item => item.type === 'produto');

  const hasProducts = productItems.length > 0;
  const hasServices = serviceItems.length > 0;

  const totalServicesCost = serviceItems.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  const markupMultiplier = proposal.markupMultiplier !== undefined 
    ? proposal.markupMultiplier 
    : (proposal.sellPrice && proposal.totalCost ? (proposal.sellPrice / proposal.totalCost) : 1);

  interface ProductOption {
    id: number;
    qty: number;
    sellPrice: number;
    unitPrice: number;
    multiplier?: number;
    baseCost?: number;
    shippingCost?: number;
  }

  const productOptions: ProductOption[] = productItems.map(item => {
    const optionSellPrice = item.cost * item.qty;
    return {
      id: item.id || Date.now() + Math.random(),
      qty: item.qty,
      sellPrice: optionSellPrice,
      unitPrice: item.qty > 0 ? (optionSellPrice / item.qty) : 0,
      multiplier: item.multiplier,
      baseCost: item.baseCost,
      shippingCost: item.shippingCost
    };
  });

  // Helper to get limit validation date
  const getValidationDate = () => {
    try {
      if (proposal.validityDate) {
        return proposal.validityDate;
      }
      const vDays = proposal.validationDays !== undefined ? proposal.validationDays : 15;
      const baseDateStr = proposal.date || new Date().toLocaleDateString('pt-BR');
      
      const parts = baseDateStr.split('/');
      let baseDate = new Date();
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const year = parseInt(parts[2], 10);
        baseDate = new Date(year, month, day);
      }
      
      baseDate.setDate(baseDate.getDate() + vDays);
      return baseDate.toLocaleDateString('pt-BR');
    } catch {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 15);
      return baseDate.toLocaleDateString('pt-BR');
    }
  };

  // Calculations
  const valorEntrada = sellPrice * (entryPercent / 100);
  const valorEntrega = sellPrice * (1 - entryPercent / 100);
  const valorTotalComJuros = sellPrice * (1 + (interestPercent / 100));
  const valorParcelas = valorTotalComJuros / installments;

  const [logoBase64, setLogoBase64] = React.useState<string>('');

  React.useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch('/api/logo-npe');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              setLogoBase64(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        } else {
          // If response is HTML or not ok (e.g. running on Vercel), fall back to direct external image
          console.log("Servidor Express não detectado para logo-npe, usando fallback de imagem direta.");
        }
      } catch (e) {
        console.error('Failed to load logo as base64:', e);
      }
    };
    loadLogo();
  }, []);

  const [isSendingInProgress, setIsSendingInProgress] = React.useState(false);
  const [progressStep, setProgressStep] = React.useState('Aguardando...');
  const [sendingStatus, setSendingStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  // Email sending states
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [destEmail, setDestEmail] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState(`Proposta Comercial - ${proposal.name}`);
  const [emailBody, setEmailBody] = React.useState(`Olá ${proposal.clientName || 'Prezado(a)'},\n\nSegue em anexo a proposta comercial detalhada em PDF para o projeto "${proposal.name}" da Editora NPE.\n\nFicamos à total disposição para esclarecer qualquer dúvida e alinhar os próximos passos.\n\nAtenciosamente,\nEquipe Editora NPE`);
  const [isEmailSending, setIsEmailSending] = React.useState(false);
  const [emailSendingStatus, setEmailSendingStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');

  const generatePDFDocument = async (): Promise<{ pdfBase64: string; cleanFileName: string }> => {
    setProgressStep('Aguardando carregamento dos logotipos...');
    const sheet = document.getElementById('print-section');
    if (!sheet) {
      throw new Error('Erro técnico: Área de impressão da proposta não encontrada no DOM.');
    }

    // Wait for all images inside the sheet (e.g. logos) to be fully loaded and cached by the browser
    await waitForImages(sheet);

    setProgressStep('Iniciando compilação do PDF comercial...');

    // 1. Create a clean offscreen clone of the entire print section
    const clone = sheet.cloneNode(true) as HTMLElement;
    clone.id = 'print-section-clone';
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.width = '794px'; // Standard A4 pixel width at 96 DPI
    clone.style.height = 'auto';
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
    clone.style.gap = '0';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.boxSizing = 'border-box';
    clone.style.zIndex = '-9999';
    clone.style.opacity = '0.02'; // Render within the active viewport, but invisible to ensure perfect browser layout calculations
    clone.style.pointerEvents = 'none';

    // Format each page inside the clone to have pristine A4 dimensions and remove screen border/shadow styling
    const clonedPages = clone.querySelectorAll('.print-page');
    clonedPages.forEach((p) => {
      const pageEl = p as HTMLElement;
      pageEl.style.width = '794px';
      pageEl.style.height = '1123px'; // Standard A4 pixel height at 96 DPI
      pageEl.style.margin = '0';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.position = 'relative';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';
      pageEl.style.backgroundColor = '#FAF8F5';
      pageEl.style.boxShadow = 'none';
      pageEl.style.border = 'none';
      pageEl.style.borderRadius = '0';
    });

    document.body.appendChild(clone);

    // Proxy the global getComputedStyle during rendering to safely intercept and replace oklch/oklab colors
    const mainGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = mainGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                return replaceOklchWithRgb(val);
              }
              return val;
            };
          }
          const val = Reflect.get(target, prop);
          if (typeof val === 'function') {
            return val.bind(target);
          }
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return replaceOklchWithRgb(val);
          }
          return val;
        }
      });
    };

    const pdf = new jsPDF('p', 'mm', 'a4');

    try {
      // 2. Loop through each cloned print page and capture it as an individual high-quality canvas
      for (let i = 0; i < clonedPages.length; i++) {
        setProgressStep(`Renderizando página ${i + 1} de ${clonedPages.length}...`);
        const pageEl = clonedPages[i] as HTMLElement;

        // Ensure all images in the cloned element are also fully loaded before capturing
        await waitForImages(pageEl);

        const pageCanvas = await html2canvas(pageEl, {
          scale: 2.5, // 2.5x scale for ultra crisp text and vector elements
          useCORS: true,
          logging: false,
          backgroundColor: '#FAF8F5',
          onclone: (clonedDoc) => {
            // Replace oklch/oklab colors inside all style tags to prevent html2canvas crash
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((styleTag) => {
              if (styleTag.textContent) {
                styleTag.textContent = replaceOklchWithRgb(styleTag.textContent);
              }
            });

            // Replace oklch/oklab colors inside any inline style attributes
            const elementsWithStyle = clonedDoc.querySelectorAll('[style]');
            elementsWithStyle.forEach((el) => {
              const styleAttr = el.getAttribute('style');
              if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
                el.setAttribute('style', replaceOklchWithRgb(styleAttr));
              }
            });
          }
        });

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297);
      }
    } finally {
      // Restore standard styles and clean up the clone
      window.getComputedStyle = mainGetComputedStyle;
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }

    setProgressStep('Preparando payload base64...');
    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    // Download the PDF file locally for the user, so they always have a copy!
    setProgressStep('Salvando cópia local do PDF comercial...');
    const cleanFileName = `Proposta_${proposal.name.replace(/\s+/g, '_')}.pdf`;
    pdf.save(cleanFileName);

    return { pdfBase64, cleanFileName };
  };

  const sendProposalWhatsApp = async (pdfBase64: string, cleanFileName: string) => {
    const clientName = proposal.clientName || 'Cliente';
    const clientPhone = proposal.clientPhone;
    
    if (!clientPhone) {
      throw new Error('Nenhum número de WhatsApp cadastrado nesta proposta.');
    }
    
    let formattedPhone = clientPhone.replace(/\D/g, '');
    if (formattedPhone.length === 11 || formattedPhone.length === 10) {
      formattedPhone = '55' + formattedPhone;
    }
    if (formattedPhone.length < 10) {
      throw new Error(`Número de WhatsApp inválido: ${clientPhone}. Por favor, insira o número com DDD.`);
    }

    setProgressStep('Enviando proposta via WhatsApp...');
    
    const whatsappConfig = settings?.find(s => s.id === 'whatsapp');

    const payload = {
      number: formattedPhone,
      media: pdfBase64,
      fileName: cleanFileName,
      caption: `Olá *${clientName}*, segue em anexo a proposta de valores para o projeto *${proposal.name}*!`,
      config: whatsappConfig
    };

    let useFallback = false;
    try {
      const response = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html') || response.status === 404) {
        useFallback = true;
      } else if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errData.error || `Erro do servidor EvolutionAPI: ${response.status}`);
      }
    } catch (err: any) {
      if (err.message?.includes('JSON') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch')) {
        useFallback = true;
      } else {
        throw err;
      }
    }

    if (useFallback) {
      console.log("Servidor Express não detectado (provavelmente hospedado no Vercel). Usando fallback direto do cliente para envio de WhatsApp...");
      
      const evoApiKey = (whatsappConfig?.apiKey || "1E854FFD3939-4236-845F-2936F8B0D2DE").trim();
      let evoInstance = (whatsappConfig?.instanceName || "EditoraNPE2").trim();
      let evoApiUrl = (whatsappConfig?.apiUrl || "https://evoapi.agentenpe.com.br").trim();

      if (evoInstance === evoApiKey || (evoInstance.includes("-") && evoInstance.length === 35)) {
        evoInstance = "EditoraNPE2";
      }

      if (!evoApiUrl.includes("/message/sendMedia")) {
        const baseUrl = evoApiUrl.replace(/\/$/, "");
        evoApiUrl = `${baseUrl}/message/sendMedia/${evoInstance}`;
      }

      const directPayload = {
        number: formattedPhone,
        mediatype: "document",
        media: pdfBase64,
        fileName: cleanFileName,
        caption: `Olá *${clientName}*, segue em anexo a proposta de valores para o projeto *${proposal.name}*!`
      };

      const directResponse = await fetch(evoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evoApiKey
        },
        body: JSON.stringify(directPayload)
      });

      if (!directResponse.ok) {
        const errText = await directResponse.text();
        throw new Error(`Erro retornado pela Evolution API direta (${directResponse.status}): ${errText}`);
      }
    }
  };

  const sendProposalEmail = async (pdfBase64: string, cleanFileName: string, targetEmail: string) => {
    const emailConfig = settings?.find(s => s.id === 'email');
    if (!emailConfig || !emailConfig.smtpHost || !emailConfig.smtpUser || !emailConfig.smtpPass) {
      throw new Error('Servidor de E-mail (SMTP) não configurado no sistema. Por favor, configure-o primeiro na aba Configurações.');
    }

    setProgressStep('Enviando proposta por e-mail...');

    const payload = {
      to: targetEmail,
      media: pdfBase64,
      fileName: cleanFileName,
      subject: emailSubject,
      body: emailBody,
      config: emailConfig
    };

    let useFallback = false;
    try {
      const response = await fetch('/api/send-proposal-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html') || response.status === 404) {
        useFallback = true;
      } else if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errData.error || `Erro do servidor de e-mail SMTP: ${response.status}`);
      }
    } catch (err: any) {
      if (err.message?.includes('JSON') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch')) {
        useFallback = true;
      } else {
        throw err;
      }
    }

    if (useFallback) {
      throw new Error("O envio de e-mails via SMTP necessita do servidor Express rodando (atualmente não disponível neste ambiente de hospedagem estática). Por favor, envie a proposta por WhatsApp ou faça o download do PDF para enviar manualmente.");
    }
  };

  const triggerEmailSendFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destEmail) return;

    setIsEmailSending(true);
    setEmailSendingStatus('sending');
    setEmailErrorMessage('');

    try {
      const { pdfBase64, cleanFileName } = await generatePDFDocument();
      await sendProposalEmail(pdfBase64, cleanFileName, destEmail.trim());

      setEmailSendingStatus('success');
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSendingStatus('idle');
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setEmailSendingStatus('error');
      setEmailErrorMessage(error?.message || 'Erro desconhecido ao gerar ou enviar o e-mail.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const triggerSendFlow = async () => {
    setSendingStatus('sending');
    setIsSendingInProgress(true);
    setErrorMessage('');
    
    try {
      // Phase 1: Generate PDF Document Synchronously
      const { pdfBase64, cleanFileName } = await generatePDFDocument();

      // Phase 2: Send via WhatsApp (only triggered upon successful completion of PDF generation)
      await sendProposalWhatsApp(pdfBase64, cleanFileName);

      setSendingStatus('success');
      setProgressStep('Proposta enviada com sucesso!');
    } catch (error: any) {
      console.error(error);
      setSendingStatus('error');
      setErrorMessage(error?.message || 'Erro desconhecido ao gerar ou enviar o PDF.');
    } finally {
      setIsSendingInProgress(false);
    }
  };

  // Run automatically if rendering in sendingOnly mode or if triggerWhatsAppOnMount is requested
  React.useEffect(() => {
    if (isSendingOnly || proposal.triggerWhatsAppOnMount) {
      const timer = setTimeout(() => {
        triggerSendFlow();
      }, 400); // 400ms delay to ensure the DOM elements are fully painted and found
      return () => clearTimeout(timer);
    }
  }, [isSendingOnly, proposal.triggerWhatsAppOnMount]);

  const handlePrint = () => {
    const sheet = document.getElementById('print-section');
    if (!sheet) return;

    // Inject styles dynamically for the fallback native print layout
    const styleId = 'pdf-print-style';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      #printContainer {
        display: none;
      }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        body {
          background-color: #FAF8F5 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Hide entire React App root and all screen overlays */
        #root, .fixed, .no-print, #print-modal-wrapper {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        /* Setup the printable container at the top of the body */
        #printContainer {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: auto !important;
          background-color: #FAF8F5 !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        #print-section {
          gap: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          height: auto !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .print-page {
          width: 210mm !important;
          height: 297mm !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          margin: 0 auto !important;
          padding: 15mm !important;
          background-color: #FAF8F5 !important;
          box-sizing: border-box !important;
          page-break-after: always !important;
          break-after: page !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          position: relative !important;
        }
        .print-page:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .print-page .pointer-events-none {
          border-color: #cbd5e1 !important; /* slate-300 */
        }
      }
    `;

    // Hybrid Approach:
    // To bypass iframe sandbox constraints inside preview builders (which block window.print() inside iframes),
    // we open a clean top-level popup window, transfer the HTML + Styles, and run print() natively there.
    try {
      const printWindow = window.open('', '_blank', 'width=1000,height=1400');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }

      // Collect all current page styles & link sheets to preserve full styling
      let stylesHtml = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((styleEl) => {
        stylesHtml += styleEl.outerHTML;
      });

      // Inject custom adjustments inside the new clean window for seamless visual alignment
      stylesHtml += `
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: #FAF8F5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
            width: 100%;
            height: auto;
            display: flex;
            justify-content: center;
          }
          #print-section {
            gap: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            padding: 15mm !important;
            background-color: #FAF8F5 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .print-page .pointer-events-none {
            border-color: #cbd5e1 !important;
          }
        </style>
      `;

      // Copy the print element outer HTML
      const sheetHtml = sheet.outerHTML;

      // Draw the printing template
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Proposta Comercial - ${proposal.name}</title>
            <meta charset="utf-8">
            ${stylesHtml}
          </head>
          <body>
            <div>
              ${sheetHtml}
            </div>
            <script>
              window.addEventListener('load', () => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                  setTimeout(() => {
                    window.close();
                  }, 800);
                }, 300);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.warn('Popup blocked, executing fallback printing inside the active tab.', err);
      
      // Fallback: Populate native printContainer outside standard React deep node tree
      let container = document.getElementById('printContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'printContainer';
        document.body.appendChild(container);
      }

      container.innerHTML = '';
      const clone = sheet.cloneNode(true) as HTMLElement;
      clone.style.cssText = 'width: 100%; background-color: #FAF8F5; position: relative; box-sizing: border-box; display: flex; flex-direction: column;';
      container.appendChild(clone);

      window.focus();
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto sm:p-6" id="print-modal-wrapper">
      
      {/* Container Modificado para Centralizar e Organizar Controle */}
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] text-slate-100 animate-fade-in relative">
        
        {/* PROGRESS OVERLAY FOR ALL MODES */}
        {(isSendingOnly || proposal.triggerWhatsAppOnMount || isSendingInProgress || sendingStatus === 'success' || sendingStatus === 'error') && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-2xl animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center gap-4 text-slate-100 font-sans">
              {sendingStatus === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold text-3xl animate-bounce">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">Proposta Enviada!</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium">
                    A proposta comercial em PDF foi gerada, salva localmente e encaminhada com sucesso para o WhatsApp de <strong>{proposal.clientName}</strong> ({proposal.clientPhone}).
                  </p>
                  <button 
                    onClick={() => {
                      if (isSendingOnly || proposal.triggerWhatsAppOnMount) {
                        onClose();
                      } else {
                        setSendingStatus('idle');
                      }
                    }}
                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-lg hover:shadow-emerald-900/30 font-sans"
                  >
                    {isSendingOnly || proposal.triggerWhatsAppOnMount ? 'Concluir' : 'Voltar à Prévia'}
                  </button>
                </>
              ) : sendingStatus === 'error' ? (
                <>
                  <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center font-bold text-3xl">
                    ⚠️
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">Falha no Envio</h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-rose-950/20 p-3 rounded-lg border border-rose-900/30 text-left font-sans text-xs max-h-32 overflow-y-auto w-full font-medium">
                    {errorMessage || 'Erro inesperado ao gerar ou transmitir a proposta de valores via EvolutionAPI.'}
                  </p>
                  <div className="flex gap-3 w-full mt-2 font-sans">
                    <button 
                      onClick={() => {
                        if (isSendingOnly || proposal.triggerWhatsAppOnMount) {
                          onClose();
                        } else {
                          setSendingStatus('idle');
                          setErrorMessage('');
                        }
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl text-sm transition-all cursor-pointer font-sans"
                    >
                      {isSendingOnly || proposal.triggerWhatsAppOnMount ? 'Fechar' : 'Voltar'}
                    </button>
                    <button 
                      onClick={triggerSendFlow}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm transition-all cursor-pointer font-sans"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-[#E21B79]" size={48} />
                  <h3 className="text-lg font-bold text-white font-sans">{progressStep}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans font-semibold">
                    Compilando proposta comercial, gerando download de segurança e transmitindo via WhatsApp. Mantenha esta tela aberta.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Top Header of Modal (Screen Only) */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md rounded-t-2xl shrink-0 no-print">
          <div className="flex items-center gap-2">
            <FileText className="text-amber-500" size={20} />
            <span className="font-bold text-sm tracking-wide text-slate-200">PRÉVIA DO ORÇAMENTO PDF</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 duration-150 transition-all cursor-pointer"
            >
              <Printer size={16} />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Workspace Area (Screen Only) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-950 flex-1 flex justify-center">
          
          {/* THE PRINTED A4 SHEET CONTAINER */}
          {/* This element remains bounded and formatted beautifully on screen, and isolates itself as the only printed area */}
          <div 
            id="print-section" 
            className="w-full max-w-[21cm] text-slate-900 font-sans flex flex-col gap-8 items-center"
          >
            {/* PAGE 1: SERVIÇOS EDITORIAIS E CONDIÇÕES COMERCIAIS (Only shown if hasServices is true) */}
            {hasServices && (
              <div 
                className="print-page w-full bg-[#FAF8F5] text-slate-900 p-6 sm:p-10 shadow-2xl rounded-xl border border-slate-200 relative font-sans flex flex-col justify-between"
                style={{ height: '29.7cm', color: '#1e293b' }}
              >
                {/* Elegant Double Border Ornate Corner */}
                <div className="absolute inset-3 border-4 border-double border-slate-400/80 rounded-2xl pointer-events-none p-1">
                  <div className="absolute inset-0.5 border border-slate-350/50 rounded-[14px]"></div>
                </div>

                {/* Main Content inside Border */}
                <div className="relative z-10 flex-1 flex flex-col justify-between py-1.5 px-2 sm:py-2 sm:px-3">
                  
                  {/* BRAND LOGO HEADER */}
                  <div className="flex flex-col items-center text-center shrink-0">
                    <img 
                      src={logoBase64 || "https://editoranpe.com.br/wp-content/uploads/2026/06/Logo-Editora-NPE-scaled.png"} 
                      alt="Editora NPE" 
                      className="h-20 sm:h-24 w-auto object-contain select-none pb-1"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* CENTRAL VERTICAL GROUP */}
                  <div className="flex-1 flex flex-col justify-evenly my-auto space-y-3">
                    
                    {/* PROP HEADER SLOGAN */}
                    <div className="text-center px-4">
                      <h3 className="text-base sm:text-lg font-black text-indigo-950 tracking-normal uppercase leading-tight max-w-lg mx-auto">
                        {projectType === 'cultural' 
                          ? 'SEU INVESTIMENTO E CONDIÇÕES - PROJETO CULTURAL' 
                          : 'SEU INVESTIMENTO E CONDIÇÕES - SERVIÇOS EDITORIAIS'}
                      </h3>
                    </div>

                    {/* SECT 1: PACOTE EDITORIAL OU PROJETO CULTURAL */}
                    <div className="space-y-2">
                      {projectType === 'cultural' ? (
                        <div>
                          <div className="border-b border-indigo-100 pb-1 text-center sm:text-left mb-2">
                            <h4 className="text-xs sm:text-sm font-black text-[#E21B79] uppercase tracking-wide">
                              Detalhamento dos Itens do Projeto Cultural
                            </h4>
                            <p className="text-[10px] text-slate-500 font-serif italic leading-snug">
                              Descrição detalhada de cada item com o seu valor total correspondente
                            </p>
                          </div>

                          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden font-sans">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 text-[10px] uppercase tracking-wider font-bold">
                                  <th className="py-2 px-3">Item / Descrição do Serviço</th>
                                  <th className="py-2 px-2 text-center w-24">Qtd / Unidade</th>
                                  <th className="py-2 px-3 text-right w-36">Valor Total (R$)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {serviceItems.map((item, idx) => {
                                  const itemTotalVal = (item.cost * item.qty) * markupMultiplier;
                                  return (
                                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                      <td className="py-2 px-3 font-semibold text-slate-800 text-[11px]">
                                        {item.description}
                                      </td>
                                      <td className="py-2 px-2 text-center text-slate-600 text-[11px] font-medium">
                                        {item.qty} {item.unit || ''}
                                      </td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-900 text-[11px]">
                                        {formatCurrency(itemTotalVal)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-fuchsia-50/80 border-t-2 border-fuchsia-200 text-fuchsia-950 font-black text-[11px]">
                                  <td colSpan={2} className="py-2 px-3 uppercase tracking-wide">
                                    Somatória de Todos os Itens da Proposta
                                  </td>
                                  <td className="py-2 px-3 text-right text-[#E21B79] text-xs font-black">
                                    {formatCurrency(totalServicesCost * markupMultiplier)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="border-b border-indigo-100 pb-1 text-center sm:text-left">
                            <h4 className="text-xs sm:text-sm font-black text-[#E21B79] uppercase tracking-wide">
                              Pacote Editorial
                            </h4>
                            <p className="text-[10px] text-slate-500 font-serif italic leading-snug">
                              Tudo o que você precisa para ter seu livro pronto para impressão e venda
                            </p>
                          </div>

                          {/* HIGH-FIDELITY INTERACTIVE CARDS MAPPING */}
                          <div className="space-y-2 py-0.5">
                            {(() => {
                              const hasRevision = serviceItems.some(item => 
                                /revis/i.test(item.description)
                              );
                              
                              const hasDiagramacao = serviceItems.some(item => 
                                /diagrama/i.test(item.description)
                              );
                              
                              const hasCapa = serviceItems.some(item => 
                                /capa/i.test(item.description)
                              );
                              
                              const hasBurocracia = serviceItems.some(item => 
                                /isbn|ficha|catalog|direitos|direito/i.test(item.description)
                              );

                              // Other items that don't fall into the beautiful categories
                              const otherItems = serviceItems.filter(item => 
                                !/revis/i.test(item.description) &&
                                !/diagrama/i.test(item.description) &&
                                !/capa/i.test(item.description) &&
                                !/isbn|ficha|catalog|direitos|direito/i.test(item.description)
                              );

                              return (
                                <div className="space-y-2">
                                  {hasRevision && (
                                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 flex gap-2.5 text-left items-start">
                                      <div className="text-[#E21B79] bg-pink-50 rounded-full w-7 h-7 flex items-center justify-center shrink-0 border border-pink-100 mt-0.5">
                                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-slate-900 text-xs leading-tight flex flex-wrap items-center gap-1 font-sans">
                                          A Excelência da Sua Mensagem <span className="text-[#E21B79] font-medium font-serif italic text-[11px]">(Lapidação Profissional)</span>
                                        </h5>
                                        <p className="text-[11px] text-slate-600 font-medium leading-normal font-sans mt-0.5 text-justify">
                                          Nesta etapa, nossa equipe de editores fará um trabalho minucioso para garantir que sua mensagem seja transmitida com clareza, impacto e elegância. Cuidaremos da revisão ortográfica e gramatical completa, além de aprimorar a coesão e a fluidez da narrativa, respeitando sempre seu estilo e sua voz como autor.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {hasDiagramacao && (
                                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 flex gap-2.5 text-left items-start">
                                      <div className="text-[#E21B79] bg-pink-50 rounded-full w-7 h-7 flex items-center justify-center shrink-0 border border-pink-100 mt-0.5">
                                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-slate-900 text-xs leading-tight flex flex-wrap items-center gap-1 font-sans">
                                          A Experiência de Leitura <span className="text-[#E21B79] font-medium font-serif italic text-[11px]">(Design e Diagramação)</span>
                                        </h5>
                                        <p className="text-[11px] text-slate-600 font-medium leading-normal font-sans mt-0.5 text-justify">
                                          Esta é a etapa em que seu manuscrito ganha o corpo e a alma de um livro profissional. Nossa equipe de design irá compor cada página, ajustando minuciosamente a tipografia, margens, espaçamentos e todos os elementos visuais. O resultado é um projeto gráfico coeso que guia o leitor de forma intuitiva.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {hasCapa && (
                                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 flex gap-2.5 text-left items-start">
                                      <div className="text-[#E21B79] bg-pink-50 rounded-full w-7 h-7 flex items-center justify-center shrink-0 border border-pink-100 mt-0.5">
                                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-slate-900 text-xs leading-tight flex flex-wrap items-center gap-1 font-sans">
                                          O Convite Visual <span className="text-[#E21B79] font-medium font-serif italic text-[11px]">(Capa que Vende e Encanta)</span>
                                        </h5>
                                        <p className="text-[11px] text-slate-600 font-medium leading-normal font-sans mt-0.5 text-justify">
                                          A capa é o primeiro contato do leitor com sua obra. Criaremos um design exclusivo e profissional, totalmente alinhado à essência do seu livro e às suas expectativas. Trabalharemos em colaboração com você desde a reunião de briefing até a aprovação final.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {hasBurocracia && (
                                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 flex gap-2.5 text-left items-start">
                                      <div className="text-[#E21B79] bg-pink-50 rounded-full w-7 h-7 flex items-center justify-center shrink-0 border border-pink-100 mt-0.5">
                                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-slate-900 text-xs leading-tight flex flex-wrap items-center gap-1 font-sans">
                                          Sua Obra Protegida <span className="text-[#E21B79] font-medium font-serif italic text-[11px]">(Segurança e Profissionalismo)</span>
                                        </h5>
                                        <p className="text-[11px] text-slate-600 font-medium leading-normal font-sans mt-0.5 text-justify">
                                          {(() => {
                                            const includesISBN = serviceItems.some(item => /isbn/i.test(item.description));
                                            const includesFicha = serviceItems.some(item => /ficha|catalog/i.test(item.description));
                                            const includesDireitos = serviceItems.some(item => /direitos|direito/i.test(item.description));

                                            const listBurocracia: string[] = [];
                                            if (includesISBN) listBurocracia.push("o registro do ISBN");
                                            if (includesFicha) listBurocracia.push("a elaboração da Ficha Catalográfica");
                                            if (includesDireitos) listBurocracia.push("o registro de Direitos Autorais");

                                            let burocraciaText = "";
                                            if (listBurocracia.length === 1) {
                                              burocraciaText = `Realizaremos ${listBurocracia[0]}, garantindo que sua obra esteja protegida e catalogada oficialmente.`;
                                            } else if (listBurocracia.length === 2) {
                                              burocraciaText = `Realizaremos ${listBurocracia[0]} e ${listBurocracia[1]}, garantindo que sua obra esteja protegida e catalogada oficialmente.`;
                                            } else if (listBurocracia.length >= 3) {
                                              burocraciaText = `Realizaremos ${listBurocracia[0]}, ${listBurocracia[1]} e ${listBurocracia[2]}, garantindo que sua obra esteja protegida e catalogada oficialmente.`;
                                            } else {
                                              burocraciaText = "Realizaremos os processos de registro necessários, garantindo que sua obra esteja protegida e catalogada oficialmente.";
                                            }

                                            return `Para que você possa focar na sua escrita, cuidamos de toda a parte burocrática. ${burocraciaText}`;
                                          })()}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {otherItems.length > 0 && (
                                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50 text-left shadow-sm">
                                      <h5 className="font-bold text-[#E21B79] text-[10px] pb-1 border-b border-indigo-50 mb-1 font-sans uppercase tracking-wider">
                                        Serviços Adicionais Inclusos:
                                      </h5>
                                      <ul className="space-y-0.5">
                                        {otherItems.map((item, idx) => (
                                          <li key={item.id || idx} className="flex items-center gap-2 text-[11px] text-slate-700 leading-tight font-sans font-semibold">
                                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                            <span>
                                              {item.description}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECT 2: INVESTMENT & PAYMENT CONDITIONS */}
                    <div className="space-y-2">
                      {/* INVESTMENT BADGE FOR SERVICES */}
                      <div className="bg-[#E21B79] text-white rounded-xl py-2 px-6 text-center shadow-md relative overflow-hidden max-w-md mx-auto w-full">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-5 -mt-5"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-3 -mb-3"></div>
                        
                        <span className="block text-[10px] font-black uppercase tracking-wider text-fuchsia-100 leading-none mb-0.5">
                          {projectType === 'cultural' 
                            ? 'INVESTIMENTO TOTAL DO PROJETO CULTURAL:' 
                            : 'INVESTIMENTO TOTAL EM SERVIÇOS:'}
                        </span>
                        <span className="block text-xl sm:text-2xl font-extrabold tracking-tight leading-none font-sans">
                          {formatCurrency(totalServicesCost * markupMultiplier)}
                        </span>
                      </div>

                      {/* CONDIÇÕES DE PAGAMENTO - SERVIÇOS */}
                      <div className="space-y-2 text-left">
                        <h4 className="text-xs font-black text-[#E21B79] uppercase tracking-wide border-b border-indigo-100 pb-0.5">
                          Condições de Pagamento - Serviços*
                        </h4>
                        
                        {(() => {
                          const servicesSellPrice = totalServicesCost * markupMultiplier;
                          const sEntrada = servicesSellPrice * (entryPercent / 100);
                          const sEntrega = servicesSellPrice * (1 - entryPercent / 100);
                          const sTotalComJuros = servicesSellPrice * (1 + (interestPercent / 100));
                          const sParcelas = sTotalComJuros / installments;
                          const sTotalComDesconto = servicesSellPrice * (1 - (paymentDiscountPercent / 100));

                          const showCash = paymentMethodCash;
                          const showInstallments = paymentMethodInstallments;
                          const gridColsClass = (showCash && showInstallments) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

                          return (
                            <div className={`grid ${gridColsClass} gap-3 font-sans`}>
                              {showCash && (
                                <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-sm flex flex-col justify-between">
                                  <div>
                                    <p className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1 text-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Pagamento à Vista (com desconto)
                                    </p>
                                    <p className="text-slate-650 font-semibold mb-1 text-[11px]">
                                      Aproveite o benefício exclusivo de desconto sobre o investimento em serviços:
                                    </p>
                                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-semibold text-[11px]">
                                      <li>
                                        Desconto: <span className="text-slate-900 font-bold">{paymentDiscountPercent}%</span>
                                      </li>
                                      <li>
                                        Valor à vista: <span className="text-emerald-600 font-extrabold text-xs">{formatCurrency(sTotalComDesconto)}</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              )}

                              {showInstallments && (
                                <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-sm flex flex-col gap-2">
                                  <div>
                                    <p className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1 text-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#E21B79]"></span>
                                      Pagamento Parcelado
                                    </p>
                                    
                                    <div className="space-y-1.5">
                                      <div className="border-b border-slate-100 pb-1.5">
                                        <p className="font-semibold text-indigo-950 text-[10px] mb-0.5">Opção A: PIX / Boleto Facilitado</p>
                                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-semibold text-[11px]">
                                          {paymentDirectTerms ? (
                                            <li>
                                              Condição de Prazos: <span className="text-slate-900 font-bold">{paymentDirectTerms}</span>
                                              {entryPercent > 0 && entryPercent < 100 && (
                                                <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                                                  ({entryPercent}% de Entrada: {formatCurrency(sEntrada)} + saldo conforme prazos)
                                                </span>
                                              )}
                                            </li>
                                          ) : entryPercent === 100 ? (
                                            <li>
                                              PIX/Boleto: <span className="text-slate-900 font-bold">{formatCurrency(sEntrada)}</span>
                                            </li>
                                          ) : (
                                            <>
                                              <li>
                                                {entryPercent}% Entrada: <span className="text-slate-900 font-bold">{formatCurrency(sEntrada)}</span>
                                              </li>
                                              <li>
                                                {100 - entryPercent}% na entrega do livro finalizado: <span className="text-slate-900 font-bold">{formatCurrency(sEntrega)}</span>
                                              </li>
                                            </>
                                          )}
                                        </ul>
                                      </div>
                                      
                                      <div>
                                        <p className="font-semibold text-indigo-950 text-[10px] mb-0.5">Opção B: Cartão de Crédito</p>
                                        <ul className="list-disc pl-4 space-y-1 text-slate-700 font-semibold text-[11px]">
                                          {cardInstallmentOptions.map((cOpt, cIdx) => {
                                            const cOptTotal = servicesSellPrice * (1 + ((cOpt.interestPercent || 0) / 100));
                                            const cOptParcela = cOptTotal / (cOpt.installments || 1);
                                            const scheduleText = getInstallmentScheduleText(cOpt.installments, cOpt.withEntry);
                                            return (
                                              <li key={cIdx}>
                                                Até <span className="text-indigo-950 font-bold">{cOpt.installments}x</span> de <span className="text-slate-900 font-bold">{formatCurrency(cOptParcela)}</span>
                                                {cOpt.withEntry ? (
                                                  <span className="text-indigo-950 font-bold"> ({scheduleText})</span>
                                                ) : null}
                                                {cOpt.interestPercent > 0 ? ` (${formatCurrency(cOptTotal)} com acréscimo)` : ' sem acréscimo'}
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <p className="text-[9px] text-slate-500 leading-tight font-serif italic">
                          * <strong className="text-slate-650 not-italic">Importante:</strong> A cobrança e faturamento estarão formalmente em nome da razão social <strong className="text-[#E21B79] not-italic">NASCIDOS PARA EMPREENDER EDITORA LTDA</strong>, operadora da marca <strong className="text-indigo-950 not-italic uppercase font-bold tracking-tight">Editora NPE</strong>.
                        </p>

                        {/* OBSERVAÇÕES / DESCRIÇÃO DAS CONDIÇÕES NO PDF */}
                        {!hasProducts && customText && (
                          <div className="bg-amber-50/90 border-l-4 border-[#E21B79] border-y border-r border-amber-200/80 p-2.5 rounded-r-xl text-left shadow-sm mt-1.5">
                            <p className="font-extrabold text-[#E21B79] uppercase text-[10px] tracking-wide mb-0.5 flex items-center gap-1 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E21B79]"></span>
                              Observações Importantes da Proposta:
                            </p>
                            <p className="text-[11px] text-slate-800 font-sans whitespace-pre-line leading-relaxed font-semibold">
                              {customText}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* VALIDADE E PRAZO DE ENTREGA */}
                      <div className="bg-amber-100/35 p-2.5 rounded-lg border border-amber-200/50 text-left font-sans grid grid-cols-2 gap-3 shadow-sm">
                        <div className="border-r border-slate-200/50 pr-2">
                          <span className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider block mb-0.5">Prazo de Validade da Proposta</span>
                          <span className="text-[11px] text-slate-700 leading-snug font-sans">
                            Condições válidas até: <strong className="text-[#E21B79] font-bold text-[11px]">{getValidationDate()}</strong> ({proposal.validationDays !== undefined ? proposal.validationDays : 15} dias corridos)
                          </span>
                        </div>
                        <div className="pl-1">
                          <span className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider block mb-0.5">Prazo de Entrega do Projeto</span>
                          <span className="text-[11px] text-slate-700 leading-snug font-sans">
                            Prazo estimado: <strong className="text-slate-900 font-bold text-[11px]">{proposal.deliveryDays !== undefined ? proposal.deliveryDays : 30} dias úteis</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-300 pt-2 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide gap-1">
                    <span>EMPRESA: NASCIDOS PARA EMPREENDER EDITORA LTDA</span>
                    <span className="text-[#E21B79] font-black font-sans hidden sm:inline">•</span>
                    <span>CNPJ: 47.575.297/0001-87</span>
                  </div>

                </div>
              </div>
            )}

            {/* PAGE 2: PRODUÇÃO GRÁFICA, FRETE E CONDIÇÕES DE PAGAMENTO (Only shown if hasProducts is true) */}
            {hasProducts && (
              <div 
                className="print-page w-full bg-[#FAF8F5] text-slate-900 p-6 sm:p-10 shadow-2xl rounded-xl border border-slate-200 relative font-sans flex flex-col justify-between"
                style={{ height: '29.7cm', color: '#1e293b' }}
              >
                {/* Elegant Double Border Ornate Corner */}
                <div className="absolute inset-3 border-4 border-double border-slate-400/80 rounded-2xl pointer-events-none p-1">
                  <div className="absolute inset-0.5 border border-slate-350/50 rounded-[14px]"></div>
                </div>

                {/* Main Content inside Border */}
                <div className="relative z-10 flex-1 flex flex-col justify-between py-1.5 px-2 sm:py-2 sm:px-3">
                  
                  {/* BRAND LOGO HEADER */}
                  <div className="flex flex-col items-center text-center shrink-0">
                    <img 
                      src={logoBase64 || "https://editoranpe.com.br/wp-content/uploads/2026/06/Logo-Editora-NPE-scaled.png"} 
                      alt="Editora NPE" 
                      className="h-20 sm:h-24 w-auto object-contain select-none pb-1"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* CENTRAL VERTICAL GROUP */}
                  <div className="flex-1 flex flex-col justify-evenly my-auto space-y-3">
                    
                    {/* PROP HEADER SLOGAN */}
                    <div className="text-center px-4">
                      <h3 className="text-base sm:text-lg font-black text-indigo-950 tracking-normal uppercase leading-tight max-w-lg mx-auto">
                        SEU INVESTIMENTO E CONDIÇÕES - PRODUÇÃO GRÁFICA
                      </h3>
                    </div>

                    {/* SECT 1: PRODUÇÃO GRÁFICA E CARACTERÍSTICAS DO LIVRO */}
                    <div className="space-y-2">
                      {proposal.bookFeaturesDescription ? (
                        <div className="border-b border-indigo-100 pb-1 text-center sm:text-left">
                          <h4 className="text-xs sm:text-sm font-black text-[#E21B79] uppercase tracking-wide">
                            Descrição das Características do Livro
                          </h4>
                          <p className="text-[11px] text-slate-600 font-sans leading-relaxed whitespace-pre-line font-medium mt-1">
                            {proposal.bookFeaturesDescription}
                          </p>
                        </div>
                      ) : (
                        <div className="border-b border-indigo-100 pb-1 text-center sm:text-left">
                          <h4 className="text-xs sm:text-sm font-black text-[#E21B79] uppercase tracking-wide">
                            Produção de Exemplares
                          </h4>
                          <p className="text-[10px] text-slate-500 font-serif italic leading-snug mt-0.5">
                            Impressão em alta resolução com acabamento profissional e controle de qualidade NPE
                          </p>
                        </div>
                      )}

                      {/* HIGH-FIDELITY INVESTMENT OPTIONS CARDS */}
                      <div className={`grid gap-3 ${
                        productOptions.length === 1 
                          ? 'grid-cols-1 max-w-xs mx-auto' 
                          : productOptions.length === 2 
                            ? 'grid-cols-2' 
                            : 'grid-cols-3'
                      }`}>
                        {productOptions.map(option => (
                          <div 
                            key={option.id} 
                            className="bg-[#E21B79] text-white rounded-xl py-2.5 px-3 text-center shadow-md relative overflow-hidden flex flex-col justify-center"
                          >
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-fuchsia-100 font-sans">
                              {option.qty} {option.qty === 1 ? 'unidade' : 'unidades'}
                            </span>
                            <span className="block text-lg sm:text-xl font-black tracking-tight leading-none my-1 font-sans">
                              {formatCurrency(option.sellPrice)}
                            </span>
                            <span className="block text-[10px] text-fuchsia-100 font-semibold tracking-wide font-sans">
                              {formatCurrency(option.unitPrice)}/unidade
                            </span>
                            {option.shippingCost !== undefined && option.shippingCost > 0 && (
                              <span className="block text-[9px] text-fuchsia-100 font-bold tracking-wide mt-1 font-sans bg-white/10 rounded py-0.5 px-1.5 max-w-max mx-auto">
                                Frete: {formatCurrency(option.shippingCost)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* INFORMAÇÕES IMPORTANTES DE FRETE - APENAS PARA O SERVIÇO DO TIPO IMPRESSÃO */}
                      {productOptions.some(opt => opt.shippingCost !== undefined && opt.shippingCost > 0) && (
                        <div className="bg-amber-50/90 border-l-4 border-[#E21B79] border-y border-r border-amber-200/80 p-2.5 rounded-r-xl text-left shadow-sm font-sans">
                          <p className="font-extrabold text-[#E21B79] uppercase text-[10px] tracking-wide mb-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E21B79]"></span>
                            Informações Importantes de Frete:
                          </p>
                          <div className="text-[11px] text-slate-800 font-semibold space-y-0.5">
                            {productOptions.map(opt => {
                              const freightVal = opt.shippingCost || 0;
                              if (freightVal <= 0) return null;
                              return (
                                <p key={opt.id} className="flex flex-wrap items-center gap-1">
                                  <span>
                                    Valor de Frete {productOptions.length > 1 ? `(${opt.qty} ${opt.qty === 1 ? 'unidade' : 'unidades'})` : ''}: <strong className="text-slate-900">{formatCurrency(freightVal)}</strong>
                                  </span>
                                  <span className="text-slate-600 font-normal italic text-[10px]">
                                    *(o valor do frete pode variar de acordo com a quantidade)
                                  </span>
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECT 2: CONDIÇÕES DE PAGAMENTO - PRODUÇÃO GRÁFICA */}
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-black text-[#E21B79] uppercase tracking-wide border-b border-indigo-100 pb-0.5">
                        Condições de Pagamento - Produção Gráfica*
                      </h4>
                      
                      <div className="space-y-1.5">
                        {productOptions.map((opt) => {
                          const optEntrada = opt.sellPrice * (entryPercent / 100);
                          const optEntrega = opt.sellPrice * (1 - entryPercent / 100);
                          const optTotalComJuros = opt.sellPrice * (1 + (interestPercent / 100));
                          const optParcelas = optTotalComJuros / installments;
                          const optTotalComDesconto = opt.sellPrice * (1 - (paymentDiscountPercent / 100));

                          const showCash = paymentMethodCash;
                          const showInstallments = paymentMethodInstallments;

                          return (
                            <div key={opt.id} className="text-xs bg-white p-2.5 rounded-lg border border-slate-200/50 flex flex-col gap-1.5 font-sans shadow-sm">
                              <p className="font-extrabold text-indigo-950 text-[11px] border-b border-slate-100 pb-0.5 flex justify-between">
                                <span>Opção: {opt.qty} {opt.qty === 1 ? 'unidade' : 'unidades'}</span>
                                <span className="text-[#E21B79] font-black font-mono">Valor à Vista: {formatCurrency(opt.sellPrice)}</span>
                              </p>
                              
                              <div className={`grid ${(showCash && showInstallments) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2 text-left`}>
                                {showCash && (
                                  <div className={showInstallments ? 'sm:border-r sm:border-slate-100/60 sm:pr-2' : ''}>
                                    <p className="font-bold text-emerald-600 text-[10px] mb-0.5 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                      À Vista (com desconto)
                                    </p>
                                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-semibold text-[10px]">
                                      <li>Desconto: <strong className="text-slate-900">{paymentDiscountPercent}%</strong></li>
                                      <li>Valor Final: <strong className="text-emerald-600 text-[11px] font-black">{formatCurrency(optTotalComDesconto)}</strong></li>
                                    </ul>
                                  </div>
                                )}
                                
                                {showInstallments && (
                                  <div className={showCash ? 'sm:pl-2' : ''}>
                                    <p className="font-bold text-[#E21B79] text-[10px] mb-0.5 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-[#E21B79]"></span>
                                      Pagamento Parcelado
                                    </p>
                                    <div className="space-y-1 text-[10px] leading-tight">
                                      <div>
                                        <span className="font-bold text-slate-800">PIX/Boleto: </span> 
                                        {paymentDirectTerms ? (
                                          <span className="text-slate-900 font-bold">{paymentDirectTerms}</span>
                                        ) : entryPercent === 100 ? (
                                          <span className="text-slate-900 font-bold">{formatCurrency(optEntrada)}</span>
                                        ) : (
                                          <>
                                            {entryPercent}% Entrada (<span className="text-slate-900 font-bold">{formatCurrency(optEntrada)}</span>) + 
                                            {100 - entryPercent}% entrega (<span className="text-slate-900 font-bold">{formatCurrency(optEntrega)}</span>)
                                          </>
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-800">Cartão: </span> 
                                        <div className="pl-2 space-y-0.5 mt-0.5">
                                          {cardInstallmentOptions.map((cOpt, cIdx) => {
                                            const cOptTotal = opt.sellPrice * (1 + ((cOpt.interestPercent || 0) / 100));
                                            const cOptParcela = cOptTotal / (cOpt.installments || 1);
                                            const scheduleText = getInstallmentScheduleText(cOpt.installments, cOpt.withEntry);
                                            return (
                                              <div key={cIdx}>
                                                • Até <strong className="text-slate-950">{cOpt.installments}x</strong> de <strong className="text-slate-950">{formatCurrency(cOptParcela)}</strong>
                                                {cOpt.withEntry ? (
                                                  <strong className="text-indigo-950"> ({scheduleText})</strong>
                                                ) : null}
                                                {cOpt.interestPercent > 0 ? ` (${formatCurrency(cOptTotal)} c/ acréscimo)` : ' sem acréscimo'}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-[9px] text-slate-500 leading-tight font-serif italic">
                        * <strong className="text-slate-650 not-italic">Importante:</strong> A cobrança e faturamento estarão formalmente em nome da razão social <strong className="text-[#E21B79] not-italic">NASCIDOS PARA EMPREENDER EDITORA LTDA</strong>, operadora da marca <strong className="text-indigo-950 not-italic uppercase font-bold tracking-tight">Editora NPE</strong>.
                      </p>

                      {/* OBSERVAÇÕES IMPORTANTES DA PROPOSTA */}
                      {customText && (
                        <div className="bg-amber-50/90 border-l-4 border-[#E21B79] border-y border-r border-amber-200/80 p-2.5 rounded-r-xl text-left shadow-sm">
                          <p className="font-extrabold text-[#E21B79] uppercase text-[10px] tracking-wide mb-0.5 flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E21B79]"></span>
                            Observações Importantes da Proposta:
                          </p>
                          <p className="text-[11px] text-slate-800 font-sans whitespace-pre-line leading-relaxed font-semibold">
                            {customText}
                          </p>
                        </div>
                      )}

                      {/* VALIDADE E PRAZO DE ENTREGA */}
                      <div className="bg-amber-100/35 p-2.5 rounded-lg border border-amber-200/50 text-left font-sans grid grid-cols-2 gap-3 shadow-sm">
                        <div className="border-r border-slate-200/50 pr-2">
                          <span className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider block mb-0.5">Prazo de Validade da Proposta</span>
                          <span className="text-[11px] text-slate-700 leading-snug font-sans">
                            Condições válidas até: <strong className="text-[#E21B79] font-bold text-[11px]">{getValidationDate()}</strong> ({proposal.validationDays !== undefined ? proposal.validationDays : 15} dias corridos)
                          </span>
                        </div>
                        <div className="pl-1">
                          <span className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider block mb-0.5">Prazo de Entrega do Projeto</span>
                          <span className="text-[11px] text-slate-700 leading-snug font-sans">
                            Prazo estimado: <strong className="text-slate-900 font-bold text-[11px]">{proposal.deliveryDays !== undefined ? proposal.deliveryDays : 30} dias úteis</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-300 pt-2 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide gap-1">
                    <span>EMPRESA: NASCIDOS PARA EMPREENDER EDITORA LTDA</span>
                    <span className="text-[#E21B79] font-black font-sans hidden sm:inline">•</span>
                    <span>CNPJ: 47.575.297/0001-87</span>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Bottom control panel (Screen Only) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row justify-between items-center rounded-b-2xl shrink-0 gap-3 no-print">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={triggerSendFlow}
              disabled={isSendingInProgress || isEmailSending}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow hover:scale-105 transition-all duration-150 cursor-pointer font-sans"
            >
              {isSendingInProgress ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar por WhatsApp
                </>
              )}
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              disabled={isSendingInProgress || isEmailSending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow hover:scale-105 transition-all duration-150 cursor-pointer font-sans"
            >
              <Mail size={16} />
              Enviar por E-mail
            </button>

            {sendingStatus === 'success' && (
              <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-900/40 px-3 py-2 rounded-xl flex items-center gap-1.5 animate-fade-in font-sans">
                ✓ WhatsApp enviado!
              </span>
            )}
            {sendingStatus === 'error' && (
              <span className="text-rose-400 font-bold text-xs bg-rose-950/60 border border-rose-900/40 px-3 py-2 rounded-xl flex items-center gap-1.5 animate-fade-in font-sans cursor-help" title={errorMessage}>
                ⚠️ Falha no WhatsApp
              </span>
            )}
          </div>
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all text-sm font-semibold cursor-pointer"
            >
              Fechar Visualização
            </button>
            <button
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-750 text-white font-bold py-2 px-6 rounded-xl text-sm flex items-center gap-2 shadow hover:scale-105 transition-all duration-150 cursor-pointer"
            >
              <Printer size={16} />
              Imprimir Agora
            </button>
          </div>
        </div>
      </div>

      {/* Email Send Form Dialog */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 font-sans animate-fade-in no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-in">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Enviar Proposta por E-mail</h3>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={triggerEmailSendFlow} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail de Destino</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@exemplo.com"
                  value={destEmail}
                  onChange={(e) => setDestEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assunto</label>
                <input
                  type="text"
                  required
                  placeholder="Assunto do e-mail"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mensagem (Corpo do E-mail)</label>
                <textarea
                  rows={5}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-semibold"
                />
              </div>

              {emailSendingStatus === 'error' && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg font-medium">
                  <strong>Erro de Envio:</strong> {emailErrorMessage}
                </div>
              )}

              {emailSendingStatus === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                  ✓ Proposta encaminhada por e-mail com sucesso!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEmailSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isEmailSending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Enviar E-mail
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
