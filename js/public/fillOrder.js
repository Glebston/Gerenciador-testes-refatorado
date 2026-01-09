// js/public/fillOrder.js
// ========================================================
// MÓDULO PÚBLICO: PREENCHIMENTO DE PEDIDOS (v2.0 - Deep Link)
// Responsabilidade: Interface pública para preenchimento
// de grade detalhada (Nome/Número) em uma peça ESPECÍFICA.
// ========================================================

import { 
    doc, 
    getDoc, 
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importação da instância já inicializada
import { db } from '../firebaseConfig.js';

// --- ESTADO DA APLICAÇÃO ---
const state = {
    companyId: null,
    orderId: null,
    partIndex: null, // Novo: Índice da peça no array parts
    orderData: null,
    targetPart: null, // Objeto da peça específica
    items: [] // Lista temporária (Staging)
};

// --- ELEMENTOS DO DOM ---
const DOM = {
    // Header Info
    headerTitle: document.querySelector('header h1'),
    subTitle: document.querySelector('header p'),
    statusBadge: document.getElementById('statusBadge'),
    orderInfo: document.getElementById('orderInfo'),
    clientName: document.getElementById('clientName'), // Agora mostra nome da peça
    deliveryDate: document.getElementById('deliveryDate'), // Agora mostra material/cor
    totalItemsDisplay: document.getElementById('totalItemsDisplay'),
    
    // Formulário
    inputForm: document.getElementById('inputForm'),
    itemName: document.getElementById('itemName'),
    itemNumber: document.getElementById('itemNumber'),
    itemSize: document.getElementById('itemSize'),
    addItemBtn: document.getElementById('addItemBtn'),
    
    // Lista e Footer
    listContainer: document.getElementById('listContainer'),
    itemsList: document.getElementById('itemsList'),
    listCountBadge: document.getElementById('listCountBadge'),
    fixedFooter: document.getElementById('fixedFooter'),
    saveListBtn: document.getElementById('saveListBtn'),
    
    // Feedback
    feedback: document.getElementById('feedbackMessage'),
    successModal: document.getElementById('successModal')
};

// ========================================================
// 1. CORE: CARREGAMENTO E VALIDAÇÃO DE CONTEXTO
// ========================================================

async function init() {
    // 1. Ler parâmetros da URL (?cid=...&oid=...&partIndex=...)
    const params = new URLSearchParams(window.location.search);
    state.companyId = params.get('cid');
    state.orderId = params.get('oid');
    const indexParam = params.get('partIndex');

    // Validação Inicial de URL
    if (!state.companyId || !state.orderId || indexParam === null) {
        showError("Link incompleto ou inválido. Solicite um novo link à fábrica.");
        return;
    }

    state.partIndex = parseInt(indexParam);

    try {
        updateStatus("Verificando link...", "blue");
        
        // 2. Buscar o documento do pedido
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);
        const snap = await getDoc(orderRef);

        if (!snap.exists()) {
            showError("Pedido não encontrado.");
            return;
        }

        state.orderData = snap.data();
        
        // 3. Validação de Segurança do Pedido
        if (['Entregue', 'Finalizado', 'Cancelado'].includes(state.orderData.orderStatus)) {
            showError("Este pedido já foi encerrado e não aceita edições.");
            return;
        }

        // 4. Validação da Peça (Deep Link Logic)
        if (!state.orderData.parts || !state.orderData.parts[state.partIndex]) {
            showError("A peça especificada neste link não existe mais no pedido.");
            return;
        }

        state.targetPart = state.orderData.parts[state.partIndex];

        // Verifica se a peça é do tipo correto para receber nomes
        if (state.targetPart.partInputType !== 'detalhado') {
            showError("Esta peça não requer lista de nomes/números.");
            return;
        }

        // 5. Sucesso: Renderizar Interface Específica
        renderInterface();
        DOM.inputForm.classList.remove('hidden');
        DOM.feedback.classList.add('hidden');
        updateStatus("Conectado", "green");
        
    } catch (error) {
        console.error("Erro na inicialização:", error);
        showError("Erro de conexão com o servidor.");
    }
}

// ========================================================
// 2. LÓGICA DE INTERFACE (UI)
// ========================================================

function renderInterface() {
    DOM.orderInfo.classList.remove('hidden');
    
    // Ajuste de Texto: Foco na PEÇA, não no cliente geral
    DOM.headerTitle.textContent = state.targetPart.type; // Ex: "Camisa Titular"
    DOM.subTitle.textContent = `Pedido: ${state.orderData.clientName}`; 

    // Reutilizando os campos de info para mostrar dados da peça
    // Label "Cliente" vira "Material" visualmente no contexto (ou mantemos a estrutura)
    // Para simplificar sem mudar o HTML, injetamos texto descritivo:
    DOM.clientName.innerHTML = `<span class="text-gray-500 text-xs uppercase block">Material</span> ${state.targetPart.material}`;
    DOM.deliveryDate.innerHTML = `<span class="text-gray-500 text-xs uppercase block">Cor Principal</span> ${state.targetPart.colorMain}`;
}

function updateListUI() {
    DOM.itemsList.innerHTML = '';
    
    DOM.listCountBadge.textContent = state.items.length;
    DOM.totalItemsDisplay.textContent = `${state.items.length} novos itens`;

    if (state.items.length > 0) {
        DOM.listContainer.classList.remove('hidden');
        DOM.fixedFooter.classList.remove('hidden');
    } else {
        DOM.listContainer.classList.add('hidden');
        DOM.fixedFooter.classList.add('hidden');
    }

    state.items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center fade-in mb-2";
        
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-indigo-100 text-indigo-700 font-bold w-10 h-10 flex items-center justify-center rounded-full text-sm">
                    ${item.size}
                </div>
                <div>
                    <p class="font-bold text-gray-800 uppercase leading-none">${item.name}</p>
                    ${item.number ? `<p class="text-xs text-gray-500 font-semibold mt-1">Nº ${item.number}</p>` : ''}
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

// Função Global para HTML Inline
window.removeItem = (index) => {
    // Remoção direta sem confirm para agilizar UX mobile
    state.items.splice(index, 1);
    updateListUI();
};

function showError(msg) {
    DOM.feedback.innerHTML = `
        <div class="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="font-bold text-lg text-gray-800">Acesso Indisponível</p>
            <p class="text-sm mt-1">${msg}</p>
        </div>
    `;
    DOM.feedback.classList.remove('hidden');
    DOM.inputForm.classList.add('hidden');
    DOM.orderInfo.classList.add('hidden');
    DOM.fixedFooter.classList.add('hidden');
}

function updateStatus(text, color) {
    DOM.statusBadge.textContent = text;
    DOM.statusBadge.className = `text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-800 border border-${color}-200 font-medium`;
}

// ========================================================
// 3. LISTENERS E AÇÕES
// ========================================================

DOM.addItemBtn.addEventListener('click', () => {
    const name = DOM.itemName.value.trim();
    const number = DOM.itemNumber.value.trim();
    const size = DOM.itemSize.value;

    if (!name) {
        alert("Digite o nome que vai na estampa.");
        DOM.itemName.focus();
        return;
    }
    if (!size) {
        alert("Escolha um tamanho.");
        DOM.itemSize.focus();
        return;
    }

    state.items.push({
        name: name.toUpperCase(),
        number: number || "", // String vazia é melhor que null para renderização
        size: size
    });

    // Reset inteligente do formulário
    DOM.itemName.value = '';
    DOM.itemNumber.value = '';
    // Não limpamos o tamanho, pois geralmente é o mesmo para várias pessoas, ou muda pouco.
    DOM.itemName.focus(); 
    
    updateListUI();
    DOM.listContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
});

DOM.saveListBtn.addEventListener('click', async () => {
    if (state.items.length === 0) return;

    if (!confirm(`Confirma o envio de ${state.items.length} itens para a peça ${state.targetPart.type}?`)) return;

    const originalText = DOM.saveListBtn.innerHTML;
    DOM.saveListBtn.disabled = true;
    DOM.saveListBtn.innerHTML = `Enviando...`;

    try {
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);

        // --- ESTRATÉGIA DE INTEGRIDADE (Fetch -> Patch -> Update) ---
        // 1. Baixar versão mais recente para evitar sobrescrita cega
        const freshSnap = await getDoc(orderRef);
        if (!freshSnap.exists()) throw new Error("Pedido não existe mais.");
        
        const freshData = freshSnap.data();
        
        // 2. Clonar array de peças
        const updatedParts = [...freshData.parts];
        
        // 3. Localizar a peça alvo (pode ter mudado de index se alguém deletou uma peça antes, mas assumimos consistência curto prazo)
        // Se a integridade for crítica, poderíamos usar um ID na peça, mas por índice funciona para o MVP.
        const targetPart = updatedParts[state.partIndex];
        
        if (!targetPart) throw new Error("Estrutura do pedido mudou. Recarregue a página.");

        // 4. Injetar novos itens no array 'details' existente
        if (!targetPart.details) targetPart.details = [];
        targetPart.details.push(...state.items);

        // 5. Update APENAS do campo 'parts' (Respeitando firestore.rules)
        await updateDoc(orderRef, {
            parts: updatedParts
        });

        DOM.successModal.classList.remove('hidden');
        state.items = [];
        updateListUI();

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert(`Erro ao salvar: ${error.message}. Tente novamente.`);
        DOM.saveListBtn.disabled = false;
        DOM.saveListBtn.innerHTML = originalText;
    }
});

// Inicializar
init();
