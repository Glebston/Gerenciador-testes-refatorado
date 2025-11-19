/* * PAGLUCRO GESTOR - DOM Map (v4.5.2 - Hotfix)
 * Mapeamento centralizado de todos os elementos HTML.
 * Sincronizado com index.html v5.7.57
 * CORREÇÃO: Reintroduzido CHECK_ICON_SVG
 */

// Constante visual usada em feedbacks (helpers.js e modalHandler.js)
export const CHECK_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';

export const DOM = {
    // =========================================================================
    // 1. LAYOUT & AUTH
    // =========================================================================
    authContainer: document.getElementById('authContainer'),
    loginForm: document.getElementById('loginForm'),
    loginEmailInput: document.getElementById('loginEmail'),
    loginPasswordInput: document.getElementById('loginPassword'),
    forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
    
    app: document.getElementById('app'),
    mainContent: document.getElementById('mainContent'),
    
    // Header & Menu
    userMenuBtn: document.getElementById('userMenuBtn'),
    userEmailDisplay: document.getElementById('userEmail'),
    userDropdown: document.getElementById('userDropdown'),
    logoutBtn: document.getElementById('logoutBtn'),
    backupBtn: document.getElementById('backupBtn'),
    restoreFileInput: document.getElementById('restoreFile'),
    requestDeletionBtn: document.getElementById('requestDeletionBtn'),
    financeDashboardBtn: document.getElementById('financeDashboardBtn'),
    toggleViewBtn: document.getElementById('toggleViewBtn'), // Ver Entregues
    
    // =========================================================================
    // 2. DASHBOARD PEDIDOS
    // =========================================================================
    ordersDashboard: document.getElementById('ordersDashboard'),
    ordersList: document.getElementById('ordersList'),
    addOrderBtn: document.getElementById('addOrderBtn'),
    priceTableBtn: document.getElementById('priceTableBtn'),
    
    // =========================================================================
    // 3. DASHBOARD FINANCEIRO
    // =========================================================================
    financeDashboard: document.getElementById('financeDashboard'),
    
    // KPIs
    faturamentoBruto: document.getElementById('faturamentoBruto'),
    despesasTotais: document.getElementById('despesasTotais'),
    lucroLiquido: document.getElementById('lucroLiquido'),
    contasAReceber: document.getElementById('contasAReceber'),
    saldoEmConta: document.getElementById('saldoEmConta'),
    saldoEmCaixa: document.getElementById('saldoEmCaixa'),
    adjustBalanceBtn: document.getElementById('adjustBalanceBtn'),

    // Filtros & Ações
    periodFilter: document.getElementById('periodFilter'),
    customPeriodContainer: document.getElementById('customPeriodContainer'),
    startDateInput: document.getElementById('startDateInput'),
    endDateInput: document.getElementById('endDateInput'),
    copyReportBtn: document.getElementById('copyReportBtn'),

    // Tops
    topExpensesByCategory: document.getElementById('topExpensesByCategory'),
    topIncomesByCategory: document.getElementById('topIncomesByCategory'),

    // Extrato
    transactionSearchInput: document.getElementById('transactionSearchInput'),
    addIncomeBtn: document.getElementById('addIncomeBtn'),
    addExpenseBtn: document.getElementById('addExpenseBtn'),
    transactionsList: document.getElementById('transactionsList'),

    // =========================================================================
    // 4. MODAL DE PEDIDO (Novo/Editar)
    // =========================================================================
    orderModal: document.getElementById('orderModal'),
    modalTitle: document.getElementById('modalTitle'),
    closeOrderModalX: document.getElementById('closeOrderModalX'),
    orderForm: document.getElementById('orderForm'),
    orderIdInput: document.getElementById('orderId'), // Hidden
    cancelBtn: document.getElementById('cancelBtn'),
    saveBtn: document.getElementById('saveBtn'),
    uploadIndicator: document.getElementById('uploadIndicator'),

    // Campos: Cliente & Prazo
    clientName: document.getElementById('clientName'),
    clientPhone: document.getElementById('clientPhone'),
    orderStatus: document.getElementById('orderStatus'),
    orderDate: document.getElementById('orderDate'),
    deliveryDate: document.getElementById('deliveryDate'),

    // Campos: Arquivos
    mockupFilesInput: document.getElementById('mockupFiles'),
    fileCountDisplay: document.getElementById('fileCount'),
    existingFilesContainer: document.getElementById('existingFilesContainer'),

    // Campos: Peças
    partsContainer: document.getElementById('partsContainer'),
    addPartBtn: document.getElementById('addPartBtn'),

    // Campos: Observação
    generalObservation: document.getElementById('generalObservation'),

    // Campos: Financeiro (Dentro do Pedido)
    financialsContainer: document.getElementById('financialsContainer'),
    downPaymentInput: document.getElementById('downPayment'),
    downPaymentDateInput: document.getElementById('downPaymentDate'),
    // downPaymentSource: REMOVIDO (Era código morto no HTML)
    downPaymentSourceContainer: document.getElementById('downPaymentSourceContainer'), // Mantido (Container dos botões)
    paymentMethod: document.getElementById('paymentMethod'), // NOVO (v4.5.1)
    discountInput: document.getElementById('discount'),
    grandTotalDisplay: document.getElementById('grandTotal'),
    remainingTotalDisplay: document.getElementById('remainingTotal'),
    
    // Radios (Selecionados via querySelector pois não têm ID único fácil)
    // Nota: Radios de downPaymentStatus são pegos dinamicamente no formHandler

    // =========================================================================
    // 5. OUTROS MODAIS
    // =========================================================================
    
    // Modal de Confirmação (Genérico)
    confirmModal: document.getElementById('confirmModal'),
    confirmMessage: document.getElementById('confirmModalMessage'),
    confirmOkBtn: document.getElementById('confirmOkBtn'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),

    // Modal de Informação (Alert)
    infoModal: document.getElementById('infoModal'),
    infoMessage: document.getElementById('infoModalMessage'),
    infoCloseBtn: document.getElementById('infoModalCloseBtn'),

    // Modal "Visualizar Pedido" (ReadOnly)
    viewModal: document.getElementById('viewModal'),

    // Modal "Quitar Pedido"
    settlementModal: document.getElementById('settlementModal'),
    settlementOrderId: document.getElementById('settlementOrderId'),
    settlementAmountDisplay: document.getElementById('settlementAmountDisplay'),
    settlementDate: document.getElementById('settlementDate'),
    settlementSourceContainer: document.getElementById('settlementSourceContainer'),
    settlementConfirmBtn: document.getElementById('settlementConfirmBtn'),
    settlementCancelBtn: document.getElementById('settlementCancelBtn'),

    // Modal de Transação (Avulsa)
    transactionModal: document.getElementById('transactionModal'),
    transactionModalTitle: document.getElementById('transactionModalTitle'),
    transactionForm: document.getElementById('transactionForm'),
    transactionIdInput: document.getElementById('transactionId'),
    transactionTypeInput: document.getElementById('transactionType'),
    transactionDateInput: document.getElementById('transactionDate'),
    transactionDescriptionInput: document.getElementById('transactionDescription'),
    transactionCategoryInput: document.getElementById('transactionCategory'),
    transactionAmountInput: document.getElementById('transactionAmount'),
    transactionSourceContainer: document.getElementById('transactionSourceContainer'),
    transactionStatusContainer: document.getElementById('transactionStatusContainer'),
    cancelTransactionBtn: document.getElementById('cancelTransactionBtn'),
    saveTransactionBtn: document.getElementById('saveTransactionBtn'),

    // Modal Tabela de Preços
    priceTableModal: document.getElementById('priceTableModal'),
    priceTableContainer: document.getElementById('priceTableContainer'),
    editPriceTableBtn: document.getElementById('editPriceTableBtn'),
    addPriceItemBtn: document.getElementById('addPriceItemBtn'),
    savePriceTableBtn: document.getElementById('savePriceTableBtn'),
    cancelPriceTableBtn: document.getElementById('cancelPriceTableBtn'),
    closePriceTableBtn: document.getElementById('closePriceTableBtn'),
    priceTableEditMessage: document.getElementById('priceTableEditMessage'),

    // Modal Saldo Inicial
    initialBalanceModal: document.getElementById('initialBalanceModal'),
    initialBalanceInput: document.getElementById('initialBalanceInput'),
    cancelBalanceBtn: document.getElementById('cancelBalanceBtn'),
    saveBalanceBtn: document.getElementById('saveBalanceBtn'),

    // Modal Reset Senha
    forgotPasswordModal: document.getElementById('forgotPasswordModal'),
    resetEmailInput: document.getElementById('resetEmailInput'),
    cancelResetBtn: document.getElementById('cancelResetBtn'),
    sendResetEmailBtn: document.getElementById('sendResetEmailBtn'),

    // Modais de Sistema (Idle, Options, Cookie, Backup)
    idleModal: document.getElementById('idleModal'),
    countdownTimer: document.getElementById('countdownTimer'),
    stayLoggedInBtn: document.getElementById('stayLoggedInBtn'),
    
    optionsModal: document.getElementById('optionsModal'),
    optionsList: document.getElementById('optionsList'),
    newOptionInput: document.getElementById('newOptionInput'),
    addOptionBtn: document.getElementById('addOptionBtn'),
    closeOptionsModalBtn: document.getElementById('closeOptionsModalBtn'),

    cookieBanner: document.getElementById('cookieBanner'),
    cookieAcceptBtn: document.getElementById('cookieAcceptBtn'),

    backupReminderBanner: document.getElementById('backupReminderBanner'),
    dismissBackupReminderBtn: document.getElementById('dismissBackupReminderBtn'),
    backupNowBtn: document.getElementById('backupNowBtn'),

    // =========================================================================
    // 6. TEMPLATES
    // =========================================================================
    partTemplate: document.getElementById('partTemplate'),
    comumPartContentTemplate: document.getElementById('comumPartContentTemplate'),
    detalhadoPartContentTemplate: document.getElementById('detalhadoPartContentTemplate'),
    specificSizeRowTemplate: document.getElementById('specificSizeRowTemplate'),
    financialRowTemplate: document.getElementById('financialRowTemplate'),
    
    // DataLists
    partTypeList: document.getElementById('part-type-list'),
    partMaterialList: document.getElementById('part-material-list'),
};
