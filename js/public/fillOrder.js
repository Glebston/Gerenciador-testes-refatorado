// js/public/fillOrder.js
// ========================================================
// MÓDULO PÚBLICO: PREENCHIMENTO DE PEDIDOS (v2.3 - Clean Data)
// Responsabilidade: Salvar dados JÁ FORMATADOS no Banco.
// ========================================================

import { 
    doc, 
    getDoc, 
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from '../firebaseConfig.js';

// --- 1. DICIONÁRIO DE TRADUÇÃO ---
// Usado para converter o código do HTML em texto final AGORA.
const sizeLabels = {
    // Baby Look
    'BL-PP': 'PP (Baby Look)', 
    'BL-P':  'P (Baby Look)', 
    'BL-M':  'M (Baby Look)',
    'BL-G':  'G (Baby Look)', 
    'BL-GG': 'GG (Baby Look)', 
    'BL-XG': 'XG (Baby Look)',
    
    // Normal / Unissex
    'PP': 'PP (Normal)', 
    'P':  'P (Normal)', 
    'M':  'M (Normal)',
    'G':  'G (Normal)', 
    'GG': 'GG (Normal)', 
    'XG': 'XG (Normal)',
    
    // Infantil
    '2':  '2 anos (Infantil)', 
    '4':  '4 anos (Infantil)', 
    '6':  '6 anos (Infantil)', 
    '8':  '8 anos (Infantil)',
    '10': '10 anos (Infantil)', 
    '12': '12 anos (Infantil)'
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
    headerTitle: document.querySelector('header h1'),
    subTitle: document.querySelector('header p'),
    statusBadge: document.getElementById('statusBadge'),
    orderInfo: document.getElementById('orderInfo'),
    clientName: document.getElementById('clientName'), 
    deliveryDate: document.getElementById('deliveryDate'),
    totalItemsDisplay: document.getElementById('totalItemsDisplay'),
    inputForm: document.getElementById('inputForm'),
    itemName: document.getElementById('itemName'),
    itemNumber: document.getElementById('itemNumber'),
    itemSize: document.getElementById('itemSize'),
    addItemBtn: document.getElementById('addItemBtn'),
    listContainer: document.getElementById('listContainer'),
    itemsList: document.getElementById('itemsList'),
    listCountBadge: document.getElementById('listCountBadge'),
    fixedFooter: document.getElementById('fixedFooter'),
    saveListBtn: document.getElementById('saveListBtn'),
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
        updateStatus("Verificando...", "blue");
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);
        const snap = await getDoc(orderRef);

        if (!snap.exists()) { showError("Pedido não encontrado."); return; }
        state.orderData = snap.data();
        
        if (['Entregue', 'Finalizado', 'Cancelado'].includes(state.orderData.orderStatus)) {
            showError("Pedido encerrado."); return;
        }

        if (!state.orderData.parts || !state.orderData.parts[state.partIndex]) {
            showError("Peça não encontrada."); return;
        }

        state.targetPart = state.orderData.parts[state.partIndex];
        if (state.targetPart.partInputType !== 'detalhado') {
            showError("Esta peça não aceita lista."); return;
        }

        renderInterface();
        DOM.inputForm.classList.remove('hidden');
        if(DOM.feedback) DOM.feedback.classList.add('hidden');
        updateStatus("Conectado", "green");
        
    } catch (error) {
        console.error("Init Error:", error);
        showError("Erro de conexão.");
    }
}

// --- 5. RENDERIZAÇÃO ---
function renderInterface() {
    DOM.orderInfo.classList.remove('hidden');
    if(DOM.headerTitle) DOM.headerTitle.textContent = state.targetPart.type; 
    if(DOM.subTitle) DOM.subTitle.textContent = `Pedido: ${state.orderData.clientName}`; 
    if(DOM.clientName) DOM.clientName.innerHTML = `<span class="text-gray-500 text-xs uppercase block">Material</span> ${state.targetPart.material || 'N/A'}`;
    if(DOM.deliveryDate) DOM.deliveryDate.innerHTML = `<span class="text-gray-500 text-xs uppercase block">Cor</span> ${state.targetPart.colorMain || 'N/A'}`;
}

function updateListUI() {
    DOM.itemsList.innerHTML = '';
    DOM.listCountBadge.textContent = state.items.length;
    DOM.totalItemsDisplay.textContent = `${state.items.length} novos itens`;

    state.items.length > 0 
        ? (DOM.listContainer.classList.remove('hidden'), DOM.fixedFooter.classList.remove('hidden'))
        : (DOM.listContainer.classList.add('hidden'), DOM.fixedFooter.classList.add('hidden'));

    state.items.forEach((item, index) => {
        // Badge Visual: Pega só a primeira parte (ex: "P" de "P (Normal)") para o ícone
        const shortSize = item.size.split(' ')[0]; 

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center fade-in mb-2";
        
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-indigo-100 text-indigo-700 font-bold w-12 h-10 flex items-center justify-center rounded-lg text-xs p-1 text-center leading-tight">
                   ${shortSize}
                </div>
                <div>
                    <p class="font-bold text-gray-800 uppercase leading-none">${item.name}</p>
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
        
        // Padrão solicitado: Francisca - M (Baby Look) - 4
        div.innerHTML = `
            <div class="flex-1">
                <span class="font-bold text-gray-800 uppercase">${item.name}</span>
                <span class="text-gray-500 mx-1">-</span>
                <span class="font-semibold text-indigo-700">${item.size}</span>
                ${item.number ? `<span class="text-gray-500 mx-1">-</span> <span class="text-gray-800 font-mono">${item.number}</span>` : ''}
            </div>
        `;
        DOM.summaryListContent.appendChild(div);
    });
}

// --- 7. AÇÕES ---
DOM.addItemBtn.addEventListener('click', () => {
    const name = DOM.itemName.value.trim();
    const number = DOM.itemNumber.value.trim();
    const rawSize = DOM.itemSize.value; // Ex: BL-P

    if (!name) { alert("Digite o nome."); DOM.itemName.focus(); return; }
    if (!rawSize) { alert("Escolha um tamanho."); DOM.itemSize.focus(); return; }

    // TRADUÇÃO IMEDIATA: Salvamos "P (Baby Look)" e não "BL-P"
    const prettySize = sizeLabels[rawSize] || rawSize;

    state.items.push({ 
        name: name.toUpperCase(), 
        number: number || "", 
        size: prettySize // <--- O segredo está aqui
    });

    DOM.itemName.value = '';
    DOM.itemNumber.value = '';
    DOM.itemName.focus(); 
    updateListUI();
    DOM.listContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
});

DOM.saveListBtn.addEventListener('click', async () => {
    if (state.items.length === 0) return;
    if (!confirm(`Confirma o envio de ${state.items.length} itens?`)) return;

    const originalText = DOM.saveListBtn.innerHTML;
    DOM.saveListBtn.disabled = true;
    DOM.saveListBtn.innerHTML = `Enviando...`;

    try {
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);
        
        const freshSnap = await getDoc(orderRef);
        if (!freshSnap.exists()) throw new Error("Pedido não existe.");
        
        const updatedParts = [...freshSnap.data().parts];
        if(!updatedParts[state.partIndex]) throw new Error("Peça não encontrada.");

        if (!updatedParts[state.partIndex].details) updatedParts[state.partIndex].details = [];
        
        // Injeta os dados JÁ FORMATADOS no banco
        updatedParts[state.partIndex].details.push(...state.items);

        await updateDoc(orderRef, { parts: updatedParts });

        state.lastSentItems = [...state.items]; 
        state.items = []; 
        renderSuccessSummary(state.lastSentItems);
        DOM.successModal.classList.remove('hidden');
        updateListUI(); 

    } catch (error) {
        console.error("Save Error:", error);
        alert(`Erro: ${error.message}`);
    } finally {
        DOM.saveListBtn.disabled = false;
        DOM.saveListBtn.innerHTML = originalText;
    }
});

// Botão Copiar para WhatsApp (Padrão exato)
if(DOM.copySummaryBtn) {
    DOM.copySummaryBtn.addEventListener('click', async () => {
        if(!state.lastSentItems.length) return;

        let textToCopy = `*LISTA ENVIADA - ${state.targetPart.type.toUpperCase()}*\n`;
        textToCopy += `Pedido: ${state.orderData.clientName}\n`;
        textToCopy += `----------------------------------\n`;

        // Padrão: Francisca - M (Baby Look) - 4
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
            alert("Erro ao copiar.");
        }
    });
}

// Helpers
function showError(msg) {
    if(DOM.feedback) {
        DOM.feedback.innerHTML = `<div class="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm text-center"><p class="font-bold text-lg text-gray-800">Atenção</p><p class="text-sm mt-1">${msg}</p></div>`;
        DOM.feedback.classList.remove('hidden');
    }
    if(DOM.inputForm) DOM.inputForm.classList.add('hidden');
    if(DOM.orderInfo) DOM.orderInfo.classList.add('hidden');
    if(DOM.fixedFooter) DOM.fixedFooter.classList.add('hidden');
}

function updateStatus(text, color) {
    if(DOM.statusBadge) {
        DOM.statusBadge.textContent = text;
        DOM.statusBadge.className = `text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-800 border border-${color}-200 font-medium`;
    }
}

init();
