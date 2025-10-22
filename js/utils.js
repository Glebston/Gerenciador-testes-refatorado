// Importa as bibliotecas jsPDF e AutoTable com versões compatíveis
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTablePlugin from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.31/+esm";

// Registra o plugin AutoTable no construtor jsPDF (executado uma vez)
autoTablePlugin(jsPDF);

// Função para fazer upload de imagem para o ImgBB
export async function uploadToImgBB(file) {
    const apiKey = 'fb2c7e34fb37f1ea8f085bc10bc88f48';
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro no upload da imagem');
        }

        const data = await response.json();
        return data.data.url;
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        throw error;
    }
}

// Função para gerar PDF do recibo de quitação e entrega
export function generateReceiptPdf(order, companyName = "Nossa Empresa") {
    const doc = new jsPDF();
    
    // Configurações de margem e espaçamento
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho do documento
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('RECIBO DE QUITAÇÃO E ENTREGA', pageWidth / 2, margin + 10, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);
    
    // Informações da empresa
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(companyName, pageWidth / 2, margin + 25, { align: 'center' });
    
    // Informações do pedido
    let yPosition = margin + 40;
    doc.setFontSize(11);
    
    // Dados do cliente
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO CLIENTE:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 7;
    doc.text(`Nome: ${order.customerName}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Telefone: ${order.customerPhone}`, margin, yPosition);
    yPosition += 6;
    
    // Dados do pedido
    doc.setFont(undefined, 'bold');
    yPosition += 8;
    doc.text('DADOS DO PEDIDO:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 7;
    doc.text(`Pedido #: ${order.orderNumber}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Valor Total: ${formatCurrency(order.totalAmount)}`, margin, yPosition);
    
    // Tabela de itens
    yPosition += 15;
    doc.setFont(undefined, 'bold');
    doc.text('ITENS DO PEDIDO:', margin, yPosition);
    yPosition += 5;
    
    // Prepara os dados para a tabela
    const tableData = order.items.map(item => [
        item.type || 'Item',
        item.name || '-',
        item.quantity || 1,
        formatCurrency(item.unitPrice || 0),
        formatCurrency(item.subtotal || 0)
    ]);
    
    // Adiciona a tabela usando autoTable
    doc.autoTable({
        startY: yPosition,
        head: [['Tipo', 'Descrição', 'Qtd', 'Valor Unit.', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [66, 66, 66],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 9,
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 30 },
            1: { halign: 'left', cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 30 },
            4: { halign: 'right', cellWidth: 30 }
        },
        margin: { left: margin, right: margin },
        didDrawPage: function(data) {
            // Salva a posição Y após a tabela
            yPosition = data.cursor.y;
        }
    });
    
    // Pega a posição Y após a tabela
    yPosition = doc.lastAutoTable.finalY + 15;
    
    // Declaração de quitação e entrega
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('DECLARAÇÃO:', margin, yPosition);
    yPosition += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const declarationText = `Declaro ter recebido os itens acima discriminados em perfeitas condições e confirmo a quitação total do valor de ${formatCurrency(order.totalAmount)}.`;
    
    // Quebra o texto em linhas para caber na página
    const lines = doc.splitTextToSize(declarationText, contentWidth);
    lines.forEach(line => {
        doc.text(line, margin, yPosition);
        yPosition += 6;
    });
    
    // Espaço para assinaturas (se houver espaço na página)
    yPosition += 20;
    
    // Verifica se há espaço para as assinaturas
    if (yPosition + 40 < pageHeight - margin) {
        // Linha de assinatura do cliente
        doc.line(margin, yPosition, margin + 80, yPosition);
        doc.setFontSize(9);
        doc.text('Assinatura do Cliente', margin, yPosition + 5);
        doc.text(`${order.customerName}`, margin, yPosition + 10);
        
        // Linha de assinatura da empresa
        doc.line(pageWidth - margin - 80, yPosition, pageWidth - margin, yPosition);
        doc.text('Assinatura da Empresa', pageWidth - margin - 80, yPosition + 5);
        doc.text(companyName, pageWidth - margin - 80, yPosition + 10);
        
        // Data e hora
        yPosition += 25;
        doc.setFontSize(8);
        const now = new Date();
        const dateTimeStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
        doc.text(`Documento gerado em: ${dateTimeStr}`, pageWidth / 2, yPosition, { align: 'center' });
    }
    
    // Retorna o documento PDF
    return doc;
}

// Função para gerar PDF do pedido completo
export function generateOrderPdf(order, companyName = "Nossa Empresa") {
    const doc = new jsPDF();
    
    // Configurações
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('PEDIDO DE FARDAMENTO', pageWidth / 2, margin + 10, { align: 'center' });
    
    // Informações da empresa
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(companyName, pageWidth / 2, margin + 20, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 25, pageWidth - margin, margin + 25);
    
    // Informações do pedido
    let yPosition = margin + 35;
    doc.setFontSize(11);
    
    // Número do pedido e status
    doc.setFont(undefined, 'bold');
    doc.text(`Pedido #${order.orderNumber}`, margin, yPosition);
    
    // Status com cor
    const statusColors = {
        'pending': [255, 193, 7],    // Amarelo
        'delivered': [40, 167, 69],  // Verde
        'cancelled': [220, 53, 69]   // Vermelho
    };
    const statusText = {
        'pending': 'PENDENTE',
        'delivered': 'ENTREGUE',
        'cancelled': 'CANCELADO'
    };
    
    const status = statusText[order.status] || 'PENDENTE';
    const color = statusColors[order.status] || [0, 0, 0];
    
    doc.setTextColor(...color);
    doc.text(status, pageWidth - margin - 30, yPosition);
    doc.setTextColor(0, 0, 0); // Volta para preto
    
    // Dados do cliente
    yPosition += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Cliente:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(order.customerName, margin + 20, yPosition);
    
    yPosition += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Telefone:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatPhone(order.customerPhone), margin + 25, yPosition);
    
    yPosition += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Data do Pedido:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(order.orderDate), margin + 40, yPosition);
    
    if (order.deliveryDate) {
        yPosition += 7;
        doc.setFont(undefined, 'bold');
        doc.text('Data de Entrega:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(formatDate(order.deliveryDate), margin + 40, yPosition);
    }
    
    // Tabela de itens
    yPosition += 15;
    
    const tableData = order.items.map(item => [
        item.type || '-',
        item.name || '-',
        item.size || '-',
        item.quantity || 1,
        formatCurrency(item.unitPrice || 0),
        formatCurrency(item.subtotal || 0)
    ]);
    
    doc.autoTable({
        startY: yPosition,
        head: [['Tipo', 'Descrição', 'Tamanho', 'Qtd', 'Valor Unit.', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [41, 128, 185],
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });
    
    // Total
    yPosition = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', pageWidth - margin - 60, yPosition);
    doc.setFontSize(14);
    doc.text(formatCurrency(order.totalAmount), pageWidth - margin, yPosition, { align: 'right' });
    
    // Observações
    if (order.observations) {
        yPosition += 15;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Observações:', margin, yPosition);
        yPosition += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        const obsLines = doc.splitTextToSize(order.observations, contentWidth);
        obsLines.forEach(line => {
            doc.text(line, margin, yPosition);
            yPosition += 5;
        });
    }
    
    // Imagens anexadas
    if (order.images && order.images.length > 0) {
        doc.addPage();
        yPosition = margin;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('IMAGENS ANEXADAS', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        
        // Nota sobre as imagens
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('As imagens podem ser visualizadas no sistema online.', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text(`Total de imagens: ${order.images.length}`, pageWidth / 2, yPosition, { align: 'center' });
    }
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
    
    return doc;
}

// Função para gerar relatório financeiro em PDF
export function generateFinanceReportPdf(transactions, bankBalance, companyName = "Nossa Empresa") {
    const doc = new jsPDF();
    
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO FINANCEIRO', pageWidth / 2, margin + 10, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(companyName, pageWidth / 2, margin + 20, { align: 'center' });
    
    // Período
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${today}`, pageWidth / 2, margin + 28, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 32, pageWidth - margin, margin + 32);
    
    // Resumo
    let yPosition = margin + 42;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO FINANCEIRO', margin, yPosition);
    
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Calcula totais
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else {
            acc.expense += t.amount;
        }
        return acc;
    }, { income: 0, expense: 0 });
    
    doc.text(`Saldo Bancário: ${formatCurrency(bankBalance)}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Total de Entradas: ${formatCurrency(totals.income)}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Total de Saídas: ${formatCurrency(totals.expense)}`, margin, yPosition);
    yPosition += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`Resultado: ${formatCurrency(totals.income - totals.expense)}`, margin, yPosition);
    
    // Tabela de transações
    yPosition += 15;
    
    if (transactions.length > 0) {
        const tableData = transactions.map(t => [
            formatDate(t.date),
            t.description,
            t.category,
            t.type === 'income' ? formatCurrency(t.amount) : '-',
            t.type === 'expense' ? formatCurrency(t.amount) : '-',
            t.status === 'a_receber' ? 'A Receber' : 'Pago'
        ]);
        
        doc.autoTable({
            startY: yPosition,
            head: [['Data', 'Descrição', 'Categoria', 'Entrada', 'Saída', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [52, 73, 94],
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 20, halign: 'center' }
            },
            margin: { left: margin, right: margin }
        });
    } else {
        doc.setFontSize(11);
        doc.text('Nenhuma transação encontrada no período.', pageWidth / 2, yPosition, { align: 'center' });
    }
    
    return doc;
}

// Função auxiliar para formatar moeda
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

// Função para formatar telefone
export function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

// Função para formatar data
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Função para formatar data e hora
export function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Função para validar CPF
export function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cpf[9]) !== digit) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cpf[10]) !== digit) return false;
    
    return true;
}

// Função para validar email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para gerar número de pedido único
export function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}${day}${random}`;
}

// Função para calcular dias entre datas
export function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

// Função para obter saudação baseada no horário
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Timer de sessão
let sessionTimer = null;
let warningTimer = null;

export function startSessionTimer(onExpire, onWarning) {
    clearTimers();
    
    // Aviso em 25 minutos
    warningTimer = setTimeout(() => {
        if (onWarning) onWarning();
    }, 25 * 60 * 1000);
    
    // Expiração em 30 minutos
    sessionTimer = setTimeout(() => {
        if (onExpire) onExpire();
    }, 30 * 60 * 1000);
}

export function clearTimers() {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }
    if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = null;
    }
}

export function resetTimers(onExpire, onWarning) {
    clearTimers();
    startSessionTimer(onExpire, onWarning);
}

// Função para debounce (evitar múltiplas chamadas)
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função para throttle (limitar frequência de chamadas)
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Função para copiar texto para clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Erro ao copiar:', err);
        return false;
    }
}

// Função para detectar dispositivo móvel
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Função para sanitizar HTML (prevenir XSS)
export function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Função para fazer download de arquivo
export function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Função para converter base64 para blob
export function base64ToBlob(base64, contentType = '') {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: contentType });
}

// Função para redimensionar imagem
export async function resizeImage(file, maxWidth = 800, maxHeight = 800) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Exporta todas as funções como um objeto também (para compatibilidade)
export default {
    uploadToImgBB,
    generateReceiptPdf,
    generateOrderPdf,
    generateFinanceReportPdf,
    formatCurrency,
    formatPhone,
    formatDate,
    formatDateTime,
    validateCPF,
    validateEmail,
    generateOrderNumber,
    daysBetween,
    getGreeting,
    startSessionTimer,
    clearTimers,
    resetTimers,
    debounce,
    throttle,
    copyToClipboard,
    isMobile,
    sanitizeHTML,
    downloadFile,
    base64ToBlob,
    resizeImage
};
