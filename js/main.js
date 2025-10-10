// ========================================================
// PARTE 1: IMPORTAÇÕES DE MÓDULOS
// ========================================================

// Firebase Core & Config
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db, auth } from './firebaseConfig.js';

// Módulo de Autenticação
import { handleLogin, handleLogout, handleForgotPassword } from './auth.js';

// Módulos de Serviços de Negócio
import { initializeOrderService, saveOrder, deleteOrder, getOrderById, getAllOrders, cleanupOrderService } from './services/orderService.js';
import { initializeFinanceService, saveTransaction, deleteTransaction, markTransactionAsPaid, saveInitialBalance, getAllTransactions, cleanupFinanceService } from './services/financeService.js';
import { initializePricingService, savePriceTableChanges, deletePriceItem, getAllPricingItems, cleanupPricingService } from './services/pricingService.js';

// Módulo de Utilitários
import { initializeIdleTimer, resetIdleTimer, fileToBase64, uploadToImgBB, generateComprehensivePdf, generateReceiptPdf } from './utils.js';

// Módulo de Interface do Usuário (UI) - Importando tudo sob o namespace 'UI'
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
        
        initializeOrderService(userCompanyId, UI.renderOrders, () => currentOrdersView);
        initializeFinanceService(userCompanyId, UI.renderFinanceDashboard, () => userBankBalanceConfig);
        initializePricingService(userCompanyId, (items) => UI.renderPriceTable(items, 'view'));
        
        initializeIdleTimer(UI.DOM, handleLogout);
        initializeAndPopulateDatalists();
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
};

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

    UI.showInfoModal("Restaurando dados... Por favor, aguarde.");

    if (choice) { // Adicionar
        const batch = writeBatch(db);
        ordersToRestore.forEach(order => {
            const newDocRef = doc(collection(db, `companies/${userCompanyId}/orders`));
            batch.set(newDocRef, order);
        });
        transactionsToRestore.forEach(t => {
            const newDocRef = doc(collection(db, `companies/${userCompanyId}/transactions`));
            batch.set(newDocRef, t);
        });
        await batch.commit();
        UI.showInfoModal(`${ordersToRestore.length} pedido(s) e ${transactionsToRestore.length} lançamento(s) foram ADICIONADOS.`);
    } else { // Substituir
        const confirmReplace = await UI.showConfirmModal(
            "ATENÇÃO: Isto vai APAGAR TODOS os seus pedidos E lançamentos financeiros atuais. A ação NÃO PODE SER DESFEITA. Continuar?",
            "Sim, substituir tudo", "Cancelar"
        );
        if (confirmReplace) {
            const deleteBatch = writeBatch(db);
            getAllOrders().forEach(o => deleteBatch.delete(doc(db, `companies/${userCompanyId}/orders`, o.id)));
            getAllTransactions().forEach(t => deleteBatch.delete(doc(db, `companies/${userCompanyId}/transactions`, t.id)));
            await deleteBatch.commit();

            const addBatch = writeBatch(db);
            ordersToRestore.forEach(order => {
                const newDocRef = doc(collection(db, `companies/${userCompanyId}/orders`));
                addBatch.set(newDocRef, order);
            });
            transactionsToRestore.forEach(t => {
                const newDocRef = doc(collection(db, `companies/${userCompanyId}/transactions`));
                addBatch.set(newDocRef, t);
            });
            await addBatch.commit();
            
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
            const ordersToRestore = dataFromFile.orders || [];
            const transactionsToRestore = dataFromFile.transactions || [];
            if (!Array.isArray(ordersToRestore) || !Array.isArray(transactionsToRestore)) throw new Error("Formato de backup inválido.");
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

// --- Coleta de Dados do Formulário ---
const collectFormData = () => {
    const orderData = {
        clientName: UI.DOM.clientName.value, clientPhone: UI.DOM.clientPhone.value,
        orderStatus: UI.DOM.orderStatus.value, orderDate: UI.DOM.orderDate.value,
        deliveryDate: UI.DOM.deliveryDate.value, generalObservation: UI.DOM.generalObservation.value,
        parts: [], downPayment: parseFloat(UI.DOM.downPayment.value) || 0,
        discount: parseFloat(UI.DOM.discount.value) || 0, paymentMethod: UI.DOM.paymentMethod.value,
        mockupUrls: Array.from(UI.DOM.existingFilesContainer.querySelectorAll('a')).map(a => a.href)
    };
    UI.DOM.partsContainer.querySelectorAll('.part-item').forEach(pItem => {
        const partId = pItem.dataset.partId;
        const part = {
            type: pItem.querySelector('.part-type').value, material: pItem.querySelector('.part-material').value,
            colorMain: pItem.querySelector('.part-color-main').value, partInputType: pItem.dataset.partType,
            sizes: {}, details: [], specifics: [], unitPriceStandard: 0, unitPriceSpecific: 0, unitPrice: 0
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
                if (width || height || observation) part.specifics.push({ width, height, observation });
            });
            const stdPriceRow = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="standard"]`);
            if(stdPriceRow) part.unitPriceStandard = parseFloat(stdPriceRow.querySelector('.financial-price').value) || 0;
            const specPriceRow = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="specific"]`);
            if(specPriceRow) part.unitPriceSpecific = parseFloat(specPriceRow.querySelector('.financial-price').value) || 0;
        } else {
            pItem.querySelectorAll('.detailed-item-row').forEach(row => {
                const name = row.querySelector('.item-det-name').value;
                const size = row.querySelector('.item-det-size').value;
                const number = row.querySelector('.item-det-number').value;
                if (name || size || number) part.details.push({ name, size, number });
            });
            const dtlPriceRow = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="detailed"]`);
            if(dtlPriceRow) part.unitPrice = parseFloat(dtlPriceRow.querySelector('.financial-price').value) || 0;
        }
        orderData.parts.push(part);
    });
    return orderData;
};


// ========================================================
// PARTE 5: EVENT LISTENERS (A "COLA" DA APLICAÇÃO)
// ========================================================

window.addEventListener('load', () => UI.handleCookieConsent());
['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));

// --- Autenticação ---
UI.DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin(UI.DOM.loginEmail.value, UI.DOM.loginPassword.value);
});
UI.DOM.forgotPasswordBtn.addEventListener('click', handleForgotPassword);
UI.DOM.logoutBtn.addEventListener('click', handleLogout);

// --- Navegação e Menu Principal ---
UI.DOM.financeDashboardBtn.addEventListener('click', () => {
    currentDashboardView = currentDashboardView === 'orders' ? 'finance' : 'orders';
    UI.DOM.ordersDashboard.classList.toggle('hidden', currentDashboardView !== 'orders');
    UI.DOM.financeDashboard.classList.toggle('hidden', currentDashboardView === 'orders');
    UI.updateNavButton(currentDashboardView);
    if (currentDashboardView === 'finance') UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig);
});
UI.DOM.userMenuBtn.addEventListener('click', () => UI.DOM.userDropdown.classList.toggle('hidden'));
document.addEventListener('click', (e) => {
    if (UI.DOM.userMenuBtn && !UI.DOM.userMenuBtn.parentElement.contains(e.target) && !UI.DOM.userDropdown.classList.contains('hidden')) {
        UI.DOM.userDropdown.classList.add('hidden');
    }
});
UI.DOM.toggleViewBtn.addEventListener('click', () => {
    currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
    UI.DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
    UI.renderOrders(getAllOrders(), currentOrdersView);
});

// --- Ações Gerais (Backup, Restore, etc.) ---
UI.DOM.backupBtn.addEventListener('click', handleBackup);
UI.DOM.restoreFileInput.addEventListener('change', handleRestore);
UI.DOM.requestDeletionBtn.addEventListener('click', async () => {
    const confirmed = await UI.showConfirmModal("Isto registrará uma solicitação. Para formalizar, envie um e-mail ao administrador. Deseja continuar?", "Sim", "Cancelar");
    if (confirmed) UI.showInfoModal(`Para concluir, por favor, envie um e-mail para paglucrobr@gmail.com solicitando a remoção da sua conta.`);
});
UI.DOM.cookieAcceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'true');
    UI.DOM.cookieBanner.classList.add('hidden');
});
UI.DOM.backupNowBtn.addEventListener('click', () => {
    handleBackup();
    UI.DOM.backupReminderBanner.classList.add('hidden');
});
UI.DOM.dismissBackupReminderBtn.addEventListener('click', () => UI.DOM.backupReminderBanner.classList.add('hidden'));

// --- Interações com Pedidos (Lista e Formulário) ---
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
        const savedOrderId = await saveOrder(orderData, orderId);
        const savedOrder = { ...orderData, id: savedOrderId };
        UI.DOM.orderModal.classList.add('hidden');
        const isCompleted = savedOrder.orderStatus === 'Finalizado' || savedOrder.orderStatus === 'Entregue';
        if (isCompleted) {
            const generate = await UI.showConfirmModal("Pedido salvo! Deseja gerar um recibo de quitação?", "Sim", "Não");
            if (generate) generateReceiptPdf(savedOrder, userCompanyName, UI.showInfoModal);
        }
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

// --- Interações com Finanças ---
const handleEditTransaction = (id) => {
    const transaction = getAllTransactions().find(t => t.id === id);
    if (!transaction) return;
    UI.DOM.transactionId.value = transaction.id;
    UI.DOM.transactionDate.value = transaction.date;
    UI.DOM.transactionDescription.value = transaction.description;
    UI.DOM.transactionAmount.value = transaction.amount;
    UI.DOM.transactionType.value = transaction.type;
    UI.DOM.transactionCategory.value = transaction.category || '';
    UI.updateSourceSelectionUI(transaction.source || 'banco');
    if (transaction.type === 'income') {
        UI.DOM.transactionStatusContainer.classList.remove('hidden');
        const statusInput = transaction.status === 'a_receber' ? UI.DOM.a_receber : UI.DOM.pago;
        if(statusInput) statusInput.checked = true;
    } else {
        UI.DOM.transactionStatusContainer.classList.add('hidden');
    }
    UI.DOM.transactionModalTitle.textContent = transaction.type === 'income' ? 'Editar Entrada' : 'Editar Despesa';
    UI.DOM.transactionModal.classList.remove('hidden');
};
UI.DOM.addIncomeBtn.addEventListener('click', () => {
    UI.DOM.transactionForm.reset();
    UI.DOM.transactionId.value = '';
    UI.DOM.transactionType.value = 'income';
    UI.DOM.transactionModalTitle.textContent = 'Nova Entrada';
    UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0];
    UI.DOM.transactionStatusContainer.classList.remove('hidden');
    UI.DOM.pago.checked = true;
    UI.updateSourceSelectionUI('banco');
    UI.DOM.transactionModal.classList.remove('hidden');
});
UI.DOM.addExpenseBtn.addEventListener('click', () => {
    UI.DOM.transactionForm.reset();
    UI.DOM.transactionId.value = '';
    UI.DOM.transactionType.value = 'expense';
    UI.DOM.transactionModalTitle.textContent = 'Nova Despesa';
    UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0];
    UI.DOM.transactionStatusContainer.classList.add('hidden');
    UI.updateSourceSelectionUI('banco');
    UI.DOM.transactionModal.classList.remove('hidden');
});
UI.DOM.transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedSourceEl = UI.DOM.transactionSourceContainer.querySelector('.source-selector.active');
    if (!selectedSourceEl) { UI.showInfoModal("Selecione a Origem (Banco ou Caixa)."); return; }
    const data = {
        date: UI.DOM.transactionDate.value, description: UI.DOM.transactionDescription.value,
        amount: parseFloat(UI.DOM.transactionAmount.value), type: UI.DOM.transactionType.value,
        category: UI.DOM.transactionCategory.value.trim(), source: selectedSourceEl.dataset.source,
        status: UI.DOM.transactionType.value === 'income' ? (UI.DOM.a_receber.checked ? 'a_receber' : 'pago') : 'pago'
    };
    if (!data.date || !data.description || isNaN(data.amount) || data.amount <= 0) { UI.showInfoModal("Preencha todos os campos."); return; }
    await saveTransaction(data, UI.DOM.transactionId.value);
    UI.DOM.transactionModal.classList.add('hidden');
});
UI.DOM.transactionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.id) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('edit-transaction-btn')) handleEditTransaction(id);
    if (btn.classList.contains('delete-transaction-btn')) UI.showConfirmModal("Excluir este lançamento?", "Excluir", "Cancelar").then(ok => ok && deleteTransaction(id));
    if (btn.classList.contains('mark-as-paid-btn')) markTransactionAsPaid(id);
});
UI.DOM.periodFilter.addEventListener('change', () => {
    UI.DOM.customPeriodContainer.classList.toggle('hidden', UI.DOM.periodFilter.value !== 'custom');
    UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig);
});
[UI.DOM.startDateInput, UI.DOM.endDateInput, UI.DOM.transactionSearchInput].forEach(el => el.addEventListener('input', () => UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig)));
UI.DOM.copyReportBtn.addEventListener('click', () => { /* Adicionar lógica de cópia aqui, se necessário */ });
UI.DOM.adjustBalanceBtn.addEventListener('click', () => {
    UI.DOM.initialBalanceInput.value = (userBankBalanceConfig.initialBalance || 0).toFixed(2);
    UI.DOM.initialBalanceModal.classList.remove('hidden');
});
UI.DOM.saveBalanceBtn.addEventListener('click', async () => {
    const newBalance = parseFloat(UI.DOM.initialBalanceInput.value);
    await saveInitialBalance(newBalance);
    userBankBalanceConfig.initialBalance = newBalance;
    UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig);
    UI.DOM.initialBalanceModal.classList.add('hidden');
});

// --- Listeners de Modais Genéricos ---
[UI.DOM.infoModalCloseBtn, UI.DOM.cancelTransactionBtn, UI.DOM.cancelBalanceBtn, UI.DOM.closeOptionsModalBtn].forEach(btn => btn.addEventListener('click', () => btn.closest('.modal-enter, .fixed').classList.add('hidden')));

// (Listeners de teclado e outros permanecem, mas foram omitidos por brevidade e já estão no seu código original)
