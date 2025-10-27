// Constantes de UI
const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
const SIZES_ORDER = [
    'PP', 'P', 'M', 'G', 'GG', 'XG',
    '2 anos', '4 anos', '6 anos', '8 anos', '10 anos', '12 anos'
];

// Centraliza todos os seletores de elementos do DOM
export const DOM = {
    authContainer: document.getElementById('authContainer'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userEmail: document.getElementById('userEmail'),
    app: document.getElementById('app'),
    addOrderBtn: document.getElementById('addOrderBtn'),
    backupBtn: document.getElementById('backupBtn'),
    restoreFileInput: document.getElementById('restoreFile'),
    orderModal: document.getElementById('orderModal'),
    orderForm: document.getElementById('orderForm'),
    mainContent: document.getElementById('mainContent'),
    ordersDashboard: document.getElementById('ordersDashboard'),
    financeDashboard: document.getElementById('financeDashboard'),
    ordersList: document.getElementById('ordersList'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    partsContainer: document.getElementById('partsContainer'),
    financialsContainer: document.getElementById('financialsContainer'),
    addPartBtn: document.getElementById('addPartBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    saveBtn: document.getElementById('saveBtn'),
    uploadIndicator: document.getElementById('uploadIndicator'),
    viewModal: document.getElementById('viewModal'),
    infoModal: document.getElementById('infoModal'),
    infoModalMessage: document.getElementById('infoModalMessage'),
    infoModalCloseBtn: document.getElementById('infoModalCloseBtn'),
    grandTotal: document.getElementById('grandTotal'),
    remainingTotal: document.getElementById('remainingTotal'),
    downPayment: document.getElementById('downPayment'),
    discount: document.getElementById('discount'),
    idleModal: document.getElementById('idleModal'),
    stayLoggedInBtn: document.getElementById('stayLoggedInBtn'),
    countdownTimer: document.getElementById('countdownTimer'),
    optionsModal: document.getElementById('optionsModal'),
    optionsModalTitle: document.getElementById('optionsModalTitle'),
    optionsList: document.getElementById('optionsList'),
    newOptionInput: document.getElementById('newOptionInput'),
    addOptionBtn: document.getElementById('addOptionBtn'),
    closeOptionsModalBtn: document.getElementById('closeOptionsModalBtn'),
    partTypeList: document.getElementById('part-type-list'),
    partMaterialList: document.getElementById('part-material-list'),
    confirmModal: document.getElementById('confirmModal'),
    confirmModalMessage: document.getElementById('confirmModalMessage'),
    confirmOkBtn: document.getElementById('confirmOkBtn'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    toggleViewBtn: document.getElementById('toggleViewBtn'),
    financeDashboardBtn: document.getElementById('financeDashboardBtn'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    requestDeletionBtn: document.getElementById('requestDeletionBtn'),
    transactionModal: document.getElementById('transactionModal'),
    transactionForm: document.getElementById('transactionForm'),
    transactionModalTitle: document.getElementById('transactionModalTitle'),
    cancelTransactionBtn: document.getElementById('cancelTransactionBtn'),
    addIncomeBtn: document.getElementById('addIncomeBtn'),
    addExpenseBtn: document.getElementById('addExpenseBtn'),
    transactionsList: document.getElementById('transactionsList'),
    periodFilter: document.getElementById('periodFilter'),
    faturamentoBruto: document.getElementById('faturamentoBruto'),
    despesasTotais: document.getElementById('despesasTotais'),
    contasAReceber: document.getElementById('contasAReceber'),
    lucroLiquido: document.getElementById('lucroLiquido'),
    saldoEmConta: document.getElementById('saldoEmConta'),
    adjustBalanceBtn: document.getElementById('adjustBalanceBtn'),
    initialBalanceModal: document.getElementById('initialBalanceModal'),
    initialBalanceInput: document.getElementById('initialBalanceInput'),
    saveBalanceBtn: document.getElementById('saveBalanceBtn'),
    cancelBalanceBtn: document.getElementById('cancelBalanceBtn'),
    transactionSourceContainer: document.getElementById('transactionSourceContainer'),
    backupReminderBanner: document.getElementById('backupReminderBanner'),
    backupNowBtn: document.getElementById('backupNowBtn'),
    dismissBackupReminderBtn: document.getElementById('dismissBackupReminderBtn'),
    copyReportBtn: document.getElementById('copyReportBtn'),
    customPeriodContainer: document.getElementById('customPeriodContainer'),
    startDateInput: document.getElementById('startDateInput'),
    endDateInput: document.getElementById('endDateInput'),
    transactionCategory: document.getElementById('transactionCategory'),
    topExpensesByCategory: document.getElementById('topExpensesByCategory'),
    topIncomesByCategory: document.getElementById('topIncomesByCategory'),
    transactionSearchInput: document.getElementById('transactionSearchInput'),
    priceTableBtn: document.getElementById('priceTableBtn'),
    priceTableModal: document.getElementById('priceTableModal'),
    priceTableModalTitle: document.getElementById('priceTableModalTitle'),
    priceTableContainer: document.getElementById('priceTableContainer'),
    priceTableFooter: document.getElementById('priceTableFooter'),
    priceTableEditMessage: document.getElementById('priceTableEditMessage'),
    editPriceTableBtn: document.getElementById('editPriceTableBtn'),
    addPriceItemBtn: document.getElementById('addPriceItemBtn'),
    savePriceTableBtn: document.getElementById('savePriceTableBtn'),
    cancelPriceTableBtn: document.getElementById('cancelPriceTableBtn'),
    closePriceTableBtn: document.getElementById('closePriceTableBtn'),
    forgotPasswordModal: document.getElementById('forgotPasswordModal'),
    resetEmailInput: document.getElementById('resetEmailInput'),
    sendResetEmailBtn: document.getElementById('sendResetEmailBtn'),
    cancelResetBtn: document.getElementById('cancelResetBtn'),
    cookieBanner: document.getElementById('cookieBanner'),
    cookieAcceptBtn: document.getElementById('cookieAcceptBtn'),
    transactionDate: document.getElementById('transactionDate'),
    transactionDescription: document.getElementById('transactionDescription'),
    transactionAmount: document.getElementById('transactionAmount'),
    transactionType: document.getElementById('transactionType'),
    transactionId: document.getElementById('transactionId'),
    transactionStatusContainer: document.getElementById('transactionStatusContainer'),
    pago: document.querySelector('input[name="transactionStatus"][value="pago"]'),
    a_receber: document.querySelector('input[name="transactionStatus"][value="a_receber"]'),
    orderId: document.getElementById('orderId'),
    mockupFiles: document.getElementById('mockupFiles'),
    paymentMethod: document.getElementById('paymentMethod'),
    clientName: document.getElementById('clientName'),
    clientPhone: document.getElementById('clientPhone'),
    orderStatus: document.getElementById('orderStatus'),
    orderDate: document.getElementById('orderDate'),
    deliveryDate: document.getElementById('deliveryDate'),
    generalObservation: document.getElementById('generalObservation'),
    existingFilesContainer: document.getElementById('existingFilesContainer'),
    modalTitle: document.getElementById('modalTitle'),
};

// Funções de Modais
export const showInfoModal = (message) => {
    DOM.infoModalMessage.textContent = message;
    DOM.infoModal.classList.remove('hidden');
};

export const showForgotPasswordModal = () => {
    return new Promise((resolve) => {
        DOM.resetEmailInput.value = '';
        DOM.forgotPasswordModal.classList.remove('hidden');
        DOM.resetEmailInput.focus();

        const handleSend = () => {
            cleanupAndResolve(DOM.resetEmailInput.value.trim());
        };

        const handleCancel = () => {
            cleanupAndResolve(null);
        };

        const cleanupAndResolve = (value) => {
            DOM.sendResetEmailBtn.removeEventListener('click', handleSend);
            DOM.cancelResetBtn.removeEventListener('click', handleCancel);
            DOM.forgotPasswordModal.classList.add('hidden');
            resolve(value);
        };

        DOM.sendResetEmailBtn.addEventListener('click', handleSend, { once: true });
        DOM.cancelResetBtn.addEventListener('click', handleCancel, { once: true });
    });
};

export const showConfirmModal = (message, okText = "OK", cancelText = "Cancelar") => {
    return new Promise((resolve) => {
        DOM.confirmModalMessage.textContent = message;
        DOM.confirmOkBtn.textContent = okText;
        DOM.confirmCancelBtn.textContent = cancelText;
        DOM.confirmModal.classList.remove('hidden');

        const confirmListener = () => resolvePromise(true);
        const cancelListener = () => resolvePromise(false);

        const resolvePromise = (value) => {
            DOM.confirmModal.classList.add('hidden');
            DOM.confirmOkBtn.removeEventListener('click', confirmListener);
            DOM.confirmCancelBtn.removeEventListener('click', cancelListener);
            resolve(value);
        };

        DOM.confirmOkBtn.addEventListener('click', confirmListener, { once: true });
        DOM.confirmCancelBtn.addEventListener('click', cancelListener, { once: true });
    });
};

// Funções de UI Geral
export const updateNavButton = (currentDashboardView) => {
    const isOrdersView = currentDashboardView === 'orders';
    if (isOrdersView) {
        DOM.financeDashboardBtn.innerHTML = `📊 Financeiro`;
    } else {
        DOM.financeDashboardBtn.innerHTML = `📋 Pedidos`;
    }
};

export const handleCookieConsent = () => {
    if (localStorage.getItem('cookieConsent')) {
        DOM.cookieBanner.classList.add('hidden');
    } else {
        DOM.cookieBanner.classList.remove('hidden');
    }
};

// ==========================================================
// SEÇÃO DE RENDERIZAÇÃO DE PEDIDOS (KANBAN E ENTREGUES)
// ==========================================================

const getDeliveryCountdown = (deliveryDate) => {
    if (!deliveryDate) return { text: 'Sem data', color: 'gray' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate + 'T00:00:00');
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Atrasado há ${Math.abs(diffDays)} dia(s)`, color: 'red' };
    if (diffDays === 0) return { text: 'Entrega hoje', color: 'red' };
    if (diffDays === 1) return { text: 'Resta 1 dia', color: 'yellow' };
    if (diffDays <= 3) return { text: `Restam ${diffDays} dias`, color: 'yellow' };
    return { text: `Restam ${diffDays} dias`, color: 'green' };
};

const generateOrderCardHTML = (order, viewType) => {
    let totalValue = 0;
    (order.parts || []).forEach(p => {
        const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
        const specificQty = (p.specifics || []).length;
        const detailedQty = (p.details || []).length;
        const standardSub = standardQty * (p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0);
        const specificSub = specificQty * (p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0);
        const detailedSub = detailedQty * (p.unitPrice || 0);
        totalValue += standardSub + specificSub + detailedSub;
    });
    totalValue -= (order.discount || 0);

    const countdown = getDeliveryCountdown(order.deliveryDate);
    const countdownColorClasses = {
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        green: 'bg-green-100 text-green-800',
        gray: 'bg-gray-100 text-gray-800'
    };

    const formattedDeliveryDate = order.deliveryDate ?
        new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') :
        'A definir';

    const buttonsHtml = viewType === 'pending' ?
        `<button data-id="${order.id}" class="edit-btn p-2 rounded-md text-gray-500 hover:bg-yellow-100 hover:text-yellow-700 transition-colors" title="Editar">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
        </button>` :
        `<button data-id="${order.id}" class="replicate-btn p-2 rounded-md text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors" title="Replicar">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a1 1 0 102 0V5h6a1 1 0 100-2H5z" /></svg>
        </button>`;
    
    // Criamos o elemento DOM em vez de string
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col space-y-3 transform hover:-translate-y-1";
    card.dataset.id = order.id;
    card.dataset.deliveryDate = order.deliveryDate || 'Sem Data'; // Para ordenação no Kanban

    card.innerHTML = `
        <div class="flex justify-between items-start">
            <h3 class="text-lg font-bold text-gray-800">${order.clientName}</h3>
            <span class="status-badge status-${order.orderStatus.replace(/\s/g, '-')}">${order.orderStatus}</span>
        </div>
        
        ${viewType === 'pending' ? `<div class="text-sm font-medium text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span class="ml-1.5">Entrega: <strong>${formattedDeliveryDate}</strong></span>
        </div>` : ''}

        <p class="text-sm text-gray-600">Total: <span class="font-semibold text-blue-600">R$ ${totalValue.toFixed(2)}</span></p>

        ${viewType === 'pending' ? `<div class="text-sm font-semibold py-1 px-2 rounded-full text-center ${countdownColorClasses[countdown.color]}">${countdown.text}</div>` : ''}
        
        <div class="flex space-x-2 items-center pt-3 border-t border-gray-100 mt-auto">
            <button data-id="${order.id}" class="view-btn flex-1 bg-gray-100 text-gray-700 font-semibold py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors">Detalhes</button>
            ${buttonsHtml}
            ${viewType === 'pending' ? 
            `<button data-id="${order.id}" class="settle-and-deliver-btn p-2 rounded-md text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors" title="Quitar e Entregar">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
            </button>` : ''}
            <button data-id="${order.id}" class="delete-btn p-2 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors" title="Excluir">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
            </button>
        </div>
    `;
    return card;
};

/**
 * Prepara o container da lista de pedidos (Kanban ou Grid)
 */
const setupOrderListContainer = (viewType) => {
    DOM.ordersList.innerHTML = ''; // Limpa
    DOM.ordersList.className = ''; // Reseta classes
    if (viewType === 'pending') {
        DOM.ordersList.classList.add('kanban-board');
    } else {
        DOM.ordersList.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4', '2xl:grid-cols-5', 'gap-6');
    }
};

/**
 * Procura ou cria uma coluna no Kanban
 * @param {string} dateKey - O 'data-date-key' (ex: '2025-10-31' ou 'Sem Data')
 * @returns {HTMLElement} O elemento do container de cards da coluna
 */
const findOrCreateKanbanColumn = (dateKey) => {
    let column = DOM.ordersList.querySelector(`.kanban-column[data-date-key="${dateKey}"]`);
    if (column) {
        return column.querySelector('.kanban-column-content');
    }

    // Coluna não existe, vamos criar
    const formattedDate = dateKey === 'Sem Data' ?
        'Sem Data de Entrega' :
        new Date(dateKey + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    column = document.createElement('div');
    column.className = 'kanban-column';
    column.dataset.dateKey = dateKey;
    column.innerHTML = `
        <h2 class="font-bold text-lg text-gray-700 mb-4 flex items-center">
            ${formattedDate}
            <span class="kanban-column-counter ml-2 text-sm font-medium bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">0</span>
        </h2>
        <div class="kanban-column-content space-y-4"></div>
    `;

    // Insere a coluna na ordem correta
    const allColumns = Array.from(DOM.ordersList.querySelectorAll('.kanban-column'));
    let inserted = false;
    if (dateKey !== 'Sem Data') {
        const newDate = new Date(dateKey + 'T00:00:00');
        for (const existingCol of allColumns) {
            const existingDateKey = existingCol.dataset.dateKey;
            if (existingDateKey !== 'Sem Data' && newDate < new Date(existingDateKey + 'T00:00:00')) {
                DOM.ordersList.insertBefore(column, existingCol);
                inserted = true;
                break;
            }
        }
    }
    if (!inserted) {
        // Se for "Sem Data" ou mais recente que todas, adiciona no final
        DOM.ordersList.appendChild(column);
    }
    
    return column.querySelector('.kanban-column-content');
};

/**
 * Atualiza o contador de uma coluna Kanban
 * @param {HTMLElement} columnContent - O elemento '.kanban-column-content'
 */
const updateKanbanColumnCounter = (columnContent) => {
    const column = columnContent.closest('.kanban-column');
    if (!column) return;
    
    const counter = column.querySelector('.kanban-column-counter');
    const count = columnContent.children.length;
    counter.textContent = count;
    
    // Se a coluna ficar vazia, remove-a
    if (count === 0) {
        column.remove();
    }
};

/**
 * Adiciona um card de pedido à UI
 */
export const addOrderCard = (order, viewType) => {
    const card = generateOrderCardHTML(order, viewType);
    
    if (viewType === 'pending') {
        const dateKey = order.deliveryDate || 'Sem Data';
        const columnContent = findOrCreateKanbanColumn(dateKey);
        // Insere o card ordenado por nome dentro da coluna
        const cardsInColumn = Array.from(columnContent.querySelectorAll('.bg-white'));
        let inserted = false;
        for (const existingCard of cardsInColumn) {
            if (order.clientName.localeCompare(existingCard.querySelector('h3').textContent) < 0) {
                columnContent.insertBefore(card, existingCard);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            columnContent.appendChild(card);
        }
        updateKanbanColumnCounter(columnContent);
    } else {
        // Na 'delivered' view (grid), insere ordenado por data (mais novo primeiro)
        const allCards = Array.from(DOM.ordersList.querySelectorAll('.bg-white'));
        let inserted = false;
        const orderDate = new Date(order.deliveryDate || 0);
        for (const existingCard of allCards) {
            const existingDate = new Date(existingCard.dataset.deliveryDate || 0);
            if (orderDate > existingDate) {
                DOM.ordersList.insertBefore(card, existingCard);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            DOM.ordersList.appendChild(card);
        }
    }
    
    // Remove o "Nenhum pedido" se for o primeiro
    const placeholder = DOM.ordersList.querySelector('.orders-placeholder');
    if (placeholder) placeholder.remove();
};

/**
 * Atualiza um card de pedido existente na UI
 */
export const updateOrderCard = (order, viewType) => {
    const existingCard = DOM.ordersList.querySelector(`[data-id="${order.id}"]`);
    if (!existingCard) {
        // Se não existia (ex: mudou de 'Entregue' para 'Pendente'), apenas adiciona
        addOrderCard(order, viewType);
        return;
    }

    const oldColumnContent = existingCard.closest('.kanban-column-content');
    const newCard = generateOrderCardHTML(order, viewType);

    // Substitui o card antigo pelo novo
    existingCard.replaceWith(newCard);
    
    if (viewType === 'pending') {
        const newDateKey = order.deliveryDate || 'Sem Data';
        const newColumnContent = findOrCreateKanbanColumn(newDateKey);
        
        // Se a coluna for diferente, move o card
        if (newColumnContent !== oldColumnContent) {
            newColumnContent.appendChild(newCard); // Adiciona na nova coluna
            if (oldColumnContent) {
                updateKanbanColumnCounter(oldColumnContent); // Atualiza contador da antiga
            }
        }
        updateKanbanColumnCounter(newColumnContent); // Atualiza contador da nova
    }
};

/**
 * Remove um card de pedido da UI
 */
export const removeOrderCard = (orderId) => {
    const card = DOM.ordersList.querySelector(`[data-id="${orderId}"]`);
    if (card) {
        const columnContent = card.closest('.kanban-column-content');
        card.remove();
        if (columnContent) {
            updateKanbanColumnCounter(columnContent); // Atualiza o contador da coluna
        }
    }
    
    // Se a lista estiver vazia, mostra a mensagem
    if (DOM.ordersList.children.length === 0) {
        showOrdersPlaceholder(DOM.ordersList.classList.contains('kanban-board') ? 'pending' : 'delivered');
    }
};

/**
 * Exibe a mensagem de "Nenhum pedido"
 */
const showOrdersPlaceholder = (viewType) => {
    const message = viewType === 'pending' ? 'Nenhum pedido pendente.' : 'Nenhum pedido entregue encontrado.';
    const colSpanClass = viewType === 'pending' ? 'w-full' : 'col-span-full';
    DOM.ordersList.innerHTML = `<div class="${colSpanClass} text-center py-10 text-gray-500 orders-placeholder">${message}</div>`;
};

/**
 * Função principal de renderização inicial de pedidos
 */
export const renderOrders = (allOrders, currentOrdersView) => {
    DOM.loadingIndicator.style.display = 'none';
    setupOrderListContainer(currentOrdersView);
    
    let ordersToRender;
    
    if (currentOrdersView === 'pending') {
        ordersToRender = allOrders.filter(o => o.orderStatus !== 'Entregue');
        // Ordena por data e depois por nome
        ordersToRender.sort((a, b) => {
            const dateA = a.deliveryDate || '9999-12-31';
            const dateB = b.deliveryDate || '9999-12-31';
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return a.clientName.localeCompare(b.clientName);
        });
    } else { 
        ordersToRender = allOrders.filter(o => o.orderStatus === 'Entregue');
        // Ordena por data (mais novos primeiro)
        ordersToRender.sort((a, b) => (b.deliveryDate || 0).localeCompare(a.deliveryDate || 0));
    }

    if (ordersToRender.length === 0) {
        showOrdersPlaceholder(currentOrdersView);
        return;
    }
    
    // Chama a função granular para construir a UI inicial
    ordersToRender.forEach(order => addOrderCard(order, currentOrdersView));
};

const sortSizes = (sizesObject) => {
    return Object.entries(sizesObject).sort((a, b) => {
        const indexA = SIZES_ORDER.indexOf(a[0]);
        const indexB = SIZES_ORDER.indexOf(b[0]);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
};

export const viewOrder = (order) => {
    if (!order) return;

    let subTotal = 0;
    let partsHtml = (order.parts || []).map(p => {
        const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
        const specificQty = (p.specifics || []).length;
        const detailedQty = (p.details || []).length;

        const standardSub = standardQty * (p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0);
        const specificSub = specificQty * (p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0);
        const detailedSub = detailedQty * (p.unitPrice || 0);

        const partSubtotal = standardSub + specificSub + detailedSub;
        subTotal += partSubtotal;

        let itemsDetailHtml = '';
        
        if (p.partInputType === 'comum') {
            let standardSizesHtml = '';
            if (p.sizes && Object.keys(p.sizes).length > 0) {
                standardSizesHtml = Object.entries(p.sizes).map(([cat, sizes]) =>
                    `<strong>${cat}:</strong> ${sortSizes(sizes).map(([size, qty]) => `${size}(${qty})`).join(', ')}`
                ).join('<br>');
            }
            
            let specificSizesHtml = '';
            if (p.specifics && p.specifics.length > 0) {
                specificSizesHtml = '<br><strong>Específicos:</strong><br>' + p.specifics.map(s => 
                    `&nbsp;&nbsp;- L: ${s.width || 'N/A'}, A: ${s.height || 'N/A'} (${s.observation || 'Sem obs.'})`
                ).join('<br>');
            }

            if (standardSizesHtml || specificSizesHtml) {
                itemsDetailHtml = `<div class="text-xs text-gray-600 pl-2 mt-1">${standardSizesHtml}${specificSizesHtml}</div>`;
            }

        } else if (p.partInputType === 'detalhado' && p.details && p.details.length > 0) {
            itemsDetailHtml = '<div class="text-xs text-gray-600 pl-2 mt-1">' + p.details.map(d => `${d.name || ''} - ${d.size || ''} - ${d.number || ''}`).join('<br>') + '</div>';
        }

        let unitPriceHtml = '';
        if(p.partInputType === 'comum') {
            if(standardQty > 0) unitPriceHtml += `R$ ${(p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0).toFixed(2)} (Padrão)<br>`;
            if(specificQty > 0) unitPriceHtml += `R$ ${(p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0).toFixed(2)} (Específico)`;
        } else {
            unitPriceHtml = `R$ ${(p.unitPrice || 0).toFixed(2)}`;
        }

        return `
            <tr>
                <td class="py-1 px-2 border">${p.type}${itemsDetailHtml}</td>
                <td class="py-1 px-2 border">${p.material}</td>
                <td class="py-1 px-2 border">${p.colorMain}</td>
                <td class="py-1 px-2 border text-center">${standardQty + specificQty + detailedQty}</td>
                <td class="py-1 px-2 border text-right">${unitPriceHtml.trim()}</td>
                <td class="py-1 px-2 border text-right font-semibold">R$ ${partSubtotal.toFixed(2)}</td>
            </tr>`;
    }).join('');

    const discount = order.discount || 0;
    const grandTotal = subTotal - discount;
    const remaining = grandTotal - (order.downPayment || 0);

    const modalContent = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
            <div id="printable-details" class="p-8 pb-8 overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4">Detalhes do Pedido - ${order.clientName}</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                    <div><strong>Telefone:</strong> ${order.clientPhone || 'N/A'}</div>
                    <div><strong>Status:</strong> <span class="font-semibold">${order.orderStatus}</span></div>
                    <div><strong>Data do Pedido:</strong> ${order.orderDate ? new Date(order.orderDate + 'T00:00:00').toLocaleDateString('pt-br') : 'N/A'}</div>
                    <div><strong>Data de Entrega:</strong> ${order.deliveryDate ? new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-br') : 'N/A'}</div>
                </div>
                <h3 class="font-bold text-lg mt-4">Peças</h3>
                <table class="w-full text-left text-sm mt-2">
                    <thead><tr class="bg-gray-100"><th class="px-2 py-1">Tipo/Detalhes</th><th class="px-2 py-1">Material</th><th class="px-2 py-1">Cor</th><th class="px-2 py-1 text-center">Qtd</th><th class="px-2 py-1 text-right">V. Un.</th><th class="px-2 py-1 text-right">Subtotal</th></tr></thead>
                    <tbody>${partsHtml}</tbody>
                </table>
                <h3 class="font-bold text-lg mt-4">Observação Geral</h3>
                <p class="text-sm p-2 border rounded-md mt-2 min-h-[40px]">${order.generalObservation || 'Nenhuma.'}</p>
                <h3 class="font-bold text-lg mt-4">Financeiro</h3>
                <div class="grid grid-cols-2 gap-x-8 mt-2 border-t pt-4 text-sm">
                    <div><strong>Valor Bruto:</strong> R$ ${subTotal.toFixed(2)}</div>
                    <div><strong>Valor Pago:</strong> R$ ${(order.downPayment || 0).toFixed(2)}</div>
                    <div><strong>Desconto:</strong> R$ ${discount.toFixed(2)}</div>
                    <div><strong>Forma de Pagamento:</strong> ${order.paymentMethod || 'N/A'}</div>
                    <div class="mt-2 col-span-2 grid grid-cols-2 gap-x-8">
                        <div class="font-bold text-blue-600 text-lg"><strong>Valor Final:</strong> R$ ${grandTotal.toFixed(2)}</div>
                        <div class="font-bold text-red-600 text-lg"><strong>Resta Pagar:</strong> R$ ${remaining.toFixed(2)}</div>
                    </div>
                </div>
                
                <div id="mockupContainerView" class="pt-4 border-t mt-4">
                    <h3 class="font-bold text-lg">Arquivos</h3>
                    <div class="flex flex-wrap gap-4 mt-2">
                        ${(order.mockupUrls || []).map(url => `<a href="${url}" target="_blank"><img src="${url}" class="w-32 h-32 object-cover border rounded-md mockup-image"></a>`).join('') || 'Nenhum arquivo.'}
                    </div>
                </div>
            </div>
            <div class="p-4 bg-gray-100 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <button id="comprehensivePdfBtn" data-name="${order.clientName}" data-id="${order.id}" class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Gerar PDF do pedido</button>
                <button id="closeViewBtn" class="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg">Fechar</button>
            </div>
        </div>`;
    DOM.viewModal.innerHTML = modalContent;
    DOM.viewModal.classList.remove('hidden');
};


// ==========================================================
// SEÇÃO DE RENDERIZAÇÃO FINANCEIRA
// ==========================================================

/**
 * Cria o HTML para uma única linha de transação (mas não a insere)
 * @returns {string} String HTML da <tr>
 */
const generateTransactionRowHTML = (t) => {
    const isIncome = t.type === 'income';
    const isReceivable = isIncome && t.status === 'a_receber';
    
    const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
    const formattedDate = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const transactionAmount = typeof t.amount === 'number' ? t.amount.toFixed(2) : '0.00';
    
    const statusBadge = isReceivable ? `<span class="ml-2 text-xs font-semibold py-1 px-2 rounded-full bg-yellow-100 text-yellow-800">A Receber</span>` : '';
    const sourceBadge = `<span class="text-xs font-semibold py-1 px-2 rounded-full ${t.source === 'caixa' ? 'bg-gray-200 text-gray-800' : 'bg-indigo-100 text-indigo-800'}">${t.source === 'caixa' ? 'Caixa' : 'Banco'}</span>`;

    let actionsHtml = `
        <button data-id="${t.id}" class="edit-transaction-btn text-blue-500 hover:underline text-sm">Editar</button>
        <button data-id="${t.id}" class="delete-transaction-btn text-red-500 hover:underline text-sm ml-2">Excluir</button>
    `;

    if (isReceivable) {
        actionsHtml = `<button data-id="${t.id}" class="mark-as-paid-btn text-green-600 hover:underline text-sm font-semibold">Receber</button> ` + actionsHtml;
    }

    return `
        <td class="py-3 px-4">${formattedDate}</td>
        <td class="py-3 px-4 flex items-center">${t.description} ${statusBadge}</td>
        <td class="py-3 px-4 text-gray-600">${t.category || ''}</td>
        <td class="py-3 px-4">${sourceBadge}</td>
        <td class="py-3 px-4 text-right font-semibold ${amountClass}">
            ${isIncome ? '+' : '-'} R$ ${transactionAmount}
        </td>
        <td class="py-3 px-4 text-right">
            ${actionsHtml}
        </td>
    `;
};

/**
 * Adiciona uma linha de transação à tabela
 */
export const addTransactionRow = (transaction) => {
    const tr = document.createElement('tr');
    tr.className = `border-b hover:bg-gray-50 ${transaction.status === 'a_receber' ? 'bg-yellow-50' : ''}`;
    tr.dataset.id = transaction.id;
    tr.dataset.date = transaction.date;
    tr.innerHTML = generateTransactionRowHTML(transaction);

    // Insere ordenado por data (mais novo primeiro)
    const allRows = Array.from(DOM.transactionsList.querySelectorAll('tr[data-id]'));
    let inserted = false;
    for (const existingRow of allRows) {
        if (transaction.date > existingRow.dataset.date) {
            DOM.transactionsList.insertBefore(tr, existingRow);
            inserted = true;
            break;
        }
    }
    if (!inserted) {
        DOM.transactionsList.appendChild(tr);
    }
    
    // Remove placeholder se existir
    const placeholder = DOM.transactionsList.querySelector('.transactions-placeholder');
    if (placeholder) placeholder.remove();
};

/**
 * Atualiza uma linha de transação existente
 */
export const updateTransactionRow = (transaction) => {
    const row = DOM.transactionsList.querySelector(`tr[data-id="${transaction.id}"]`);
    if (row) {
        // Apenas atualiza o conteúdo e as classes
        row.className = `border-b hover:bg-gray-50 ${transaction.status === 'a_receber' ? 'bg-yellow-50' : ''}`;
        row.innerHTML = generateTransactionRowHTML(transaction);
        // Remove e readiciona para garantir a ordenação correta
        const oldDate = row.dataset.date;
        if (transaction.date !== oldDate) {
            row.remove();
            addTransactionRow(transaction);
        }
    }
};

/**
 * Remove uma linha de transação da tabela
 */
export const removeTransactionRow = (transactionId) => {
    const row = DOM.transactionsList.querySelector(`tr[data-id="${transactionId}"]`);
    if (row) {
        row.remove();
    }
    
    // Mostra placeholder se a lista ficar vazia
    if (DOM.transactionsList.children.length === 0) {
        showTransactionsPlaceholder(false);
    }
};

/**
 * Exibe a mensagem de "Nenhum lançamento"
 */
const showTransactionsPlaceholder = (isSearch) => {
    const message = isSearch ? 'Nenhum lançamento encontrado para a busca.' : 'Nenhum lançamento encontrado para este período.';
    DOM.transactionsList.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500 transactions-placeholder">${message}</td></tr>`;
};

/**
 * Renderiza apenas os KPIs (cards superiores) do dashboard financeiro
 */
export const renderFinanceKPIs = (allTransactions, userBankBalanceConfig) => {
    const filterValue = DOM.periodFilter.value;
    const now = new Date();
    let startDate, endDate;

    if (filterValue === 'custom') {
        startDate = DOM.startDateInput.value ? new Date(DOM.startDateInput.value + 'T00:00:00') : null;
        endDate = DOM.endDateInput.value ? new Date(DOM.endDateInput.value + 'T23:59:59') : null;
    } else {
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const startOfThisYear = new Date(now.getFullYear(), 0, 1);
        const endOfThisYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        switch(filterValue) {
            case 'thisMonth': startDate = startOfThisMonth; endDate = endOfThisMonth; break;
            case 'lastMonth': startDate = startOfLastMonth; endDate = endOfLastMonth; break;
            case 'thisYear': startDate = startOfThisYear; endDate = endOfThisYear; break;
        }
    }
    
    const filteredTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        if (startDate && endDate) return transactionDate >= startDate && transactionDate <= endDate;
        if(startDate && !endDate) return transactionDate >= startDate;
        if(!startDate && endDate) return transactionDate <= endDate;
        return true;
    });

    let faturamentoBruto = 0, despesasTotais = 0, contasAReceber = 0, valorRecebido = 0, bankFlow = 0;

    filteredTransactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            faturamentoBruto += amount;
            if (t.status === 'a_receber') {
                contasAReceber += amount;
            } else {
                valorRecebido += amount;
            }
        } else if (t.type === 'expense') {
            despesasTotais += amount;
        }
        
        if (t.source === 'banco' || t.source === undefined) {
            if (t.type === 'income' && t.status !== 'a_receber') {
                bankFlow += amount;
            } else if (t.type === 'expense') {
                bankFlow -= amount;
            }
        }
    });

    const lucroLiquido = valorRecebido - despesasTotais;
    const saldoEmConta = (userBankBalanceConfig.initialBalance || 0) + bankFlow;

    DOM.faturamentoBruto.textContent = `R$ ${faturamentoBruto.toFixed(2)}`;
    DOM.despesasTotais.textContent = `R$ ${despesasTotais.toFixed(2)}`;
    DOM.contasAReceber.textContent = `R$ ${contasAReceber.toFixed(2)}`;
    DOM.lucroLiquido.textContent = `R$ ${lucroLiquido.toFixed(2)}`;
    DOM.saldoEmConta.textContent = `R$ ${saldoEmConta.toFixed(2)}`;

    const expenseCategories = {}, incomeCategories = {};

    filteredTransactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        const category = t.category || 'Sem Categoria';

        if (t.type === 'expense') {
            if (!expenseCategories[category]) expenseCategories[category] = 0;
            expenseCategories[category] += amount;
        } else if (t.type === 'income') {
            if (!incomeCategories[category]) incomeCategories[category] = 0;
            incomeCategories[category] += amount;
        }
    });

    const formatCategoryList = (categoryData, containerElement) => {
        const sortedCategories = Object.entries(categoryData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        if (sortedCategories.length === 0) {
            containerElement.innerHTML = '<p class="text-sm text-gray-500">Nenhum dado no período.</p>';
            return;
        }

        let html = '<ul class="space-y-2 text-sm">';
        sortedCategories.forEach(([category, total]) => {
            html += `
                <li class="flex justify-between items-center py-1">
                    <span class="text-gray-700 truncate pr-2">${category}</span>
                    <span class="font-semibold text-gray-900 whitespace-nowrap">R$ ${total.toFixed(2)}</span>
                </li>
            `;
        });
        html += '</ul>';
        containerElement.innerHTML = html;
    };

    formatCategoryList(expenseCategories, DOM.topExpensesByCategory);
    formatCategoryList(incomeCategories, DOM.topIncomesByCategory);
    
    return filteredTransactions;
};

/**
 * Função principal de renderização do dashboard financeiro (para carga inicial ou filtros)
 */
export const renderFinanceDashboard = (allTransactions, userBankBalanceConfig) => {
    if (!DOM.periodFilter) return;

    // 1. Renderiza os KPIs e obtém as transações filtradas
    const filteredTransactions = renderFinanceKPIs(allTransactions, userBankBalanceConfig);

    // 2. Filtra por busca
    const searchTerm = DOM.transactionSearchInput.value.toLowerCase();
    const displayTransactions = searchTerm ?
        filteredTransactions.filter(t => t.description.toLowerCase().includes(searchTerm)) :
        filteredTransactions;
        
    // 3. Renderiza a lista de transações (apenas na carga inicial/filtro)
    DOM.transactionsList.innerHTML = ''; // Limpa a lista
    if (displayTransactions.length === 0) {
        showTransactionsPlaceholder(searchTerm.length > 0);
        return;
    }
    
    // Ordena por data (mais novo primeiro)
    displayTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    displayTransactions.forEach(addTransactionRow);
};


// ==========================================================
// SEÇÃO DE RENDERIZAÇÃO DA TABELA DE PREÇOS
// ==========================================================

/**
 * Cria uma linha da tabela de preços (HTML ou Elemento)
 */
export const createPriceTableRow = (item, mode) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';
    tr.dataset.id = item.id;
    
    const price = (typeof item.price === 'number') ? item.price.toFixed(2) : '0.00';

    if (mode === 'edit') {
        tr.innerHTML = `
            <td class="p-2"><input type="text" class="p-2 border rounded-md w-full price-item-name" value="${item.name || ''}"></td>
            <td class="p-2"><input type="text" class="p-2 border rounded-md w-full price-item-desc" value="${item.description || ''}"></td>
            <td class="p-2"><input type="number" step="0.01" class="p-2 border rounded-md w-full text-right price-item-price" value="${price}"></td>
            <td class="p-2 text-center"><button class="delete-price-item-btn text-red-500 hover:text-red-700 font-bold text-xl">&times;</button></td>
        `;
    } else {
        tr.innerHTML = `
            <td class="p-3 font-medium text-gray-800">${item.name || ''}</td>
            <td class="p-3 text-gray-600">${item.description || ''}</td>
            <td class="p-3 text-right font-semibold text-gray-800">R$ ${price}</td>
        `;
    }
    return tr;
};

/**
 * Adiciona uma linha na tabela de preços
 */
export const addPriceTableRow = (item, mode) => {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    const tr = createPriceTableRow(item, mode);
    tableBody.appendChild(tr);
    
    // Remove placeholder
    const placeholder = tableBody.querySelector('.pricing-placeholder');
    if (placeholder) placeholder.remove();
};

/**
 * Atualiza uma linha da tabela de preços
 */
export const updatePriceTableRow = (item, mode) => {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    const row = tableBody.querySelector(`tr[data-id="${item.id}"]`);
    if (row) {
        const tr = createPriceTableRow(item, mode);
        row.replaceWith(tr);
    }
};

/**
 * Remove uma linha da tabela de preços
 */
export const removePriceTableRow = (itemId) => {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;

    const row = tableBody.querySelector(`tr[data-id="${itemId}"]`);
    if (row) {
        row.remove();
    }
    
    // Adiciona placeholder se a tabela ficar vazia
    if (tableBody.children.length === 0 && !DOM.addPriceItemBtn.classList.contains('hidden')) { // Apenas se estiver em modo de edição
         tableBody.innerHTML = `<tr class="pricing-placeholder"><td colspan="4" class="text-center p-6 text-gray-500">Nenhum item. Clique em "Adicionar Item".</td></tr>`;
    }
};

/**
 * Função principal de renderização da tabela de preços (carga inicial)
 */
export const renderPriceTable = (allPricingItems, mode = 'view') => {
    const isEditMode = mode === 'edit';
    DOM.priceTableContainer.innerHTML = ''; 

    let tableHTML = `
        <table class="w-full text-left table-auto">
            <thead>
                <tr class="bg-gray-100">
                    <th class="p-3 text-sm font-semibold text-gray-700 w-1/3">Serviço/Item</th>
                    <th class="p-3 text-sm font-semibold text-gray-700 w-1/2">Descrição</th>
                    <th class="p-3 text-sm font-semibold text-gray-700 text-right">Preço (R$)</th>
                    ${isEditMode ? '<th class="p-3 text-sm font-semibold text-gray-700 text-center w-16">Ação</th>' : ''}
                </tr>
            </thead>
            <tbody id="priceTableBody"></tbody>
        </table>
    `;
    DOM.priceTableContainer.innerHTML = tableHTML;
    const tableBody = document.getElementById('priceTableBody');
    
    if (allPricingItems.length === 0) {
        const colSpan = isEditMode ? 4 : 3;
        const message = isEditMode ? 'Nenhum item. Clique em "Adicionar Item".' : 'Nenhum item na tabela de preços. Clique em "Editar" para adicionar.';
        tableBody.innerHTML = `<tr class="pricing-placeholder"><td colspan="${colSpan}" class="text-center p-6 text-gray-500">${message}</td></tr>`;
    } else {
        // Usa a função granular para construir a lista inicial
        allPricingItems.forEach(item => {
            const tr = createPriceTableRow(item, mode);
            tableBody.appendChild(tr);
        });
    }
    
    DOM.editPriceTableBtn.classList.toggle('hidden', isEditMode);
    DOM.closePriceTableBtn.classList.toggle('hidden', isEditMode);
    DOM.priceTableEditMessage.classList.toggle('hidden', !isEditMode);
    DOM.savePriceTableBtn.classList.toggle('hidden', !isEditMode);
    DOM.cancelPriceTableBtn.classList.toggle('hidden', !isEditMode);
    DOM.addPriceItemBtn.classList.toggle('hidden', !isEditMode);
};


// ==========================================================
// SEÇÃO DO FORMULÁRIO DE PEDIDOS (LÓGICA INTERNA)
// ==========================================================

export const updateFinancials = () => {
    let subtotal = 0;
    DOM.financialsContainer.querySelectorAll('.financial-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.financial-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.financial-price').value) || 0;
        const itemSubtotal = quantity * price;
        item.querySelector('.financial-subtotal').textContent = `R$ ${itemSubtotal.toFixed(2)}`;
        subtotal += itemSubtotal;
    });

    const discount = parseFloat(DOM.discount.value) || 0;
    const grandTotal = Math.max(0, subtotal - discount);
    const downPayment = parseFloat(DOM.downPayment.value) || 0;

    DOM.grandTotal.textContent = `R$ ${grandTotal.toFixed(2)}`;
    DOM.remainingTotal.textContent = `R$ ${(grandTotal - downPayment).toFixed(2)}`;
};

const createFinancialRow = (partId, name, quantity, priceGroup) => {
    const finTpl = document.getElementById('financialRowTemplate').content.cloneNode(true);
    const finItem = finTpl.querySelector('.financial-item');
    finItem.dataset.partId = partId;
    finItem.dataset.priceGroup = priceGroup;

    finItem.querySelector('.financial-part-name > span:first-child').textContent = name;
    const label = priceGroup === 'standard' ? '(Padrão)' : priceGroup === 'specific' ? '(Específico)' : '';
    finItem.querySelector('.price-group-label').textContent = label;

    finItem.querySelector('.financial-quantity').value = quantity;
    finItem.querySelector('.financial-price').addEventListener('input', updateFinancials);

    return finItem;
};

export const renderFinancialSection = () => {
    DOM.financialsContainer.innerHTML = '';
    DOM.partsContainer.querySelectorAll('.part-item').forEach(partItem => {
        const partId = partItem.dataset.partId;
        const partName = partItem.querySelector('.part-type').value || `Peça ${partId}`;
        const partType = partItem.dataset.partType;

        if (partType === 'comum') {
            let standardQty = 0;
            partItem.querySelectorAll('.size-input').forEach(input => {
                standardQty += parseInt(input.value) || 0;
            });
            const specificQty = partItem.querySelectorAll('.specific-size-row').length;

            if (standardQty > 0) {
                const finRow = createFinancialRow(partId, partName, standardQty, 'standard');
                DOM.financialsContainer.appendChild(finRow);
            }
            if (specificQty > 0) {
                const finRow = createFinancialRow(partId, partName, specificQty, 'specific');
                DOM.financialsContainer.appendChild(finRow);
            }
        } else {
            const totalQty = partItem.querySelectorAll('.detailed-item-row').length;
            if (totalQty > 0) {
                const finRow = createFinancialRow(partId, partName, totalQty, 'detailed');
                DOM.financialsContainer.appendChild(finRow);
            }
        }
    });
    updateFinancials();
};

const addContentToPart = (partItem, partData = {}) => {
    const contentContainer = partItem.querySelector('.part-content-container');
    contentContainer.innerHTML = '';
    const partType = partItem.dataset.partType;

    partItem.querySelectorAll('.part-type-selector').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === partType);
    });

    if (partType === 'comum') {
        const comumTpl = document.getElementById('comumPartContentTemplate').content.cloneNode(true);
        
        const sizesGrid = comumTpl.querySelector('.sizes-grid');
        const categories = {
            'Baby Look': ['PP', 'P', 'M', 'G', 'GG', 'XG'],
            'Normal': ['PP', 'P', 'M', 'G', 'GG', 'XG'],
            'Infantil': ['2 anos', '4 anos', '6 anos', '8 anos', '10 anos', '12 anos']
        };
        let gridHtml = '';
        for (const category in categories) {
            gridHtml += `<div class="p-3 border rounded-md bg-white"><h4 class="font-semibold mb-2">${category}</h4><div class="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-start">`;
            categories[category].forEach(size => {
                const value = partData.sizes?.[category]?.[size] || '';
                gridHtml += `
                    <div class="size-input-container">
                        <label class="text-sm font-medium mb-1">${size}</label>
                        <input type="number" data-category="${category}" data-size="${size}" value="${value}" class="p-2 border rounded-md w-full text-center size-input">
                    </div>`;
            });
            gridHtml += '</div></div>';
        }
        sizesGrid.innerHTML = gridHtml;
        
        const specificList = comumTpl.querySelector('.specific-sizes-list');
        const addSpecificRow = (spec = {}) => {
            const specTpl = document.getElementById('specificSizeRowTemplate').content.cloneNode(true);
            specTpl.querySelector('.item-spec-width').value = spec.width || '';
            specTpl.querySelector('.item-spec-height').value = spec.height || '';
            specTpl.querySelector('.item-spec-obs').value = spec.observation || '';
            specTpl.querySelector('.remove-specific-row-btn').addEventListener('click', (e) => {
                e.target.closest('.specific-size-row').remove();
                renderFinancialSection();
            });
            specificList.appendChild(specTpl);
        };

        (partData.specifics || []).forEach(addSpecificRow);

        comumTpl.querySelector('.add-specific-size-btn').addEventListener('click', () => {
            addSpecificRow();
            renderFinancialSection();
        });

        comumTpl.querySelector('.toggle-sizes-btn').addEventListener('click', (e) => e.target.nextElementSibling.classList.toggle('hidden'));
        sizesGrid.addEventListener('input', renderFinancialSection);
        contentContainer.appendChild(comumTpl);

    } else { // 'detalhado'
        const detalhadoTpl = document.getElementById('detalhadoPartContentTemplate').content.cloneNode(true);
        const listContainer = detalhadoTpl.querySelector('.detailed-items-list');
        const addRow = (detail = {}) => {
            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-2 items-center detailed-item-row';
            row.innerHTML = `
                <div class="col-span-5"><input type="text" placeholder="Nome na Peça" class="p-1 border rounded-md w-full text-sm item-det-name" value="${detail.name || ''}"></div>
                <div class="col-span-4"><input type="text" placeholder="Tamanho" class="p-1 border rounded-md w-full text-sm item-det-size" value="${detail.size || ''}"></div>
                <div class="col-span-2"><input type="text" placeholder="Nº" class="p-1 border rounded-md w-full text-sm item-det-number" value="${detail.number || ''}"></div>
                <div class="col-span-1 flex justify-center"><button type="button" class="remove-detailed-row text-red-500 font-bold">&times;</button></div>`;
            row.querySelector('.remove-detailed-row').addEventListener('click', () => {
                row.remove();
                renderFinancialSection();
            });
            listContainer.appendChild(row);
        };
        (partData.details || [{}]).forEach(addRow);
        detalhadoTpl.querySelector('.add-detailed-row-btn').addEventListener('click', () => {
            addRow();
            renderFinancialSection();
        });
        contentContainer.appendChild(detalhadoTpl);
    }
};

export const addPart = (partData = {}, partCounter) => {
    const partTpl = document.getElementById('partTemplate').content.cloneNode(true);
    const partItem = partTpl.querySelector('.part-item');
    partItem.dataset.partId = partCounter;
    partItem.dataset.partType = partData.partInputType || 'comum';
    
    const partTypeInput = partItem.querySelector('.part-type');
    partTypeInput.value = partData.type || '';
    partItem.querySelector('.part-material').value = partData.material || '';
    partItem.querySelector('.part-color-main').value = partData.colorMain || '';
    
    partTypeInput.addEventListener('input', renderFinancialSection);
    
    addContentToPart(partItem, partData);
    DOM.partsContainer.appendChild(partItem);
    
    renderFinancialSection();
    
    partItem.querySelector('.remove-part-btn').addEventListener('click', () => {
        partItem.remove();
        renderFinancialSection();
    });
    partItem.querySelectorAll('.part-type-selector').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newType = e.target.dataset.type;
            partItem.dataset.partType = newType;
            addContentToPart(partItem, {}); 
            renderFinancialSection();
        });
    });
};

export const resetForm = () => {
    DOM.orderForm.reset();
    DOM.orderId.value = '';
    DOM.modalTitle.textContent = 'Novo Pedido';
    DOM.partsContainer.innerHTML = '';
    DOM.financialsContainer.innerHTML = '';
    DOM.existingFilesContainer.innerHTML = '';
    DOM.orderDate.value = new Date().toISOString().split('T')[0];
    updateFinancials();
};

export const populateFormForEdit = (orderData, currentPartCounter) => {
    resetForm();
    
    DOM.orderId.value = orderData.id;
    DOM.modalTitle.textContent = 'Editar Pedido';
    DOM.clientName.value = orderData.clientName;
    DOM.clientPhone.value = orderData.clientPhone;
    DOM.orderStatus.value = orderData.orderStatus;
    DOM.orderDate.value = orderData.orderDate;
    DOM.deliveryDate.value = orderData.deliveryDate;
    DOM.generalObservation.value = orderData.generalObservation;
    DOM.downPayment.value = orderData.downPayment || '';
    DOM.discount.value = orderData.discount || '';
    DOM.paymentMethod.value = orderData.paymentMethod || '';

    DOM.existingFilesContainer.innerHTML = '';
    if (orderData.mockupUrls && orderData.mockupUrls.length) {
        orderData.mockupUrls.forEach(url => {
            const fileWrapper = document.createElement('div');
            fileWrapper.className = 'flex items-center justify-between bg-gray-100 p-2 rounded-md';
            
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'text-blue-600 hover:underline text-sm truncate';
            link.textContent = url.split('/').pop().split('?')[0];
            
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'remove-mockup-btn text-red-500 hover:text-red-700 font-bold ml-2 px-2';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remover anexo';

            fileWrapper.appendChild(link);
            fileWrapper.appendChild(deleteBtn);
            DOM.existingFilesContainer.appendChild(fileWrapper);
        });
    }

    (orderData.parts || []).forEach(part => {
        currentPartCounter++;
        addPart(part, currentPartCounter);
    });
    
    DOM.financialsContainer.querySelectorAll('.financial-item').forEach(finRow => {
        const partId = finRow.dataset.partId;
        const priceGroup = finRow.dataset.priceGroup;
        const part = orderData.parts[partId - 1];
        if (!part) return;

        if (priceGroup === 'standard') {
            finRow.querySelector('.financial-price').value = part.unitPriceStandard || part.unitPrice || '';
        } else if (priceGroup === 'specific') {
            finRow.querySelector('.financial-price').value = part.unitPriceSpecific || part.unitPrice || '';
        } else if (priceGroup === 'detailed') {
            finRow.querySelector('.financial-price').value = part.unitPrice || '';
        }
    });

    updateFinancials();
    DOM.orderModal.classList.remove('hidden');
    return currentPartCounter;
};

// ==========================================================
// OUTRAS FUNÇÕES DE UI (Sem alteração)
// ==========================================================

export const updateSourceSelectionUI = (selectedSource) => {
    DOM.transactionSourceContainer.querySelectorAll('.source-selector').forEach(btn => {
        const isSelected = btn.dataset.source === selectedSource;
        btn.classList.toggle('active', isSelected);
        const iconPlaceholder = btn.querySelector('.icon-placeholder');
        iconPlaceholder.innerHTML = isSelected ? CHECK_ICON_SVG : '';
    });
};

export const populateDatalists = (partTypes, materialTypes) => {
    DOM.partTypeList.innerHTML = partTypes.map(opt => `<option value="${opt}"></option>`).join('');
    DOM.partMaterialList.innerHTML = materialTypes.map(opt => `<option value="${opt}"></option>`).join('');
};

export const openOptionsModal = (type, options) => {
    const title = type === 'partTypes' ? 'Tipos de Peça' : 'Tipos de Material';
    DOM.optionsModalTitle.textContent = `Gerenciar ${title}`;
    DOM.optionsList.innerHTML = options.map((opt, index) =>
        `<div class="flex justify-between items-center p-2 bg-gray-100 rounded-md">
            <span>${opt}</span>
            <button class="delete-option-btn text-red-500 hover:text-red-700 font-bold" data-index="${index}">&times;</button>
        </div>`
    ).join('');
    DOM.optionsModal.classList.remove('hidden');
};

export const formatPhoneNumber = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g,'');             // Remove tudo o que não é dígito
    value = value.replace(/^(\d{2})(\d)/g,'($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
    value = value.replace(/(\d)(\d{4})$/,'$1-$2');    // Coloca hífen entre o quarto e o quinto dígitos
    return value;
}
