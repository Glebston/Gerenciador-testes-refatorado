// ========================================================
// PARTE 1: IMPORTAÇÕES DE MÓDUTO
// ========================================================

// Firebase Core & Config
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, writeBatch, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db, auth } from './firebaseConfig.js';

// Módulo de Autenticação
import { handleLogout } from './auth.js';

// Módulos de Serviços de Negócio
import { initializeOrderService, saveOrder, deleteOrder, getOrderById, getAllOrders, cleanupOrderService } from './services/orderService.js';
// v5.0.1: Importa a nova função de exclusão em lote
import { 
    initializeFinanceService, 
    saveTransaction, 
    deleteTransaction, 
    markTransactionAsPaid, 
    saveInitialBalance, 
    getAllTransactions, 
    cleanupFinanceService, 
    getTransactionByOrderId,
    deleteAllTransactionsByOrderId // <--- NOVO
} from './services/financeService.js';
import { initializePricingService, savePriceTableChanges, deletePriceItem, getAllPricingItems, cleanupPricingService } from './services/pricingService.js';

// Módulo de Utilitários
import { initializeIdleTimer } from './utils.js';

// Módulo de Interface do Usuário (UI) - Importando tudo sob o namespace 'UI'
import * as UI from './ui.js';

// Módulos de Listeners (Refatoração v4.3.6+)
import { initializeAuthListeners } from './listeners/authListeners.js';
import { initializeNavigationListeners } from './listeners/navigationListeners.js';
import { initializeOrderListeners } from './listeners/orderListeners.js';
import { initializeFinanceListeners } from './listeners/financeListeners.js';


// ========================================================
// PARTE 2: ESTADO GLOBAL E CONFIGURAÇÕES DA APLICAÇÃO
// ========================================================

let userCompanyId = null;
let userCompanyName = null;
let userBankBalanceConfig = { initialBalance: 0 };

let currentDashboardView = 'orders';
let currentOrdersView = 'pending';
let partCounter = 0;
let currentOptionType = ''; // Para o modal de gerenciamento de opções

// <-- ESTADO 'customerMap' REMOVIDO -->

const defaultOptions = {
    partTypes: ['Gola redonda manga curta', 'Gola redonda manga longa', 'Gola redonda manga longa com capuz', 'Gola redonda manga curta (sublimada na frente)', 'Gola polo manga curta', 'Gola polo manga longa', 'Gola V manga curta', 'Gola V manga longa', 'Short', 'Calça'],
    materialTypes: ['Malha fria', 'Drifity', 'Cacharrel', 'PP', 'Algodão Fio 30', 'TNT drive', 'Piquê', 'Brim']
};


// ========================================================
// PARTE 3: LÓGICA DE INICIALIZAÇÃO E AUTENTICAÇÃO
// ========================================================

// <-- FUNÇÃO 'updateCustomerData' REMOVIDA -->


const initializeAppLogic = async (user) => {
    const userMappingRef = doc(db, "user_mappings", user.uid);
    const userMappingSnap = await getDoc(userMappingRef);
    
    if (userMappingSnap.exists()) {
        userCompanyId = userMappingSnap.data().companyId;
        const companyRef = doc(db, "companies", userCompanyId);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
            const companyData = companySnap.data();
            userCompanyName = companyData.companyName || user.email;
            userBankBalanceConfig = companyData.bankBalanceConfig || { initialBalance: 0 };
        } else {
            userCompanyName = user.email; 
            userBankBalanceConfig = { initialBalance: 0 };
        }
        UI.DOM.userEmail.textContent = userCompanyName;
        
        // --- INICIALIZAÇÃO REATIVA (PÓS-REATORAÇÃO) ---
        // 1. Inicializa os serviços passando os NOVOS handlers
        initializeOrderService(userCompanyId, handleOrderChange, () => currentOrdersView);
        initializeFinanceService(userCompanyId, handleFinanceChange, () => userBankBalanceConfig);
        initializePricingService(userCompanyId, handlePricingChange);
        
        // 2. Renderiza a UI inicial usando o cache (que ainda está vazio)
        UI.renderOrders(getAllOrders(), currentOrdersView);
        UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig);
        // A tabela de preços é renderizada quando o modal é aberto

        // <-- CHAMADA 'updateCustomerData()' REMOVIDA -->
        
        // --- FIM DA INICIALIZAÇÃO REATIVA ---
        
        initializeIdleTimer(UI.DOM, handleLogout);
        initializeAndPopulateDatalists(); // Datalists de peças/materiais
        checkBackupReminder();
        triggerAutoBackupIfNeeded();
        UI.updateNavButton(currentDashboardView);
        
        UI.DOM.authContainer.classList.add('hidden');
        UI.DOM.app.classList.remove('hidden');

    } else {
        UI.showInfoModal("Erro: Usuário não associado a nenhuma empresa. Fale com o suporte.");
        handleLogout();
    }
};

const cleanupApplication = () => {
    UI.DOM.app.classList.add('hidden');
    UI.DOM.authContainer.classList.remove('hidden');
    
    cleanupOrderService();
    cleanupFinanceService();
    cleanupPricingService();
    
    userCompanyId = null;
    userCompanyName = null;
    userBankBalanceConfig = { initialBalance: 0 };
    // <-- LIMPEZA 'customerMap.clear()' REMOVIDA -->
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        initializeAppLogic(user);
    } else {
        cleanupApplication();
    }
});


// ========================================================
// PARTE 4: HANDLERS DE MUDANÇA (LÓGICA REATIVA)
// ========================================================

/**
 * Lida com mudanças granulares vindas do orderService
 * @param {string} type - 'added', 'modified', 'removed'
 * @param {object} order - O documento do pedido
 * @param {string} viewType - O 'currentOrdersView' ('pending' ou 'delivered')
 */
const handleOrderChange = (type, order, viewType) => {
    // --- CORREÇÃO v4.2.1: Lógica de Roteamento ---
    
    const isDelivered = order.orderStatus === 'Entregue';

    // Rota 1: Estamos na view 'pending'
    if (viewType === 'pending') {
        // Se o pedido foi marcado como 'Entregue' (vindo de 'added' ou 'modified')
        if (isDelivered) {
            // DEVE ser removido da view 'pending'
            UI.removeOrderCard(order.id);
            return; // <-- Retorna here, pois a UI não será afetada (diferente da versão com Mini-CRM)
        } else {
            // Se NÃO está 'Entregue', processa normalmente
            switch (type) {
                case 'added':
                    UI.addOrderCard(order, viewType);
                    break;
                case 'modified':
                    UI.updateOrderCard(order, viewType);
                    break;
                case 'removed':
                    UI.removeOrderCard(order.id);
                    break;
            }
        }
    } 
    // Rota 2: Estamos na view 'delivered'
    else if (viewType === 'delivered') {
        // Se o pedido NÃO está 'Entregue' (ex: foi movido de volta para 'pendente')
        if (!isDelivered) {
            // DEVE ser removido da view 'delivered'
            UI.removeOrderCard(order.id);
            return; // <-- Retorna here, pois a UI não será afetada (diferente da versão com Mini-CRM)
        } else {
             // Se ESTÁ 'Entregue', processa normally
            switch (type) {
                case 'added':
                    UI.addOrderCard(order, viewType);
                    break;
                case 'modified':
                    UI.updateOrderCard(order, viewType);
                    break;
                case 'removed':
                    UI.removeOrderCard(order.id);
                    break;
            }
        }
    }
    // --- FIM DA CORREÇÃO ---

    // <-- CHAMADA 'updateCustomerData()' REMOVIDA -->
};

/**
 * Lida com mudanças granulares vindas do financeService
 * @param {string} type - 'added', 'modified', 'removed'
 * @param {object} transaction - O documento da transação
 * @param {object} config - O userBankBalanceConfig
 */
const handleFinanceChange = (type, transaction, config) => {
    // 1. Atualiza os KPIs (cards superiores) em TODA mudança, pois qualquer evento afeta os totais
    UI.renderFinanceKPIs(getAllTransactions(), config);
    
    // 2. Verifica se a transação passa nos filtros atuais (data e busca) antes de atualizar a tabela
    const filter = UI.DOM.periodFilter.value;
    const now = new Date();
    let startDate, endDate;

    if (filter === 'custom') {
        startDate = UI.DOM.startDateInput.value ? new Date(UI.DOM.startDateInput.value + 'T00:00:00') : null;
        endDate = UI.DOM.endDateInput.value ? new Date(UI.DOM.endDateInput.value + 'T23:59:59') : null;
    } else {
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const startOfThisYear = new Date(now.getFullYear(), 0, 1);
        const endOfThisYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        if (filter === 'thisMonth') { startDate = startOfThisMonth; endDate = endOfThisMonth; }
        if (filter === 'lastMonth') { startDate = startOfLastMonth; endDate = endOfLastMonth; }
        if (filter === 'thisYear') { startDate = startOfThisYear; endDate = endOfThisYear; }
    }
    
    const transactionDate = new Date(transaction.date + 'T00:00:00');
    let passesDateFilter = true;
    if (startDate && endDate) passesDateFilter = transactionDate >= startDate && transactionDate <= endDate;
    else if(startDate && !endDate) passesDateFilter = transactionDate >= startDate;
    else if(!startDate && endDate) passesDateFilter = transactionDate <= endDate;

    const searchTerm = UI.DOM.transactionSearchInput.value.toLowerCase();
    const passesSearchFilter = transaction.description.toLowerCase().includes(searchTerm);

    // v5.0: Se a transação for modificada e não passar mais no filtro, deve ser removida da lista
    if (!passesDateFilter || !passesSearchFilter) {
        if (type === 'modified' || type === 'removed') {
             UI.removeTransactionRow(transaction.id);
        }
        return; // Ignora 'added' que não passa no filtro
    }

    // 3. Se passou nos filtros, atualiza a tabela
    switch (type) {
        case 'added':
            UI.addTransactionRow(transaction);
            break;
        case 'modified':
            UI.updateTransactionRow(transaction);
            break;
        case 'removed':
            UI.removeTransactionRow(transaction.id);
            break;
    }
};

/**
 * Lida com mudanças granulares vindas do pricingService
 * @param {string} type - 'added', 'modified', 'removed'
 * @param {object} item - O documento do item de preço
 */
const handlePricingChange = (type, item) => {
    // O modal de preços pode não estar aberto, mas atualizamos mesmo assim
    // A função `renderPriceTable` é chamada quando o modal abre,
    // mas as funções granulares atualizam se ele JÁ ESTIVER aberto.
    
    // Precisamos saber se estamos em 'view' ou 'edit' mode
    const isEditMode = !UI.DOM.editPriceTableBtn.classList.contains('hidden');
    const mode = isEditMode ? 'view' : 'edit';
    
    switch (type) {
        case 'added':
            UI.addPriceTableRow(item, mode);
            break;
        case 'modified':
            UI.updatePriceTableRow(item, mode);
            break;
        case 'removed':
            UI.removePriceTableRow(item.id);
            break;
    }
};


// ========================================================
// PARTE 5: FUNÇÕES DE LÓGICA TRANSVERSAL (Cross-Cutting)
// ========================================================

const getOptionsFromStorage = (type) => {
    const stored = localStorage.getItem(`${userCompanyId}_${type}`);
    return stored ? JSON.parse(stored) : defaultOptions[type];
};

const saveOptionsToStorage = (type, options) => {
    localStorage.setItem(`${userCompanyId}_${type}`, JSON.stringify(options));
};

const initializeAndPopulateDatalists = () => {
    if (!localStorage.getItem(`${userCompanyId}_partTypes`)) saveOptionsToStorage('partTypes', defaultOptions.partTypes);
    if (!localStorage.getItem(`${userCompanyId}_materialTypes`)) saveOptionsToStorage('materialTypes', defaultOptions.materialTypes);
    UI.populateDatalists(getOptionsFromStorage('partTypes'), getOptionsFromStorage('materialTypes'));
};

const handleBackup = () => {
    const orders = getAllOrders();
    const transactions = getAllTransactions();
    if (orders.length === 0 && transactions.length === 0) {
        UI.showInfoModal("Não há dados para fazer backup.");
        return;
    }
    const backupData = {
        orders: orders.map(({ id, ...rest }) => rest),
        transactions: transactions.map(({ id, ...rest }) => rest)
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    localStorage.setItem(`lastAutoBackupTimestamp_${userCompanyId}`, Date.now().toString());
    UI.showInfoModal("Backup completo gerado com sucesso!");
};

const processRestore = async (ordersToRestore, transactionsToRestore) => {
    const choice = await UI.showConfirmModal("Escolha o modo de importação:", "Adicionar aos existentes", "Substituir tudo");
    if (choice === null) return;
    UI.showInfoModal("Restaurando dados... Por favor, aguarde.");
    if (choice) {
        const batch = writeBatch(db);
        ordersToRestore.forEach(order => batch.set(doc(collection(db, `companies/${userCompanyId}/orders`)), order));
        transactionsToRestore.forEach(t => batch.set(doc(collection(db, `companies/${userCompanyId}/transactions`)), t));
        await batch.commit();
        UI.showInfoModal(`${ordersToRestore.length} pedido(s) e ${transactionsToRestore.length} lançamento(s) foram ADICIONADOS.`);
    } else {
        const confirmReplace = await UI.showConfirmModal("ATENÇÃO: Isto vai APAGAR TODOS os dados atuais. A ação NÃO PODE SER DESFEITA. Continuar?", "Sim, substituir tudo", "Cancelar");
        if (confirmReplace) {
            const deleteBatch = writeBatch(db);
            getAllOrders().forEach(o => deleteBatch.delete(doc(db, `companies/${userCompanyId}/orders`, o.id)));
            getAllTransactions().forEach(t => deleteBatch.delete(doc(db, `companies/${userCompanyId}/transactions`, t.id)));
            await deleteBatch.commit();
            const addBatch = writeBatch(db);
            ordersToRestore.forEach(order => addBatch.set(doc(collection(db, `companies/${userCompanyId}/orders`)), order));
            transactionsToRestore.forEach(t => addBatch.set(doc(collection(db, `companies/${userCompanyId}/transactions`)), t));
            await addBatch.commit();
            UI.showInfoModal(`Dados substituídos com sucesso.`);
        }
    }
    // <-- CHAMADA 'updateCustomerData()' REMOVIDA -->
};

const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof data !== 'object' || data === null || (!data.orders && !data.transactions)) {
                 UI.showInfoModal("Arquivo de backup inválido ou em formato incorreto.");
                 return;
            }
            await processRestore(data.orders || [], data.transactions || []);
        } catch (error) {
            console.error("Erro ao processar backup:", error);
            UI.showInfoModal("Arquivo de backup inválido ou corrompido.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

const triggerAutoBackupIfNeeded = () => {
    const key = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackup = localStorage.getItem(key);
    if (!lastBackup) return;
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    if ((Date.now() - parseInt(lastBackup)) > sevenDaysInMillis) {
        UI.showInfoModal("Backup semi-automático iniciado. Seu último backup foi há mais de 7 dias.");
        handleBackup();
    }
};

const checkBackupReminder = () => {
    const key = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackup = localStorage.getItem(key);
    if (!lastBackup) return;
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    if ((Date.now() - parseInt(lastBackup)) > sevenDaysInMillis) {
        UI.DOM.backupReminderBanner.classList.remove('hidden');
    }
};

// ========================================================
// PARTE 6: EVENT LISTENERS (A "COLA" DA APLICAÇÃO)
// ========================================================

// --- Inicialização dos Módulos de Listeners ---
initializeAuthListeners();

initializeNavigationListeners({
    handleBackup,
    handleRestore,
    getOrders: getAllOrders,
    getTransactions: getAllTransactions,
    getConfig: () => userBankBalanceConfig,
    getState: () => ({ currentDashboardView, currentOrdersView }),
    setState: (newState) => {
        if (newState.currentDashboardView !== undefined) {
            currentDashboardView = newState.currentDashboardView;
        }
        if (newState.currentOrdersView !== undefined) {
            currentOrdersView = newState.currentOrdersView;
        }
    }
});

initializeOrderListeners({
    getState: () => ({ partCounter }),
    setState: (newState) => {
        if (newState.partCounter !== undefined) partCounter = newState.partCounter;
        if (newState.currentOptionType !== undefined) currentOptionType = newState.currentOptionType;
    },
    getOptionsFromStorage,
    services: {
        saveOrder,
        getOrderById,
        getAllOrders,
        deleteOrder,
        saveTransaction,
        deleteTransaction,
        getTransactionByOrderId,
        deleteAllTransactionsByOrderId
    },
    userCompanyName: () => userCompanyName 
});

// v4.3.9: Injeção de Dependência para os listeners Financeiros
initializeFinanceListeners({
    services: {
        saveTransaction,
        deleteTransaction,
        markTransactionAsPaid,
        getAllTransactions,
        saveInitialBalance
    },
    getConfig: () => userBankBalanceConfig,
    setConfig: (newState) => {
        if (newState.initialBalance !== undefined) {
            userBankBalanceConfig.initialBalance = newState.initialBalance;
        }
    }
});


// --- Listeners de Modais Genéricos e Opções ---
// v4.2.7: Adiciona o botão de cancelar do novo modal
[UI.DOM.infoModalCloseBtn, UI.DOM.cancelTransactionBtn, UI.DOM.cancelBalanceBtn, UI.DOM.closeOptionsModalBtn, UI.DOM.settlementCancelBtn].forEach(button => {
    if (button) button.addEventListener('click', () => button.closest('.fixed').classList.add('hidden'));
});

UI.DOM.addOptionBtn.addEventListener('click', () => {
    const newOption = UI.DOM.newOptionInput.value.trim();
    if (newOption && currentOptionType) {
        let options = getOptionsFromStorage(currentOptionType);
        if (!options.includes(newOption)) {
            options.push(newOption);
            saveOptionsToStorage(currentOptionType, options);
            UI.populateDatalists(getOptionsFromStorage('partTypes'), getOptionsFromStorage('materialTypes'));
            UI.openOptionsModal(currentOptionType, options);
            UI.DOM.newOptionInput.value = '';
        }
    }
});

UI.DOM.optionsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-option-btn')) {
        let options = getOptionsFromStorage(currentOptionType);
        options.splice(e.target.dataset.index, 1);
        saveOptionsToStorage(currentOptionType, options);
        UI.populateDatalists(getOptionsFromStorage('partTypes'), getOptionsFromStorage('materialTypes'));
        UI.openOptionsModal(currentOptionType, options);
    }
});

// --- Tabela de Preços ---
UI.DOM.priceTableBtn.addEventListener('click', () => { 
    // Renderiza a tabela com o cache local atual ao abrir
    UI.renderPriceTable(getAllPricingItems(), 'view'); 
    UI.DOM.priceTableModal.classList.remove('hidden'); 
});
UI.DOM.closePriceTableBtn.addEventListener('click', () => UI.DOM.priceTableModal.classList.add('hidden'));
UI.DOM.editPriceTableBtn.addEventListener('click', () => UI.renderPriceTable(getAllPricingItems(), 'edit'));
UI.DOM.cancelPriceTableBtn.addEventListener('click', () => UI.renderPriceTable(getAllPricingItems(), 'view'));

UI.DOM.addPriceItemBtn.addEventListener('click', () => { 
    // Adiciona uma linha "new-" temporária
    const newItem = { id: `new-${Date.now()}` };
    UI.addPriceTableRow(newItem, 'edit');
});

UI.DOM.savePriceTableBtn.addEventListener('click', async () => {
    try {
        const itemsToSave = Array.from(document.getElementById('priceTableBody').querySelectorAll('tr'))
            .map(row => ({ 
                id: row.dataset.id, 
                name: row.querySelector('.price-item-name').value.trim(), 
                description: row.querySelector('.price-item-desc').value.trim(), 
                price: parseFloat(row.querySelector('.price-item-price').value) || 0
            }))
            .filter(item => item.name); // Salva apenas se tiver nome

        await savePriceTableChanges(itemsToSave);
        // O listener reativo (handlePricingChange) cuidará de atualizar a UI
        // Mas mudamos para 'view' mode
        UI.renderPriceTable(getAllPricingItems(), 'view');

    } catch (error) {
        console.error("Erro ao salvar tabela de preços:", error);
        UI.showInfoModal("Não foi possível salvar as alterações.");
    }
});
UI.DOM.priceTableContainer.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-price-item-btn');
    if (deleteBtn) {
        const row = deleteBtn.closest('tr');
        const itemId = row.dataset.id;
        
        if (itemId.startsWith('new-')) {
            // Se for novo (local), apenas remove da UI
            UI.removePriceTableRow(itemId);
        } else {
            // Se for existente, pede confirmação e deleta do DB
            UI.showConfirmModal("Tem certeza que deseja excluir este item?", "Excluir", "Cancelar")
              .then(ok => {
                  if (ok) deletePriceItem(itemId); // O listener cuidará de remover da UI
              });
        }
    }
});

// --- Listener Global de Teclado para Atalhos ---
document.addEventListener('keydown', (event) => {
    // Atalho para confirmação (Enter)
    if (event.key === 'Enter') {
        // Confirma Ação (ex: Excluir)
        if (!UI.DOM.confirmModal.classList.contains('hidden')) {
            UI.DOM.confirmOkBtn.click();
            event.preventDefault(); // Previne o comportamento padrão do Enter
        } 
        // v4.2.7: Confirma Quitação
        else if (!UI.DOM.settlementModal.classList.contains('hidden')) {
            UI.DOM.settlementConfirmBtn.click();
            event.preventDefault();
        }
        // Salva Saldo Inicial
        else if (!UI.DOM.initialBalanceModal.classList.contains('hidden')) {
            UI.DOM.saveBalanceBtn.click();
            event.preventDefault();
        } 
        // Envia E-mail de Redefinição de Senha
        else if (!UI.DOM.forgotPasswordModal.classList.contains('hidden')) {
            UI.DOM.sendResetEmailBtn.click();
            event.preventDefault();
        } 
        // Fecha Modal de Informação
        else if (!UI.DOM.infoModal.classList.contains('hidden')) {
            UI.DOM.infoModalCloseBtn.click();
        }
    }

    // Atalho para cancelamento/fechamento (Escape)
    if (event.key === 'Escape') {
        // A ordem aqui é importante, dos modais mais "altos" para os mais "baixos"
        if (!UI.DOM.confirmModal.classList.contains('hidden')) {
            UI.DOM.confirmCancelBtn.click();
        } 
        // v4.2.7: Cancela Quitação
        else if (!UI.DOM.settlementModal.classList.contains('hidden')) {
            UI.DOM.settlementCancelBtn.click();
        }
        else if (!UI.DOM.initialBalanceModal.classList.contains('hidden')) {
            UI.DOM.cancelBalanceBtn.click();
        } 
        else if (!UI.DOM.forgotPasswordModal.classList.contains('hidden')) {
            UI.DOM.cancelResetBtn.click();
        } 
        else if (!UI.DOM.viewModal.classList.contains('hidden')) {
            document.getElementById('closeViewBtn')?.click();
        } 
        else if (!UI.DOM.orderModal.classList.contains('hidden')) {
            UI.DOM.cancelBtn.click();
        } 
        else if (!UI.DOM.priceTableModal.classList.contains('hidden')) {
            // Se o botão 'Cancelar' (modo de edição) estiver visível, clica nele. Senão, clica em 'Fechar'.
            if (!UI.DOM.cancelPriceTableBtn.classList.contains('hidden')) {
                UI.DOM.cancelPriceTableBtn.click();
            } else {
                UI.DOM.closePriceTableBtn.click();
            }
        }
        else if (!UI.DOM.transactionModal.classList.contains('hidden')) {
            UI.DOM.cancelTransactionBtn.click();
        }
        else if (!UI.DOM.optionsModal.classList.contains('hidden')) {
            UI.DOM.closeOptionsModalBtn.click();
        }
        else if (!UI.DOM.infoModal.classList.contains('hidden')) {
            UI.DOM.infoModalCloseBtn.click();
        }
    }
});
