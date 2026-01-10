// js/public/fillOrder.js
// ========================================================
// MÓDULO PÚBLICO: PREENCHIMENTO DE PEDIDOS (v3.0 - Branding & Sorting)
// Responsabilidade: Salvar dados FORMATADOS, ORGANIZADOS e com BRANDING.
// ========================================================

import { 
    doc, 
    getDoc, 
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from '../firebaseConfig.js';

// --- 1. CONFIGURAÇÃO DE DADOS ---

// Tradução: Código Técnico -> Texto Humano
const sizeLabels = {
    // Baby Look
    'BL-PP': 'PP (Baby Look)', 'BL-P':  'P (Baby Look)', 'BL-M':  'M (Baby Look)',
    'BL-G':  'G (Baby Look)', 'BL-GG': 'GG (Baby Look)', 'BL-XG': 'XG (Baby Look)',
    // Normal
    'PP': 'PP (Normal)', 'P':  'P (Normal)', 'M':  'M (Normal)',
    'G':  'G (Normal)', 'GG': 'GG (Normal)', 'XG': 'XG (Normal)',
    // Infantil
    '2':  '2 anos (Infantil)', '4':  '4 anos (Infantil)', '6':  '6 anos (Infantil)',
    '8':  '8 anos (Infantil)', '10': '10 anos (Infantil)', '12': '12 anos (Infantil)'
};

// Pesos para Ordenação (Baby Look < Normal < Infantil)
const sizeWeights = {
    // Baby Look (100-199)
    'PP (Baby Look)': 100, 'P (Baby Look)': 101, 'M (Baby Look)': 102,
    'G (Baby Look)': 103, 'GG (Baby Look)': 104, 'XG (Baby Look)': 105,
    // Normal (200-299)
    'PP (Normal)': 200, 'P (Normal)': 201, 'M (Normal)': 202,
    'G (Normal)': 203, 'GG (Normal)': 204, 'XG (Normal)': 205,
    // Infantil (300-399)
    '2 anos (Infantil)': 300, '4 anos (Infantil)': 301, '6 anos (Infantil)': 302,
    '8 anos (Infantil)': 303, '10 anos (Infantil)': 304, '12 anos (Infantil)': 305
};

// --- 2. ESTADO ---
const state = {
    companyId: null,
    orderId: null,
    partIndex: null,
    orderData: null,
    targetPart: null,
    items: [],
    lastSentItems: [] 
};

// --- 3. DOM ---
const DOM = {
    // Header & Branding
    defaultHeader: document.getElementById('defaultHeader'),
    companyLogo: document.getElementById('companyLogo'),
    statusBadge: document.getElementById('statusBadge'),
    
    // Info e Form
    orderInfo: document.getElementById('orderInfo'),
    clientName: document.getElementById('clientName'), 
    deliveryDate: document.getElementById('deliveryDate'),
    companyPhone: document.getElementById('companyPhone'), // Novo
    
    inputForm: document.getElementById('inputForm'),
    itemName: document.getElementById('itemName'),
    itemNumber: document.getElementById('itemNumber'),
    itemSize: document.getElementById('itemSize'),
    addItemBtn: document.getElementById('addItemBtn'),
    
    // Listas e Footer
    listContainer: document.getElementById('listContainer'),
    itemsList: document.getElementById('itemsList'),
    listCountBadge: document.getElementById('listCountBadge'),
    fixedFooter: document.getElementById('fixedFooter'),
    totalItemsDisplay: document.getElementById('totalItemsDisplay'),
    saveListBtn: document.getElementById('saveListBtn'),
    
    // Feedback
    successModal: document.getElementById('successModal'),
    summaryListContent: document.getElementById('summaryListContent'),
    copySummaryBtn: document.getElementById('copySummaryBtn'),
    feedback: document.getElementById('feedbackMessage')
};

// --- 4. INICIALIZAÇÃO ---
async function init() {
    const params = new URLSearchParams(window.location.search);
    state.companyId = params.get('cid');
    state.orderId = params.get('oid');
    const indexParam = params.get('partIndex');

    if (!state.companyId || !state.orderId || indexParam === null) {
        showError("Link inválido.");
        return;
    }
    state.partIndex = parseInt(indexParam);

    try {
        updateStatus("Carregando...", "blue");

        // Busca Paralela: Pedido e Configurações da Empresa (Logo/Zap)
        const [orderSnap, configSnap] = await Promise.all([
            getDoc(doc(db, "companies", state.companyId, "orders", state.orderId)),
            getDoc(doc(db, `companies/${state.companyId}/config/payment`))
        ]);

        // 4.1 Validação do Pedido
        if (!orderSnap.exists()) { showError("Pedido não encontrado."); return; }
        state.orderData = orderSnap.data();
        
        if (['Entregue', 'Finalizado', 'Cancelado'].includes(state.orderData.orderStatus)) {
            showError("Pedido já encerrado."); return;
        }

        if (!state.orderData.parts || !state.orderData.parts[state.partIndex]) {
            showError("Peça não encontrada."); return;
        }

        state.targetPart = state.orderData.parts[state.partIndex];
        if (state.targetPart.partInputType !== 'detalhado') {
            showError("Esta peça não aceita lista de nomes."); return;
        }

        // 4.2 Aplicação do Branding (Empresa)
        applyBranding(configSnap.exists() ? configSnap.data() : null);

        // 4.3 Renderização
        renderInterface();
        DOM.inputForm.classList.remove('hidden');
        if(DOM.feedback) DOM.feedback.classList.add('hidden');
        updateStatus("Conectado", "green");
        
    } catch (error) {
        console.error("Init Error:", error);
        showError("Erro de conexão.");
    }
}

function applyBranding(config) {
    if (!config) return;

    // Logo
    if (config.logoUrl && DOM.companyLogo && DOM.defaultHeader) {
        DOM.companyLogo.src = config.logoUrl;
        DOM.companyLogo.classList.remove('hidden');
        DOM.defaultHeader.classList.add('hidden');
    }

    // Telefone / WhatsApp
    if (config.whatsapp && DOM.companyPhone) {
        // Formata o telefone visualmente (assumindo 5588999999999)
        const phone = config.whatsapp.replace(/\D/g, '');
        const displayPhone = phone.length > 10 
            ? `(${phone.slice(2,4)}) ${phone.slice(4,9)}-${phone.slice(9)}`
            : phone;
        
        DOM.companyPhone.textContent = `Dúvidas? Fale conosco: ${displayPhone}`;
        DOM.companyPhone.classList.remove('hidden');
    }
}

// --- 5. RENDERIZAÇÃO ---
function renderInterface() {
    DOM.orderInfo.classList.remove('hidden');
    // Preenche info básica
    document.title = `${state.targetPart.type} - Preenchimento`;
    // Usa optional chaining para segurança
    if(DOM.defaultHeader.querySelector('h1')) DOM.defaultHeader.querySelector('h1').textContent = state.targetPart.type;
    if(DOM.defaultHeader.querySelector('p')) DOM.defaultHeader.querySelector('p').textContent = state.orderData.clientName;
    
    if(DOM.clientName) DOM.clientName.innerHTML = `<span class="text-gray-500 text-xs uppercase block">Modelo</span> ${state.targetPart.material || 'Padrão'}`;
    if(DOM.deliveryDate) DOM.deliveryDate.innerHTML = `<span class="text-gray-500 text-xs uppercase block">Cor Predom.</span> ${state.targetPart.colorMain || 'Única'}`;
}

function updateListUI() {
    DOM.itemsList.innerHTML = '';
    DOM.listCountBadge.textContent = state.items.length;
    DOM.totalItemsDisplay.textContent = `${state.items.length} novos itens`;

    state.items.length > 0 
        ? (DOM.listContainer.classList.remove('hidden'), DOM.fixedFooter.classList.remove('hidden'))
        : (DOM.listContainer.classList.add('hidden'), DOM.fixedFooter.classList.add('hidden'));

    state.items.forEach((item, index) => {
        // Ícone Visual: Pega a primeira letra/sigla (ex: "P" de "P (Normal)")
        const shortSize = item.size.split(' ')[0]; 

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center fade-in mb-2";
        
        // Renderiza visualmente. Nota: item.name pode estar misto (Ex: João Silva)
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-indigo-100 text-indigo-700 font-bold w-12 h-10 flex items-center justify-center rounded-lg text-xs p-1 text-center leading-tight">
                   ${shortSize}
                </div>
                <div>
                    <p class="font-bold text-gray-800 leading-none">${item.name}</p>
                    <p class="text-xs text-gray-500 mt-1">
                        ${item.size} ${item.number ? `• Nº ${item.number}` : ''}
                    </p>
                </div>
            </div>
            <button onclick="removeItem(${index})" class="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        DOM.itemsList.appendChild(card);
    });
}

window.removeItem = (index) => {
    state.items.splice(index, 1);
    updateListUI();
};

// --- 6. RENDERIZAÇÃO DO RESUMO FINAL ---
function renderSuccessSummary(items) {
    DOM.summaryListContent.innerHTML = '';
    
    if(!items || items.length === 0) return;

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center text-sm p-3 bg-white rounded border border-gray-200 shadow-sm";
        
        // Padrão solicitado: Mônica - P (Baby Look) - 6
        div.innerHTML = `
            <div class="flex-1">
                <span class="font-bold text-gray-800">${item.name}</span>
                <span class="text-gray-400 mx-1">-</span>
                <span class="font-semibold text-indigo-700">${item.size}</span>
                ${item.number ? `<span class="text-gray-400 mx-1">-</span> <span class="text-gray-800 font-mono">${item.number}</span>` : ''}
            </div>
        `;
        DOM.summaryListContent.appendChild(div);
    });
}

// --- 7. AÇÕES PRINCIPAIS ---

// Adicionar Item (Memória Local)
DOM.addItemBtn.addEventListener('click', () => {
    const name = DOM.itemName.value.trim();
    const number = DOM.itemNumber.value.trim();
    const rawSize = DOM.itemSize.value; // Ex: BL-P

    if (!name) { alert("Digite o nome."); DOM.itemName.focus(); return; }
    if (!rawSize) { alert("Escolha um tamanho."); DOM.itemSize.focus(); return; }

    // Tradução Imediata (Clean Data)
    const prettySize = sizeLabels[rawSize] || rawSize;

    // CRÍTICO: Não usamos toUpperCase() no nome para manter a escolha do cliente.
    state.items.push({ 
        name: name, 
        number: number || "", 
        size: prettySize 
    });

    DOM.itemName.value = '';
    DOM.itemNumber.value = '';
    DOM.itemName.focus(); 
    updateListUI();
    DOM.listContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
});

// Helper de Ordenação
function getWeight(sizeStr) {
    return sizeWeights[sizeStr] || 999; // Se não achar, joga pro final
}

// Enviar Tudo (Salvar no Firestore)
DOM.saveListBtn.addEventListener('click', async () => {
    if (state.items.length === 0) return;
    if (!confirm(`Confirma o envio de ${state.items.length} itens para a fábrica?`)) return;

    const originalText = DOM.saveListBtn.innerHTML;
    DOM.saveListBtn.disabled = true;
    DOM.saveListBtn.innerHTML = `Organizando e Enviando...`;

    try {
        // 1. Reordena a lista atual (Baby Look -> Normal -> Infantil)
        state.items.sort((a, b) => getWeight(a.size) - getWeight(b.size));

        // 2. Prepara atualização
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);
        const freshSnap = await getDoc(orderRef);
        
        if (!freshSnap.exists()) throw new Error("Pedido não encontrado.");
        
        const updatedParts = [...freshSnap.data().parts];
        if(!updatedParts[state.partIndex]) throw new Error("Peça original foi removida.");

        if (!updatedParts[state.partIndex].details) updatedParts[state.partIndex].details = [];
        
        // 3. Injeta os dados ordenados
        updatedParts[state.partIndex].details.push(...state.items);

        // 4. Salva no Banco
        await updateDoc(orderRef, { parts: updatedParts });

        // 5. Sucesso
        state.lastSentItems = [...state.items]; // Guarda cópia ordenada
        state.items = []; 
        
        renderSuccessSummary(state.lastSentItems);
        DOM.successModal.classList.remove('hidden');
        updateListUI(); 

    } catch (error) {
        console.error("Save Error:", error);
        alert(`Erro ao salvar: ${error.message}`);
    } finally {
        DOM.saveListBtn.disabled = false;
        DOM.saveListBtn.innerHTML = originalText;
    }
});

// Botão Copiar (Formato WhatsApp)
if(DOM.copySummaryBtn) {
    DOM.copySummaryBtn.addEventListener('click', async () => {
        if(!state.lastSentItems.length) return;

        let textToCopy = `*LISTA ENVIADA - ${state.targetPart.type.toUpperCase()}*\n`;
        textToCopy += `Pedido: ${state.orderData.clientName}\n`;
        textToCopy += `----------------------------------\n`;

        // Itens já estão ordenados aqui
        state.lastSentItems.forEach(item => {
            const numberPart = item.number ? ` - ${item.number}` : '';
            textToCopy += `${item.name} - ${item.size}${numberPart}\n`;
        });
        
        textToCopy += `----------------------------------\n`;
        textToCopy += `Total: ${state.lastSentItems.length} itens.`;

        try {
            await navigator.clipboard.writeText(textToCopy);
            
            const originalHtml = DOM.copySummaryBtn.innerHTML;
            DOM.copySummaryBtn.innerHTML = `✅ Copiado!`;
            DOM.copySummaryBtn.classList.add('bg-green-100', 'text-green-700', 'border-green-200');
            DOM.copySummaryBtn.classList.remove('bg-indigo-50', 'text-indigo-700');
            
            setTimeout(() => {
                DOM.copySummaryBtn.innerHTML = originalHtml;
                DOM.copySummaryBtn.classList.remove('bg-green-100', 'text-green-700', 'border-green-200');
                DOM.copySummaryBtn.classList.add('bg-indigo-50', 'text-indigo-700');
            }, 2000);

        } catch (err) {
            alert("Erro ao copiar. Tente selecionar manualmente.");
        }
    });
}

// Helpers Visuais
function showError(msg) {
    if(DOM.feedback) {
        DOM.feedback.innerHTML = `<div class="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm text-center"><p class="font-bold text-lg text-gray-800">Atenção</p><p class="text-sm mt-1">${msg}</p></div>`;
        DOM.feedback.classList.remove('hidden');
    }
    if(DOM.inputForm) DOM.inputForm.classList.add('hidden');
    if(DOM.orderInfo) DOM.orderInfo.classList.add('hidden');
    if(DOM.fixedFooter) DOM.fixedFooter.classList.add('hidden');
    if(DOM.statusBadge) DOM.statusBadge.parentElement.classList.add('hidden'); // Esconde header se erro fatal
}

function updateStatus(text, color) {
    if(DOM.statusBadge) {
        DOM.statusBadge.textContent = text;
        DOM.statusBadge.className = `text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-800 border border-${color}-200 font-medium`;
    }
}

// Inicializa
init();
