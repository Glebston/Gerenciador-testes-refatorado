// js/approval.js
// ==========================================================
// MÓDULO PÚBLICO DE APROVAÇÃO (v1.1.0 - FINANCE & PIX)
// Responsabilidade: Renderizar pedido, calcular totais e 
// gerenciar fluxo de aprovação com solicitação de PIX.
// ==========================================================

// 1. Configurações de Pagamento (EDITÁVEIS)
const PAYMENT_CONFIG = {
    pixKey: "83999163523", // Ex: "123.456.789-00" ou email
    pixBeneficiary: "Incial Fardamentos - Uiraúna", // Nome que aparece no banco
    entryPercentage: 0.50 // 50% de entrada necessária
};

// 2. Importações
import { db } from './firebaseConfig.js'; 
import { 
    collectionGroup, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Referências DOM ---
const DOM = {
    loading: document.getElementById('loadingState'),
    error: document.getElementById('errorState'),
    content: document.getElementById('orderContent'),
    footer: document.getElementById('actionFooter'),
    headerStatus: document.getElementById('headerStatus'),
    
    // Dados
    clientName: document.getElementById('clientName'),
    deliveryDate: document.getElementById('deliveryDate'),
    mockupGallery: document.getElementById('mockupGallery'),
    itemsTable: document.getElementById('itemsTableBody'),
    obs: document.getElementById('generalObservation'),
    
    // Botões
    btnApprove: document.getElementById('btnApprove'),
    btnRequest: document.getElementById('btnRequestChanges'),
    
    // Modal
    modal: document.getElementById('feedbackModal'),
    modalContent: document.getElementById('modalContent')
};

// Variáveis Globais
let currentOrderDoc = null;
let currentOrderData = null;

// --- Utilitários ---

const formatMoney = (value) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr) => {
    if(!dateStr) return '--';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const showModal = (htmlContent, autoClose = false) => {
    DOM.modalContent.innerHTML = htmlContent;
    DOM.modal.classList.remove('hidden');
    if (autoClose) {
        setTimeout(() => DOM.modal.classList.add('hidden'), 3000);
    }
};

const closeModal = () => DOM.modal.classList.add('hidden');

// Função de Cálculo Financeiro (Espelho do orderService)
const calculateTotals = (order) => {
    let grossTotal = 0;
    
    if (order.parts && Array.isArray(order.parts)) {
        order.parts.forEach(part => {
            // 1. Peças Padrão
            let standardQty = 0;
            if (part.sizes) {
                Object.values(part.sizes).forEach(sizesObj => {
                    Object.values(sizesObj).forEach(qty => standardQty += (parseInt(qty) || 0));
                });
            }
            const priceStd = parseFloat(part.unitPriceStandard) || parseFloat(part.unitPrice) || 0;
            grossTotal += (standardQty * priceStd);

            // 2. Peças Específicas
            const specificQty = (part.specifics || []).length;
            const priceSpec = parseFloat(part.unitPriceSpecific) || parseFloat(part.unitPrice) || 0;
            grossTotal += (specificQty * priceSpec);

            // 3. Peças Detalhadas
            const detailedQty = (part.details || []).length;
            const priceDet = parseFloat(part.unitPrice) || 0;
            grossTotal += (detailedQty * priceDet);
        });
    }

    const discount = parseFloat(order.discount) || 0;
    const total = grossTotal - discount;
    const paid = parseFloat(order.downPayment) || 0;
    const remaining = total - paid;

    return { grossTotal, discount, total, paid, remaining };
};

// --- Lógica Principal ---

const loadOrder = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('id');

        if (!orderId) throw new Error("ID não fornecido");

        const q = query(collectionGroup(db, 'orders'), where('id', '==', orderId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            DOM.loading.classList.add('hidden');
            DOM.error.classList.remove('hidden');
            DOM.headerStatus.innerText = "Não Encontrado";
            DOM.headerStatus.className = "text-xs font-bold uppercase px-2 py-1 rounded bg-red-100 text-red-600";
            return;
        }

        const docRef = querySnapshot.docs[0];
        currentOrderDoc = docRef.ref;
        currentOrderData = docRef.data();
        
        renderOrder(currentOrderData);

    } catch (error) {
        console.error("Erro ao carregar:", error);
        DOM.loading.classList.add('hidden');
        DOM.error.classList.remove('hidden');
        DOM.error.querySelector('p').textContent = "Erro de conexão ou link inválido.";
    }
};

const renderOrder = (order) => {
    // 1. Cabeçalho
    DOM.clientName.textContent = order.clientName;
    DOM.deliveryDate.textContent = formatDate(order.deliveryDate);
    
    const statusMap = {
        'Pendente': { color: 'bg-yellow-100 text-yellow-800', label: 'Novo / Pendente' },
        'Aguardando Aprovação': { color: 'bg-cyan-100 text-cyan-800', label: 'Aguardando Sua Aprovação' },
        'Aprovado pelo Cliente': { color: 'bg-green-100 text-green-800', label: 'Aprovado' },
        'Alteração Solicitada': { color: 'bg-red-100 text-red-800', label: 'Alteração Solicitada' },
        'Em Produção': { color: 'bg-blue-100 text-blue-800', label: 'Em Produção' },
        'Entregue': { color: 'bg-gray-100 text-gray-800', label: 'Entregue' }
    };
    
    const statusConfig = statusMap[order.orderStatus] || { color: 'bg-gray-100 text-gray-800', label: order.orderStatus };
    DOM.headerStatus.className = `text-xs font-bold uppercase px-2 py-1 rounded ${statusConfig.color}`;
    DOM.headerStatus.textContent = statusConfig.label;

    // 2. Mockups
    DOM.mockupGallery.innerHTML = '';
    if (order.mockupUrls && order.mockupUrls.length > 0) {
        order.mockupUrls.forEach(url => {
            const imgContainer = document.createElement('div');
            imgContainer.className = "relative group rounded-lg overflow-hidden shadow-sm border border-gray-100";
            imgContainer.innerHTML = `
                <img src="${url}" class="w-full h-auto object-cover max-h-[500px]" alt="Arte">
                <a href="${url}" target="_blank" class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span class="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-700 text-xs px-3 py-1 rounded-full shadow-lg font-bold">
                        <i class="fa-solid fa-expand mr-1"></i> Ver Original
                    </span>
                </a>
            `;
            DOM.mockupGallery.appendChild(imgContainer);
        });
    } else {
        DOM.mockupGallery.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Nenhuma imagem anexada.</p>';
    }

    // 3. Itens
    DOM.itemsTable.innerHTML = '';
    (order.parts || []).forEach(p => {
        let detailsHtml = `<span class="font-bold text-gray-700">${p.type}</span>`;
        detailsHtml += `<div class="text-xs text-gray-500 mt-0.5">${p.material} | ${p.colorMain}</div>`;
        
        if (p.partInputType === 'comum') {
            if (p.sizes) {
                const sizesStr = Object.entries(p.sizes).map(([cat, sizesObj]) => {
                    const s = Object.entries(sizesObj).filter(([,q]) => q > 0).map(([k,v]) => `${k}(${v})`).join(', ');
                    return s ? `<div class="mt-1"><span class="font-semibold text-gray-600 text-[10px] uppercase">${cat}:</span> ${s}</div>` : '';
                }).join('');
                detailsHtml += sizesStr;
            }
            if(p.specifics && p.specifics.length) detailsHtml += `<div class="mt-1 text-xs text-blue-600"><i class="fa-solid fa-ruler-combined mr-1"></i>${p.specifics.length} item(s) sob medida</div>`;
        } else if (p.details && p.details.length) {
            detailsHtml += `<div class="mt-1 text-xs bg-slate-50 p-1 rounded border border-slate-100">
                <div class="font-semibold text-gray-500 mb-1">Lista de Nomes (${p.details.length}):</div>
                ${p.details.map(d => `<span class="inline-block bg-white border px-1 rounded mr-1 mb-1">${d.name} (${d.size})</span>`).join('')}
            </div>`;
        }
        const totalQty = (Object.values(p.sizes || {}).flatMap(x=>Object.values(x)).reduce((a,b)=>a+b,0)) + (p.specifics?.length||0) + (p.details?.length||0);
        const row = document.createElement('tr');
        row.innerHTML = `<td class="p-3 align-top border-b border-gray-50">${detailsHtml}</td><td class="p-3 align-top text-center font-bold text-gray-700 border-b border-gray-50">${totalQty}</td>`;
        DOM.itemsTable.appendChild(row);
    });

    // 4. --- CARD FINANCEIRO (NOVO) ---
    const finance = calculateTotals(order);
    const financeHtml = `
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 space-y-2 text-sm">
            <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${formatMoney(finance.grossTotal)}</span>
            </div>
            ${finance.discount > 0 ? `
            <div class="flex justify-between text-green-600">
                <span>Desconto</span>
                <span>- ${formatMoney(finance.discount)}</span>
            </div>` : ''}
            <div class="flex justify-between text-gray-800 font-bold border-t border-slate-200 pt-2 mt-2">
                <span>Total do Pedido</span>
                <span>${formatMoney(finance.total)}</span>
            </div>
            ${finance.paid > 0 ? `
            <div class="flex justify-between text-blue-600 mt-1">
                <span>Já Pago (Sinal)</span>
                <span>- ${formatMoney(finance.paid)}</span>
            </div>` : ''}
            <div class="flex justify-between text-red-600 font-bold text-base mt-2 pt-2 border-t border-slate-200 bg-white p-2 rounded shadow-sm">
                <span>Restante a Pagar</span>
                <span>${formatMoney(finance.remaining)}</span>
            </div>
        </div>
    `;
    
    // Injeta o card financeiro APÓS a tabela (usamos insertAdjacentHTML para não quebrar referências)
    // Remove anterior se houver para evitar duplicação em re-render
    const oldFinance = document.getElementById('financeCardDisplay');
    if(oldFinance) oldFinance.remove();
    
    const financeContainer = document.createElement('div');
    financeContainer.id = 'financeCardDisplay';
    financeContainer.innerHTML = financeHtml;
    DOM.itemsTable.parentElement.parentElement.after(financeContainer); // Coloca depois da tabela

    // 5. Observações
    if (order.generalObservation) {
        DOM.obs.textContent = order.generalObservation;
        DOM.obs.className = "text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100";
    }

    // 6. Controle do Footer
    const isActionable = ['Pendente', 'Aguardando Aprovação', 'Alteração Solicitada'].includes(order.orderStatus);
    
    if (isActionable) {
        DOM.loading.classList.add('hidden');
        DOM.content.classList.remove('hidden');
        DOM.footer.classList.remove('hidden');
    } else {
        DOM.loading.classList.add('hidden');
        DOM.content.classList.remove('hidden');
        DOM.footer.classList.add('hidden');
        const alertDiv = document.createElement('div');
        alertDiv.className = "bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm text-center mb-4";
        alertDiv.innerHTML = `<i class="fa-solid fa-lock mr-2"></i>Este pedido já está em: <strong>${statusConfig.label}</strong>.`;
        const existingAlert = DOM.content.querySelector('.bg-blue-50');
        if (existingAlert) existingAlert.remove();
        DOM.content.prepend(alertDiv);
    }
};

// --- Ações ---

// APROVAR (Com Lógica de PIX)
DOM.btnApprove.addEventListener('click', async () => {
    if (!currentOrderDoc || !currentOrderData) return;

    // 1. Calcular Valores
    const finance = calculateTotals(currentOrderData);
    const requiredEntry = finance.total * PAYMENT_CONFIG.entryPercentage; // Meta de entrada
    const pendingEntry = requiredEntry - finance.paid; // Quanto falta para atingir a meta

    // 2. Confirmação Inicial
    const confirmed = confirm("Tem certeza que deseja APROVAR este layout?");
    if (!confirmed) return;

    DOM.btnApprove.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';
    DOM.btnApprove.disabled = true;

    try {
        // Atualiza status no banco
        await updateDoc(currentOrderDoc, {
            orderStatus: 'Aprovado pelo Cliente',
            approvalDate: new Date().toISOString(),
            approvalMeta: { userAgent: navigator.userAgent, timestamp: Date.now() }
        });

        // 3. Decide qual Modal mostrar (PIX ou Sucesso Simples)
        if (pendingEntry > 0.01) { // Se falta pagar entrada (margem de centavos)
            
            // Link do Zap com mensagem pré-formatada
            const phone = "55" + currentOrderData.clientPhone.replace(/\D/g, '') || ""; // Tenta pegar do pedido ou usa genérico se vazio
            const zapMsg = `Olá! Acabei de aprovar meu pedido (${currentOrderData.clientName}). Segue o comprovante do adiantamento de ${formatMoney(pendingEntry)}.`;
            const zapLink = `https://wa.me/?text=${encodeURIComponent(zapMsg)}`; // Abre lista de contatos ou número específico se tivermos

            showModal(`
                <div class="text-center">
                    <div class="text-green-500 text-5xl mb-3"><i class="fa-solid fa-circle-check"></i></div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">Arte Aprovada!</h3>
                    <p class="text-gray-600 text-sm mb-4">Para iniciar a produção, é necessário um adiantamento.</p>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                        <p class="text-sm text-gray-700 mb-1">Valor do Adiantamento:</p>
                        <p class="text-2xl font-bold text-gray-900 mb-3">${formatMoney(pendingEntry)}</p>
                        
                        <p class="text-xs font-bold text-gray-500 uppercase mb-1">Chave PIX:</p>
                        <div class="flex gap-2">
                            <input type="text" value="${PAYMENT_CONFIG.pixKey}" id="pixKeyInput" readonly class="w-full bg-white border p-2 rounded text-sm font-mono text-gray-700">
                            <button id="btnCopyPix" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded font-bold transition">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                        <p class="text-center text-xs text-gray-400 mt-1">Beneficiário: ${PAYMENT_CONFIG.pixBeneficiary}</p>
                    </div>

                    <a href="${zapLink}" target="_blank" class="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition mb-2 shadow-lg flex items-center justify-center gap-2">
                        <i class="fa-brands fa-whatsapp"></i> Enviar Comprovante
                    </a>
                    <button onclick="location.reload()" class="text-gray-400 text-sm hover:text-gray-600 underline">Fechar</button>
                </div>
            `);

            // Lógica do botão Copiar
            document.getElementById('btnCopyPix').onclick = () => {
                const input = document.getElementById('pixKeyInput');
                input.select();
                input.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(input.value).then(() => {
                    const btn = document.getElementById('btnCopyPix');
                    btn.innerHTML = '<i class="fa-solid fa-check text-green-600"></i>';
                    setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
                });
            };

        } else {
            // Sucesso Simples (Já estava pago)
            showModal(`
                <div class="text-center">
                    <div class="text-green-500 text-5xl mb-4"><i class="fa-solid fa-circle-check"></i></div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Tudo Certo!</h3>
                    <p class="text-gray-600">O layout foi aprovado e o pagamento está OK.</p>
                    <p class="text-blue-600 font-bold mt-2">A produção será iniciada.</p>
                    <button onclick="location.reload()" class="mt-6 bg-gray-800 text-white px-6 py-2 rounded-lg w-full">OK</button>
                </div>
            `);
        }
        
        DOM.footer.classList.add('hidden');

    } catch (error) {
        console.error("Erro ao aprovar:", error);
        alert("Ocorreu um erro. Tente novamente.");
        DOM.btnApprove.innerHTML = '<i class="fa-solid fa-check-double"></i> APROVAR ARTE';
        DOM.btnApprove.disabled = false;
    }
});

// SOLICITAR ALTERAÇÃO
DOM.btnRequest.addEventListener('click', () => {
    showModal(`
        <h3 class="text-lg font-bold text-gray-800 mb-2 text-left">O que precisa ser ajustado?</h3>
        <textarea id="changeReason" class="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32" placeholder="Ex: O nome 'João' está errado..."></textarea>
        <div class="flex gap-3 mt-4">
            <button id="cancelModal" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold">Cancelar</button>
            <button id="confirmChange" class="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600">Enviar Solicitação</button>
        </div>
    `);

    document.getElementById('cancelModal').onclick = closeModal;
    
    document.getElementById('confirmChange').onclick = async () => {
        const reason = document.getElementById('changeReason').value.trim();
        if (!reason) return alert("Descreva o ajuste.");

        const btn = document.getElementById('confirmChange');
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...';
        btn.disabled = true;

        try {
            const newObs = (currentOrderData.generalObservation || '') + `\n\n[Solicitação do Cliente em ${new Date().toLocaleDateString()}]: ${reason}`;

            await updateDoc(currentOrderDoc, {
                orderStatus: 'Alteração Solicitada',
                generalObservation: newObs
            });

            showModal(`
                <div class="text-center">
                    <div class="text-blue-500 text-5xl mb-4"><i class="fa-solid fa-paper-plane"></i></div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Solicitação Enviada</h3>
                    <p class="text-gray-600">Recebemos seu pedido de ajuste.</p>
                    <button onclick="location.reload()" class="mt-6 bg-gray-800 text-white px-6 py-2 rounded-lg w-full">OK</button>
                </div>
            `);

        } catch (error) {
            console.error("Erro ao solicitar:", error);
            alert("Erro ao enviar solicitação.");
            closeModal();
        }
    };
});

// Inicializar
loadOrder();
