// Este módulo centraliza toda a manipulação do DOM e da Interface do Usuário (UI).

// --- Constantes de UI ---
const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;

// --- Mapeamento de Elementos do DOM ---
export const DOM = {
    authContainer: document.getElementById('authContainer'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
    app: document.getElementById('app'),
    userEmail: document.getElementById('userEmail'),
    mainContent: document.getElementById('mainContent'),
    
    // Header & User Menu
    priceTableBtn: document.getElementById('priceTableBtn'),
    addOrderBtn: document.getElementById('addOrderBtn'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    financeDashboardBtn: document.getElementById('financeDashboardBtn'),
    backupBtn: document.getElementById('backupBtn'),
    restoreFileInput: document.getElementById('restoreFile'),
    toggleViewBtn: document.getElementById('toggleViewBtn'),
    requestDeletionBtn: document.getElementById('requestDeletionBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Dashboards
    ordersDashboard: document.getElementById('ordersDashboard'),
    financeDashboard: document.getElementById('financeDashboard'),
    ordersList: document.getElementById('ordersList'),
    loadingIndicator: document.getElementById('loadingIndicator'),

    // Modals
    orderModal: document.getElementById('orderModal'),
    viewModal: document.getElementById('viewModal'),
    priceTableModal: document.getElementById('priceTableModal'),
    infoModal: document.getElementById('infoModal'),
    idleModal: document.getElementById('idleModal'),
    optionsModal: document.getElementById('optionsModal'),
    confirmModal: document.getElementById('confirmModal'),
    initialBalanceModal: document.getElementById('initialBalanceModal'),
    transactionModal: document.getElementById('transactionModal'),
    forgotPasswordModal: document.getElementById('forgotPasswordModal'),

    // Order Form Elements
    orderForm: document.getElementById('orderForm'),
    modalTitle: document.getElementById('modalTitle'),
    orderId: document.getElementById('orderId'),
    clientName: document.getElementById('clientName'),
    clientPhone: document.getElementById('clientPhone'),
    orderStatus: document.getElementById('orderStatus'),
    orderDate: document.getElementById('orderDate'),
    deliveryDate: document.getElementById('deliveryDate'),
    mockupFiles: document.getElementById('mockupFiles'),
    existingFilesContainer: document.getElementById('existingFilesContainer'),
    partsContainer: document.getElementById('partsContainer'),
    addPartBtn: document.getElementById('addPartBtn'),
    generalObservation: document.getElementById('generalObservation'),
    financialsContainer: document.getElementById('financialsContainer'),
    downPayment: document.getElementById('downPayment'),
    paymentMethod: document.getElementById('paymentMethod'),
    discount: document.getElementById('discount'),
    grandTotal: document.getElementById('grandTotal'),
    remainingTotal: document.getElementById('remainingTotal'),
    uploadIndicator: document.getElementById('uploadIndicator'),
    cancelBtn: document.getElementById('cancelBtn'),
    saveBtn: document.getElementById('saveBtn'),

    // Transaction Form Elements
    transactionForm: document.getElementById('transactionForm'),
    transactionModalTitle: document.getElementById('transactionModalTitle'),
    transactionId: document.getElementById('transactionId'),
    transactionType: document.getElementById('transactionType'),
    transactionDate: document.getElementById('transactionDate'),
    transactionDescription: document.getElementById('transactionDescription'),
    transactionCategory: document.getElementById('transactionCategory'),
    transactionSourceContainer: document.getElementById('transactionSourceContainer'),
    transactionAmount: document.getElementById('transactionAmount'),
    transactionStatusContainer: document.getElementById('transactionStatusContainer'),
    cancelTransactionBtn: document.getElementById('cancelTransactionBtn'),
    saveTransactionBtn: document.getElementById('saveTransactionBtn'),

    // Finance Dashboard Elements
    addIncomeBtn: document.getElementById('addIncomeBtn'),
    addExpenseBtn: document.getElementById('addExpenseBtn'),
    transactionsList: document.getElementById('transactionsList'),
    periodFilter: document.getElementById('periodFilter'),
    customPeriodContainer: document.getElementById('customPeriodContainer'),
    startDateInput: document.getElementById('startDateInput'),
    endDateInput: document.getElementById('endDateInput'),
    faturamentoBruto: document.getElementById('faturamentoBruto'),
    despesasTotais: document.getElementById('despesasTotais'),
    contasAReceber: document.getElementById('contasAReceber'),
    lucroLiquido: document.getElementById('lucroLiquido'),
    saldoEmConta: document.getElementById('saldoEmConta'),
    adjustBalanceBtn: document.getElementById('adjustBalanceBtn'),
    copyReportBtn: document.getElementById('copyReportBtn'),
    topExpensesByCategory: document.getElementById('topExpensesByCategory'),
    topIncomesByCategory: document.getElementById('topIncomesByCategory'),
    transactionSearchInput: document.getElementById('transactionSearchInput'),

    // Initial Balance Modal
    initialBalanceInput: document.getElementById('initialBalanceInput'),
    saveBalanceBtn: document.getElementById('saveBalanceBtn'),
    cancelBalanceBtn: document.getElementById('cancelBalanceBtn'),
    
    // Price Table Modal
    priceTableModalTitle: document.getElementById('priceTableModalTitle'),
    priceTableContainer: document.getElementById('priceTableContainer'),
    priceTableFooter: document.getElementById('priceTableFooter'),
    priceTableEditMessage: document.getElementById('priceTableEditMessage'),
    editPriceTableBtn: document.getElementById('editPriceTableBtn'),
    addPriceItemBtn: document.getElementById('addPriceItemBtn'),
    savePriceTableBtn: document.getElementById('savePriceTableBtn'),
    cancelPriceTableBtn: document.getElementById('cancelPriceTableBtn'),
    closePriceTableBtn: document.getElementById('closePriceTableBtn'),

    // Forgot Password Modal
    resetEmailInput: document.getElementById('resetEmailInput'),
    sendResetEmailBtn: document.getElementById('sendResetEmailBtn'),
    cancelResetBtn: document.getElementById('cancelResetBtn'),

    // Datalists & Options Modal
    partTypeList: document.getElementById('part-type-list'),
    partMaterialList: document.getElementById('part-material-list'),
    optionsModalTitle: document.getElementById('optionsModalTitle'),
    optionsList: document.getElementById('optionsList'),
    newOptionInput: document.getElementById('newOptionInput'),
    addOptionBtn: document.getElementById('addOptionBtn'),
    closeOptionsModalBtn: document.getElementById('closeOptionsModalBtn'),

    // Banners & Misc Modals
    cookieBanner: document.getElementById('cookieBanner'),
    cookieAcceptBtn: document.getElementById('cookieAcceptBtn'),
    backupReminderBanner: document.getElementById('backupReminderBanner'),
    backupNowBtn: document.getElementById('backupNowBtn'),
    dismissBackupReminderBtn: document.getElementById('dismissBackupReminderBtn'),
    infoModalMessage: document.getElementById('infoModalMessage'),
    infoModalCloseBtn: document.getElementById('infoModalCloseBtn'),
    countdownTimer: document.getElementById('countdownTimer'),
    stayLoggedInBtn: document.getElementById('stayLoggedInBtn'),
    confirmModalMessage: document.getElementById('confirmModalMessage'),
    confirmOkBtn: document.getElementById('confirmOkBtn'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
};

// --- Funções de Modais ---

export const showInfoModal = (message) => {
    DOM.infoModalMessage.textContent = message;
    DOM.infoModal.classList.remove('hidden');
};

export const showForgotPasswordModal = () => {
    return new Promise((resolve) => {
        DOM.resetEmailInput.value = '';
        DOM.forgotPasswordModal.classList.remove('hidden');
        DOM.resetEmailInput.focus();

        const handleSend = () => cleanupAndResolve(DOM.resetEmailInput.value.trim());
        const handleCancel = () => cleanupAndResolve(null);

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

// --- Funções de UI Auxiliares ---

export const handleCookieConsent = () => {
    if (localStorage.getItem('cookieConsent')) {
        DOM.cookieBanner.classList.add('hidden');
    } else {
        DOM.cookieBanner.classList.remove('hidden');
    }
};

export const updateNavButton = (currentView) => {
    const isOrdersView = currentView === 'orders';
    if (isOrdersView) {
        DOM.financeDashboardBtn.innerHTML = `📊 Financeiro`;
    } else {
        DOM.financeDashboardBtn.innerHTML = `📋 Pedidos`;
    }
};

export const updateSourceSelectionUI = (selectedSource) => {
    DOM.transactionSourceContainer.querySelectorAll('.source-selector').forEach(btn => {
        const isSelected = btn.dataset.source === selectedSource;
        btn.classList.toggle('active', isSelected);
        const iconPlaceholder = btn.querySelector('.icon-placeholder');
        iconPlaceholder.innerHTML = isSelected ? CHECK_ICON_SVG : '';
    });
};