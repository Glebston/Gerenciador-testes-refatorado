// js/public/fillOrder.js
// ========================================================
// MÓDULO PÚBLICO: PREENCHIMENTO DE PEDIDOS (v1.0)
// Responsabilidade: Permitir que o cliente final adicione
// a lista de nomes/tamanhos sem precisar de login.
// ========================================================

// Importações diretas do CDN para garantir funcionamento sem bundlers complexos
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importa a configuração (ajustando o caminho relativo)
import { firebaseConfig } from '../firebaseConfig.js';

// --- INICIALIZAÇÃO FIREBASE (Instância Isolada) ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- ESTADO DA APLICAÇÃO ---
const state = {
    companyId: null,
    orderId: null,
    orderData: null,
    items: [] // Lista local antes de salvar
};

// --- ELEMENTOS DO DOM ---
const DOM = {
    headerTitle: document.querySelector('header h1'),
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
    
    feedback: document.getElementById('feedbackMessage'),
    successModal: document.getElementById('successModal')
};

// ========================================================
// 1. CORE: CARREGAMENTO E VALIDAÇÃO
// ========================================================

async function init() {
    // 1. Ler parâmetros da URL (?cid=...&oid=...)
    const params = new URLSearchParams(window.location.search);
    state.companyId = params.get('cid');
    state.orderId = params.get('oid');

    // Validação básica de URL
    if (!state.companyId || !state.orderId) {
        showError("Link inválido. Verifique se copiou corretamente.");
        return;
    }

    try {
        updateStatus("Buscando pedido...", "blue");
        
        // 2. Buscar o documento no Firestore
        // Caminho: companies/{cid}/orders/{oid}
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);
        const snap = await getDoc(orderRef);

        if (!snap.exists()) {
            showError("Pedido não encontrado ou expirado.");
            return;
        }

        state.orderData = snap.data();
        
        // Verificação de Segurança: O pedido já foi entregue?
        if (state.orderData.orderStatus === 'Entregue' || state.orderData.orderStatus === 'Finalizado') {
            showError("Este pedido já foi finalizado e não aceita mais alterações.");
            return;
        }

        // 3. Renderizar a Tela
        renderOrderData();
        DOM.inputForm.classList.remove('hidden');
        DOM.feedback.classList.add('hidden');
        updateStatus("Conectado", "green");

        // Se já houver itens salvos anteriormente, poderíamos carregar aqui (Opcional para v2)
        
    } catch (error) {
        console.error("Erro ao carregar:", error);
        showError("Erro de conexão. Tente recarregar a página.");
    }
}

// ========================================================
// 2. LÓGICA DE INTERFACE (UI)
// ========================================================

function renderOrderData() {
    DOM.orderInfo.classList.remove('hidden');
    DOM.clientName.textContent = state.orderData.clientName || "Cliente";
    
    if (state.orderData.deliveryDate) {
        const [ano, mes, dia] = state.orderData.deliveryDate.split('-');
        DOM.deliveryDate.textContent = `${dia}/${mes}/${ano}`;
    } else {
        DOM.deliveryDate.textContent = "A combinar";
    }
}

function updateListUI() {
    DOM.itemsList.innerHTML = '';
    
    // Atualiza contadores
    DOM.listCountBadge.textContent = state.items.length;
    DOM.totalItemsDisplay.textContent = `${state.items.length} itens na lista`;

    // Mostra/Esconde lista e botão de salvar
    if (state.items.length > 0) {
        DOM.listContainer.classList.remove('hidden');
        DOM.fixedFooter.classList.remove('hidden');
    } else {
        DOM.listContainer.classList.add('hidden');
        DOM.fixedFooter.classList.add('hidden');
    }

    // Renderiza Cards
    state.items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center fade-in";
        
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-gray-100 font-bold text-gray-700 w-10 h-10 flex items-center justify-center rounded-full text-sm">
                    ${item.size}
                </div>
                <div>
                    <p class="font-bold text-gray-800 uppercase leading-none">${item.name}</p>
                    ${item.number ? `<p class="text-xs text-indigo-600 font-semibold mt-1">Número: ${item.number}</p>` : ''}
                </div>
            </div>
            <button onclick="removeItem(${index})" class="text-red-400 hover:text-red-600 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        DOM.itemsList.appendChild(card);
    });
}

// Tornar a função global para o HTML acessar
window.removeItem = (index) => {
    if(confirm('Remover este item?')) {
        state.items.splice(index, 1);
        updateListUI();
    }
};

function showError(msg) {
    DOM.feedback.innerHTML = `
        <div class="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            <p class="font-bold">Ops!</p>
            <p class="text-sm">${msg}</p>
        </div>
    `;
    DOM.feedback.classList.remove('hidden');
    DOM.inputForm.classList.add('hidden');
    DOM.orderInfo.classList.add('hidden');
}

function updateStatus(text, color) {
    DOM.statusBadge.textContent = text;
    DOM.statusBadge.className = `text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-800 border border-${color}-200`;
}

// ========================================================
// 3. LISTENERS E AÇÕES
// ========================================================

DOM.addItemBtn.addEventListener('click', () => {
    // 1. Captura
    const name = DOM.itemName.value.trim();
    const number = DOM.itemNumber.value.trim();
    const size = DOM.itemSize.value;

    // 2. Validação
    if (!name) {
        alert("Por favor, digite o Nome na Camisa.");
        DOM.itemName.focus();
        return;
    }
    if (!size) {
        alert("Por favor, selecione um Tamanho.");
        DOM.itemSize.focus();
        return;
    }

    // 3. Adicionar ao Estado
    state.items.push({
        name: name.toUpperCase(),
        number: number || null, // Se vazio, salva null
        size: size,
        addedAt: new Date().toISOString()
    });

    // 4. Limpar e Atualizar
    DOM.itemName.value = '';
    DOM.itemNumber.value = '';
    DOM.itemName.focus(); // Foco volta para o nome para digitação rápida
    
    updateListUI();
    
    // Scroll suave para baixo para ver o item adicionado
    DOM.listContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
});

DOM.saveListBtn.addEventListener('click', async () => {
    if (state.items.length === 0) return;

    if (!confirm(`Confirmar envio de ${state.items.length} itens para a produção?`)) return;

    const originalText = DOM.saveListBtn.innerHTML;
    DOM.saveListBtn.disabled = true;
    DOM.saveListBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Enviando...`;

    try {
        const orderRef = doc(db, "companies", state.companyId, "orders", state.orderId);

        // SALVAMENTO SEGURO:
        // Não sobrescrevemos 'parts'. Salvamos em um campo novo 'customerProvidedList'.
        // O Dashboard do Admin que lidará com a mesclagem disso depois.
        await updateDoc(orderRef, {
            // Usamos arrayUnion para adicionar à lista existente (se houver) sem apagar o que já foi enviado
            customerProvidedList: arrayUnion(...state.items),
            lastCustomerUpdate: serverTimestamp(),
            // Opcional: Marcar pedido com uma flag visual para o dono saber que tem novidade
            hasNewCustomerInput: true 
        });

        DOM.successModal.classList.remove('hidden');
        
        // Limpar estado local após sucesso
        state.items = [];
        updateListUI();

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao enviar dados. Verifique sua conexão.");
    } finally {
        DOM.saveListBtn.disabled = false;
        DOM.saveListBtn.innerHTML = originalText;
    }
});

// Inicializar
init();
