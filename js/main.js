// ========================================================
// PARTE 1: IMPORTAÇÕES DE MÓDULOS
// ========================================================

// Firebase Core & Config
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db, auth } from './firebaseConfig.js';

// Módulo de Autenticação
import { handleLogin, handleLogout, handleForgotPassword } from './auth.js';

// Módulos de Serviços de Negócio
import { initializeOrderService, saveOrder, deleteOrder, getOrderById, getAllOrders, cleanupOrderService } from './services/orderService.js';
import { initializeFinanceService, saveTransaction, deleteTransaction, markTransactionAsPaid, saveInitialBalance, getAllTransactions, cleanupFinanceService } from './services/financeService.js';
import { initializePricingService, savePriceTableChanges, deletePriceItem, getAllPricingItems, cleanupPricingService } from './services/pricingService.js';

// Módulo de Utilitários
import { initializeIdleTimer, resetIdleTimer, fileToBase64, uploadToImgBB, generateComprehensivePdf, generateReceiptPdf } from './utils.js';

// Módulo de Interface do Usuário (UI)
import * as UI from './ui.js';


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

const defaultOptions = {
    partTypes: ['Gola redonda manga curta', 'Gola redonda manga longa', 'Gola redonda manga longa com capuz', 'Gola redonda manga curta (sublimada na frente)', 'Gola polo manga curta', 'Gola polo manga longa', 'Gola V manga curta', 'Gola V manga longa', 'Short', 'Calça'],
    materialTypes: ['Malha fria', 'Drifity', 'Cacharrel', 'PP', 'Algodão Fio 30', 'TNT drive', 'Piquê', 'Brim']
};


// ========================================================
// PARTE 3: LÓGICA DE INICIALIZAÇÃO E AUTENTICAÇÃO
// ========================================================

/**
 * Função principal que é executada após um login bem-sucedido.
 * @param {object} user - O objeto do usuário autenticado do Firebase.
 */
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
        
        // Inicializa todos os serviços, passando as funções de callback da UI
        initializeOrderService(userCompanyId, UI.renderOrders, () => currentOrdersView);
        initializeFinanceService(userCompanyId, UI.renderFinanceDashboard, () => userBankBalanceConfig);
        initializePricingService(userCompanyId, (items) => UI.renderPriceTable(items, 'view'));
        
        // Inicializa funcionalidades transversais
        initializeIdleTimer(UI.DOM, handleLogout);
        initializeAndPopulateDatalists();
        checkBackupReminder();
        triggerAutoBackupIfNeeded();
        UI.updateNavButton(currentDashboardView);
        
        // Exibe a interface principal da aplicação
        UI.DOM.authContainer.classList.add('hidden');
        UI.DOM.app.classList.remove('hidden');

    } else {
        UI.showInfoModal("Erro: Usuário não associado a nenhuma empresa. Fale com o suporte.");
        handleLogout();
    }
};

/**
 * Limpa todos os dados da aplicação e desliga os listeners (executada no logout).
 */
const cleanupApplication = () => {
    // Alterna a visibilidade dos contêineres principais
    UI.DOM.app.classList.add('hidden');
    UI.DOM.authContainer.classList.remove('hidden');
    
    // Executa a limpeza de cada serviço para remover listeners do Firestore
    cleanupOrderService();
    cleanupFinanceService();
    cleanupPricingService();
    
    // Reseta o estado global da aplicação
    userCompanyId = null;
    userCompanyName = null;
    userBankBalanceConfig = { initialBalance: 0 };
    
    // Para o timer de inatividade (será reiniciado no próximo login)
    // Apenas a ausência de re-inicialização já é suficiente.
};

// Ponto de entrada principal: Observa mudanças no estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        initializeAppLogic(user);
    } else {
        cleanupApplication();
    }
});
// ========================================================
// PARTE 4: FUNÇÕES DE LÓGICA TRANSVERSAL (Cross-Cutting)
// ========================================================

// --- Lógica de Datalists (Opções de Peças/Materiais) ---
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

// --- Lógica de Backup & Restore ---
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
    const date = new Date().toISOString().split('T')[0];
    link.download = `backup-completo-${date}.json`;
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

    if (choice) { // Adicionar
        const batch = [];
        ordersToRestore.forEach(order => batch.push(saveOrder(order, null)));
        transactionsToRestore.forEach(t => batch.push(saveTransaction(t, null)));
        await Promise.all(batch);
        UI.showInfoModal(`${ordersToRestore.length} pedido(s) e ${transactionsToRestore.length} lançamento(s) foram ADICIONADOS.`);
    } else { // Substituir
        const confirmReplace = await UI.showConfirmModal(
            "ATENÇÃO: Isto vai APAGAR TODOS os seus pedidos E lançamentos financeiros atuais. A ação NÃO PODE SER DESFEITA. Continuar?",
            "Sim, substituir tudo", "Cancelar"
        );
        if (confirmReplace) {
            const deletePromises = [];
            getAllOrders().forEach(o => deletePromises.push(deleteOrder(o.id)));
            getAllTransactions().forEach(t => deletePromises.push(deleteTransaction(t.id)));
            await Promise.all(deletePromises);

            const addPromises = [];
            ordersToRestore.forEach(order => addPromises.push(saveOrder(order, null)));
            transactionsToRestore.forEach(t => addPromises.push(saveTransaction(t, null)));
            await Promise.all(addPromises);
            
            UI.showInfoModal(`Dados substituídos. ${ordersToRestore.length} pedido(s) e ${transactionsToRestore.length} lançamento(s) importados.`);
        }
    }
};

const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const dataFromFile = JSON.parse(e.target.result);
            let ordersToRestore = dataFromFile.orders || [];
            let transactionsToRestore = dataFromFile.transactions || [];
            
            if (!Array.isArray(ordersToRestore) || !Array.isArray(transactionsToRestore)) {
                throw new Error("Formato de backup inválido.");
            }
            await processRestore(ordersToRestore, transactionsToRestore);
        } catch (error) {
            console.error("Erro na restauração:", error);
            UI.showInfoModal("Arquivo de backup inválido ou corrompido.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

const triggerAutoBackupIfNeeded = () => {
    const storageKey = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackupTimestamp = localStorage.getItem(storageKey);
    if (!lastBackupTimestamp) return;

    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    if ((Date.now() - parseInt(lastBackupTimestamp)) > sevenDaysInMillis) {
        UI.showInfoModal("Backup semi-automático iniciado. Seu último backup foi há mais de 7 dias.");
        handleBackup();
    }
};

const checkBackupReminder = () => {
    const storageKey = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackupTimestamp = localStorage.getItem(storageKey);
    if (!lastBackupTimestamp) return;

    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    if ((Date.now() - parseInt(lastBackupTimestamp)) > sevenDaysInMillis) {
        UI.DOM.backupReminderBanner.classList.remove('hidden');
    }
};

// --- Coleta de Dados do Formulário (UI-Bound Logic) ---
const collectFormData = () => {
    // Esta função lê o estado atual do DOM do formulário e o transforma em um objeto de dados.
    const orderData = {
        clientName: UI.DOM.clientName.value,
        clientPhone: UI.DOM.clientPhone.value,
        orderStatus: UI.DOM.orderStatus.value,
        orderDate: UI.DOM.orderDate.value,
        deliveryDate: UI.DOM.deliveryDate.value,
        generalObservation: UI.DOM.generalObservation.value,
        parts: [],
        downPayment: parseFloat(UI.DOM.downPayment.value) || 0,
        discount: parseFloat(UI.DOM.discount.value) || 0,
        paymentMethod: UI.DOM.paymentMethod.value,
        mockupUrls: Array.from(UI.DOM.existingFilesContainer.querySelectorAll('a')).map(a => a.href)
    };
    
    UI.DOM.partsContainer.querySelectorAll('.part-item').forEach(pItem => {
        const partId = pItem.dataset.partId;
        const part = {
            type: pItem.querySelector('.part-type').value,
            material: pItem.querySelector('.part-material').value,
            colorMain: pItem.querySelector('.part-color-main').value,
            partInputType: pItem.dataset.partType,
            sizes: {}, details: [], specifics: [],
            unitPriceStandard: 0, unitPriceSpecific: 0, unitPrice: 0
        };

        if (part.partInputType === 'comum') {
            pItem.querySelectorAll('.size-input').forEach(input => {
                if (input.value) {
                    const { category, size } = input.dataset;
                    if (!part.sizes[category]) part.sizes[category] = {};
                    part.sizes[category][size] = parseInt(input.value, 10);
                }
            });
            pItem.querySelectorAll('.specific-size-row').forEach(row => {
                const width = row.querySelector('.item-spec-width').value.trim();
                const height = row.querySelector('.item-spec-height').value.trim();
                const observation = row.querySelector('.item-spec-obs').value.trim();
                if (width || height || observation) {
                    part.specifics.push({ width, height, observation });
                }
            });
            const standardPriceRow = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="standard"]`);
            if(standardPriceRow) part.unitPriceStandard = parseFloat(standardPriceRow.querySelector('.financial-price').value) || 0;
            
            const specificPriceRow = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="specific"]`);
            if(specificPriceRow) part.unitPriceSpecific = parseFloat(specificPriceRow.querySelector('.financial-price').value) || 0;

        } else { // Detalhado
            pItem.querySelectorAll('.detailed-item-row').forEach(row => {
                const name = row.querySelector('.item-det-name').value;
                const size = row.querySelector('.item-det-size').value;
                const number = row.querySelector('.item-det-number').value;
                if (name || size || number) part.details.push({ name, size, number });
            });
            const detailedPriceRow = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="detailed"]`);
            if(detailedPriceRow) part.unitPrice = parseFloat(detailedPriceRow.querySelector('.financial-price').value) || 0;
        }
        orderData.parts.push(part);
    });
    return orderData;
};


// ========================================================
// PARTE 5: EVENT LISTENERS (A "COLA" DA APLICAÇÃO)
// ========================================================

// --- Inicialização ---
window.addEventListener('load', () => {
    handleCookieConsent();
});

// --- Autenticação ---
UI.DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = UI.DOM.loginEmail.value;
    const password = UI.DOM.loginPassword.value;
    handleLogin(email, password);
});
UI.DOM.forgotPasswordBtn.addEventListener('click', handleForgotPassword);
UI.DOM.logoutBtn.addEventListener('click', handleLogout);

// --- Navegação e Menu ---
UI.DOM.financeDashboardBtn.addEventListener('click', () => {
    currentDashboardView = currentDashboardView === 'orders' ? 'finance' : 'orders';
    const isOrders = currentDashboardView === 'orders';
    UI.DOM.ordersDashboard.classList.toggle('hidden', !isOrders);
    UI.DOM.financeDashboard.classList.toggle('hidden', isOrders);
    updateNavButton(currentDashboardView);
    if (!isOrders) UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig);
});
UI.DOM.userMenuBtn.addEventListener('click', () => UI.DOM.userDropdown.classList.toggle('hidden'));
document.addEventListener('click', (e) => {
    if (UI.DOM.userMenuBtn && !UI.DOM.userMenuBtn.parentElement.contains(e.target) && !UI.DOM.userDropdown.classList.contains('hidden')) {
        UI.DOM.userDropdown.classList.add('hidden');
    }
});

// --- Pedidos ---
UI.DOM.addOrderBtn.addEventListener('click', () => {
    partCounter = 0;
    UI.resetForm();
    UI.DOM.orderModal.classList.remove('hidden');
});
UI.DOM.orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    UI.DOM.saveBtn.disabled = true;
    UI.DOM.uploadIndicator.classList.remove('hidden');
    try {
        const files = UI.DOM.mockupFiles.files;
        const uploadPromises = Array.from(files).map(file => fileToBase64(file).then(uploadToImgBB));
        const newUrls = (await Promise.all(uploadPromises)).filter(Boolean);

        const orderData = collectFormData();
        orderData.mockupUrls.push(...newUrls);

        const orderId = UI.DOM.orderId.value;
        await saveOrder(orderData, orderId);
        
        UI.DOM.orderModal.classList.add('hidden');
    } catch (error) {
        console.error("Erro ao salvar pedido:", error);
        UI.showInfoModal('Erro ao salvar o pedido.');
    } finally {
        UI.DOM.saveBtn.disabled = false;
        UI.DOM.uploadIndicator.classList.add('hidden');
    }
});
UI.DOM.ordersList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.id) return;
    const orderId = btn.dataset.id;
    
    if (btn.classList.contains('edit-btn')) {
        partCounter = 0;
        partCounter = UI.populateFormForEdit(getOrderById(orderId), partCounter);
    }
    if (btn.classList.contains('replicate-btn')) {
        partCounter = 0;
        partCounter = UI.populateFormForEdit(getOrderById(orderId), partCounter);
        UI.DOM.orderId.value = '';
        UI.DOM.modalTitle.textContent = 'Novo Pedido (Replicado)';
        UI.DOM.orderStatus.value = 'Pendente';
        UI.DOM.orderDate.value = new Date().toISOString().split('T')[0];
        UI.DOM.deliveryDate.value = '';
        UI.DOM.discount.value = '';
        UI.updateFinancials();
    }
    if (btn.classList.contains('delete-btn')) {
        UI.showConfirmModal("Tem certeza que deseja excluir este pedido?", "Excluir", "Cancelar")
          .then(confirmed => confirmed && deleteOrder(orderId));
    }
    if (btn.classList.contains('view-btn')) {
        UI.viewOrder(getOrderById(orderId));
    }
});
UI.DOM.toggleViewBtn.addEventListener('click', () => {
    currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
    UI.DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
    UI.renderOrders(getAllOrders(), currentOrdersView);
});

// --- Modal de Visualização de Pedido ---
UI.DOM.viewModal.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'closeViewBtn') {
        UI.DOM.viewModal.classList.add('hidden');
        UI.DOM.viewModal.innerHTML = '';
    }
    if (btn.id === 'comprehensivePdfBtn') {
        generateComprehensivePdf(btn.dataset.id, getAllOrders(), userCompanyName, UI.showInfoModal);
    }
});

// --- Formulário de Pedido (interações internas) ---
UI.DOM.cancelBtn.addEventListener('click', () => UI.DOM.orderModal.classList.add('hidden'));
UI.DOM.addPartBtn.addEventListener('click', () => {
    partCounter++;
    UI.addPart({}, partCounter);
});
UI.DOM.downPayment.addEventListener('input', UI.updateFinancials);
UI.DOM.discount.addEventListener('input', UI.updateFinancials);
UI.DOM.partsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button.manage-options-btn');
    if (btn) {
        currentOptionType = btn.dataset.type;
        UI.openOptionsModal(currentOptionType, getOptionsFromStorage(currentOptionType));
    }
});

// --- Finanças ---
UI.DOM.addIncomeBtn.addEventListener('click', () => {
    UI.DOM.transactionForm.reset();
    UI.DOM.transactionId.value = '';
    UI.DOM.transactionType.value = 'income';
    UI.DOM.transactionModalTitle.textContent = 'Nova Entrada';
    UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0];
    UI.DOM.transactionStatusContainer.classList.remove('hidden');
    UI.DOM.pago.checked = true;
    updateSourceSelectionUI('banco');
    UI.DOM.transactionModal.classList.remove('hidden');
});
UI.DOM.addExpenseBtn.addEventListener('click', () => {
    UI.DOM.transactionForm.reset();
    UI.DOM.transactionId.value = '';
    UI.DOM.transactionType.value = 'expense';
    UI.DOM.transactionModalTitle.textContent = 'Nova Despesa';
    UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0];
    UI.DOM.transactionStatusContainer.classList.add('hidden');
    updateSourceSelectionUI('banco');
    UI.DOM.transactionModal.classList.remove('hidden');
});
UI.DOM.transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = UI.DOM.transactionId.value;
    const selectedSourceEl = UI.DOM.transactionSourceContainer.querySelector('.source-selector.active');
    const data = {
        date: UI.DOM.transactionDate.value,
        description: UI.DOM.transactionDescription.value,
        amount: parseFloat(UI.DOM.transactionAmount.value),
        type: UI.DOM.transactionType.value,
        category: UI.DOM.transactionCategory.value.trim(),
        source: selectedSourceEl ? selectedSourceEl.dataset.source : 'banco',
        status: UI.DOM.transactionType.value === 'income' ? UI.DOM.transactionForm.querySelector('input[name="transactionStatus"]:checked').value : 'pago'
    };
    await saveTransaction(data, id);
    UI.DOM.transactionModal.classList.add('hidden');
});
UI.DOM.transactionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.id) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('edit-transaction-btn')) {
        // Lógica de edição vai aqui
    }
    if (btn.classList.contains('delete-transaction-btn')) {
        UI.showConfirmModal("Excluir este lançamento?", "Excluir", "Cancelar")
          .then(confirmed => confirmed && deleteTransaction(id));
    }
    if (btn.classList.contains('mark-as-paid-btn')) {
        markTransactionAsPaid(id);
    }
});

// --- Outros Listeners ---
UI.DOM.backupBtn.addEventListener('click', handleBackup);
UI.DOM.restoreFileInput.addEventListener('change', handleRestore);
['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));

// (Todos os outros listeners de modais, etc., podem ser adicionados aqui conforme o padrão)
