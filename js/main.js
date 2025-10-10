// ========================================================
// PARTE 1: IMPORTAÇÕES DE MÓDULOS
// ========================================================

// Firebase Core & Config
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, writeBatch, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
};

const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            await processRestore(data.orders || [], data.transactions || []);
        } catch (error) {
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
    if ((Date.now() - parseInt(lastBackup)) > 7 * 24 * 60 * 60 * 1000) {
        UI.showInfoModal("Backup semi-automático iniciado...");
        handleBackup();
    }
};

const checkBackupReminder = () => {
    const key = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackup = localStorage.getItem(key);
    if (lastBackup && (Date.now() - parseInt(lastBackup)) > 7 * 24 * 60 * 60 * 1000) {
        UI.DOM.backupReminderBanner.classList.remove('hidden');
    }
};

const collectFormData = () => {
    const data = {
        clientName: UI.DOM.clientName.value, clientPhone: UI.DOM.clientPhone.value, orderStatus: UI.DOM.orderStatus.value,
        orderDate: UI.DOM.orderDate.value, deliveryDate: UI.DOM.deliveryDate.value, generalObservation: UI.DOM.generalObservation.value,
        parts: [], downPayment: parseFloat(UI.DOM.downPayment.value) || 0, discount: parseFloat(UI.DOM.discount.value) || 0,
        paymentMethod: UI.DOM.paymentMethod.value, mockupUrls: Array.from(UI.DOM.existingFilesContainer.querySelectorAll('a')).map(a => a.href)
    };
    UI.DOM.partsContainer.querySelectorAll('.part-item').forEach(p => {
        const id = p.dataset.partId;
        const part = { type: p.querySelector('.part-type').value, material: p.querySelector('.part-material').value, colorMain: p.querySelector('.part-color-main').value, partInputType: p.dataset.partType, sizes: {}, details: [], specifics: [], unitPriceStandard: 0, unitPriceSpecific: 0, unitPrice: 0 };
        if (part.partInputType === 'comum') {
            p.querySelectorAll('.size-input').forEach(i => { if (i.value) { const {cat, size} = i.dataset; if (!part.sizes[cat]) part.sizes[cat] = {}; part.sizes[cat][size] = parseInt(i.value, 10); }});
            p.querySelectorAll('.specific-size-row').forEach(r => { const w = r.querySelector('.item-spec-width').value.trim(), h = r.querySelector('.item-spec-height').value.trim(), o = r.querySelector('.item-spec-obs').value.trim(); if(w||h||o) part.specifics.push({ width:w, height:h, observation:o }); });
            const std = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${id}"][data-price-group="standard"]`);
            if(std) part.unitPriceStandard = parseFloat(std.querySelector('.financial-price').value) || 0;
            const spec = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${id}"][data-price-group="specific"]`);
            if(spec) part.unitPriceSpecific = parseFloat(spec.querySelector('.financial-price').value) || 0;
        } else {
            p.querySelectorAll('.detailed-item-row').forEach(r => { const n = r.querySelector('.item-det-name').value, s = r.querySelector('.item-det-size').value, num = r.querySelector('.item-det-number').value; if(n||s||num) part.details.push({name:n, size:s, number:num}); });
            const dtl = UI.DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${id}"][data-price-group="detailed"]`);
            if(dtl) part.unitPrice = parseFloat(dtl.querySelector('.financial-price').value) || 0;
        }
        data.parts.push(part);
    });
    return data;
};

// ========================================================
// PARTE 5: EVENT LISTENERS (A "COLA" DA APLICAÇÃO)
// ========================================================

window.addEventListener('load', () => UI.handleCookieConsent());
['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));

UI.DOM.loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(UI.DOM.loginEmail.value, UI.DOM.loginPassword.value); });
UI.DOM.forgotPasswordBtn.addEventListener('click', handleForgotPassword);
UI.DOM.logoutBtn.addEventListener('click', handleLogout);

UI.DOM.financeDashboardBtn.addEventListener('click', () => {
    currentDashboardView = currentDashboardView === 'orders' ? 'finance' : 'orders';
    UI.DOM.ordersDashboard.classList.toggle('hidden', currentDashboardView !== 'orders');
    UI.DOM.financeDashboard.classList.toggle('hidden', currentDashboardView === 'orders');
    UI.updateNavButton(currentDashboardView);
    if (currentDashboardView === 'finance') UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig);
});
UI.DOM.userMenuBtn.addEventListener('click', () => UI.DOM.userDropdown.classList.toggle('hidden'));
document.addEventListener('click', (e) => { if (UI.DOM.userMenuBtn && !UI.DOM.userMenuBtn.parentElement.contains(e.target)) UI.DOM.userDropdown.classList.add('hidden'); });
UI.DOM.toggleViewBtn.addEventListener('click', () => {
    currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
    UI.DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
    UI.renderOrders(getAllOrders(), currentOrdersView);
});

UI.DOM.backupBtn.addEventListener('click', handleBackup);
UI.DOM.restoreFileInput.addEventListener('change', handleRestore);
UI.DOM.requestDeletionBtn.addEventListener('click', async () => { if (await UI.showConfirmModal("Isto registrará uma solicitação. Envie um e-mail ao administrador para formalizar. Continuar?", "Sim", "Cancelar")) UI.showInfoModal(`Para concluir, envie um e-mail para paglucrobr@gmail.com solicitando a remoção da sua conta.`); });
UI.DOM.cookieAcceptBtn.addEventListener('click', () => { localStorage.setItem('cookieConsent', 'true'); UI.DOM.cookieBanner.classList.add('hidden'); });
UI.DOM.backupNowBtn.addEventListener('click', () => { handleBackup(); UI.DOM.backupReminderBanner.classList.add('hidden'); });
UI.DOM.dismissBackupReminderBtn.addEventListener('click', () => UI.DOM.backupReminderBanner.classList.add('hidden'));

UI.DOM.addOrderBtn.addEventListener('click', () => { partCounter = 0; UI.resetForm(); UI.DOM.orderModal.classList.remove('hidden'); });
UI.DOM.orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    UI.DOM.saveBtn.disabled = true; UI.DOM.uploadIndicator.classList.remove('hidden');
    try {
        const newUrls = (await Promise.all(Array.from(UI.DOM.mockupFiles.files).map(f => fileToBase64(f).then(uploadToImgBB)))).filter(Boolean);
        const orderData = collectFormData();
        orderData.mockupUrls.push(...newUrls);
        const savedOrderId = await saveOrder(orderData, UI.DOM.orderId.value);
        UI.DOM.orderModal.classList.add('hidden');
        if (orderData.orderStatus === 'Finalizado' || orderData.orderStatus === 'Entregue') {
            if (await UI.showConfirmModal("Pedido salvo! Gerar recibo?", "Sim", "Não")) generateReceiptPdf({ ...orderData, id: savedOrderId }, userCompanyName, UI.showInfoModal);
        }
    } catch (error) { UI.showInfoModal('Erro ao salvar o pedido.'); } 
    finally { UI.DOM.saveBtn.disabled = false; UI.DOM.uploadIndicator.classList.add('hidden'); }
});
UI.DOM.ordersList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.id) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('edit-btn') || btn.classList.contains('replicate-btn')) {
        partCounter = 0;
        partCounter = UI.populateFormForEdit(getOrderById(id), partCounter);
        if (btn.classList.contains('replicate-btn')) {
            UI.DOM.orderId.value = ''; UI.DOM.modalTitle.textContent = 'Novo Pedido (Replicado)';
            UI.DOM.orderStatus.value = 'Pendente'; UI.DOM.orderDate.value = new Date().toISOString().split('T')[0];
            UI.DOM.deliveryDate.value = ''; UI.DOM.discount.value = ''; UI.updateFinancials();
        }
    } else if (btn.classList.contains('delete-btn')) {
        UI.showConfirmModal("Excluir este pedido?", "Excluir", "Cancelar").then(ok => ok && deleteOrder(id));
    } else if (btn.classList.contains('view-btn')) {
        UI.viewOrder(getOrderById(id));
    }
});
UI.DOM.viewModal.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'closeViewBtn') { UI.DOM.viewModal.classList.add('hidden'); UI.DOM.viewModal.innerHTML = ''; }
    if (btn.id === 'comprehensivePdfBtn') generateComprehensivePdf(btn.dataset.id, getAllOrders(), userCompanyName, UI.showInfoModal);
});
UI.DOM.cancelBtn.addEventListener('click', () => UI.DOM.orderModal.classList.add('hidden'));
UI.DOM.addPartBtn.addEventListener('click', () => { partCounter++; UI.addPart({}, partCounter); });
UI.DOM.downPayment.addEventListener('input', UI.updateFinancials);
UI.DOM.discount.addEventListener('input', UI.updateFinancials);
UI.DOM.partsContainer.addEventListener('click', (e) => { const btn = e.target.closest('button.manage-options-btn'); if (btn) { currentOptionType = btn.dataset.type; UI.openOptionsModal(currentOptionType, getOptionsFromStorage(currentOptionType)); } });
UI.DOM.existingFilesContainer.addEventListener('click', (e) => { if (e.target.classList.contains('remove-mockup-btn')) e.target.parentElement.remove(); });

const handleEditTransaction = (id) => {
    const t = getAllTransactions().find(t => t.id === id);
    if (!t) return;
    UI.DOM.transactionId.value = t.id; UI.DOM.transactionDate.value = t.date; UI.DOM.transactionDescription.value = t.description;
    UI.DOM.transactionAmount.value = t.amount; UI.DOM.transactionType.value = t.type; UI.DOM.transactionCategory.value = t.category || '';
    UI.updateSourceSelectionUI(t.source || 'banco');
    UI.DOM.transactionStatusContainer.classList.toggle('hidden', t.type !== 'income');
    if (t.type === 'income') (t.status === 'a_receber' ? UI.DOM.a_receber : UI.DOM.pago).checked = true;
    UI.DOM.transactionModalTitle.textContent = t.type === 'income' ? 'Editar Entrada' : 'Editar Despesa';
    UI.DOM.transactionModal.classList.remove('hidden');
};
UI.DOM.addIncomeBtn.addEventListener('click', () => { UI.DOM.transactionForm.reset(); UI.DOM.transactionId.value = ''; UI.DOM.transactionType.value = 'income'; UI.DOM.transactionModalTitle.textContent = 'Nova Entrada'; UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0]; UI.DOM.transactionStatusContainer.classList.remove('hidden'); UI.DOM.pago.checked = true; UI.updateSourceSelectionUI('banco'); UI.DOM.transactionModal.classList.remove('hidden'); });
UI.DOM.addExpenseBtn.addEventListener('click', () => { UI.DOM.transactionForm.reset(); UI.DOM.transactionId.value = ''; UI.DOM.transactionType.value = 'expense'; UI.DOM.transactionModalTitle.textContent = 'Nova Despesa'; UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0]; UI.DOM.transactionStatusContainer.classList.add('hidden'); UI.updateSourceSelectionUI('banco'); UI.DOM.transactionModal.classList.remove('hidden'); });
UI.DOM.transactionForm.addEventListener('submit', async (e) => { e.preventDefault(); const s = UI.DOM.transactionSourceContainer.querySelector('.source-selector.active'); if(!s){UI.showInfoModal("Selecione a Origem.");return;} const d={date:UI.DOM.transactionDate.value,description:UI.DOM.transactionDescription.value,amount:parseFloat(UI.DOM.transactionAmount.value),type:UI.DOM.transactionType.value,category:UI.DOM.transactionCategory.value.trim(),source:s.dataset.source,status:UI.DOM.transactionType.value==='income'?(UI.DOM.a_receber.checked?'a_receber':'pago'):'pago'}; if(!d.date||!d.description||isNaN(d.amount)||d.amount<=0){UI.showInfoModal("Preencha todos os campos.");return;} await saveTransaction(d, UI.DOM.transactionId.value); UI.DOM.transactionModal.classList.add('hidden'); });
UI.DOM.transactionsList.addEventListener('click', (e) => { const btn=e.target.closest('button'); if(!btn||!btn.dataset.id)return; const id=btn.dataset.id; if(btn.classList.contains('edit-transaction-btn'))handleEditTransaction(id); if(btn.classList.contains('delete-transaction-btn'))UI.showConfirmModal("Excluir este lançamento?","Excluir","Cancelar").then(ok=>ok&&deleteTransaction(id)); if(btn.classList.contains('mark-as-paid-btn'))markTransactionAsPaid(id); });
UI.DOM.periodFilter.addEventListener('change', () => { UI.DOM.customPeriodContainer.classList.toggle('hidden', UI.DOM.periodFilter.value!=='custom'); UI.renderFinanceDashboard(getAllTransactions(),userBankBalanceConfig); });
[UI.DOM.startDateInput, UI.DOM.endDateInput, UI.DOM.transactionSearchInput].forEach(el=>el.addEventListener('input',()=>UI.renderFinanceDashboard(getAllTransactions(),userBankBalanceConfig)));
UI.DOM.adjustBalanceBtn.addEventListener('click',()=>{UI.DOM.initialBalanceInput.value=(userBankBalanceConfig.initialBalance||0).toFixed(2);UI.DOM.initialBalanceModal.classList.remove('hidden');});
UI.DOM.saveBalanceBtn.addEventListener('click', async () => { const nB=parseFloat(UI.DOM.initialBalanceInput.value); await saveInitialBalance(nB); userBankBalanceConfig.initialBalance=nB; UI.renderFinanceDashboard(getAllTransactions(),userBankBalanceConfig); UI.DOM.initialBalanceModal.classList.add('hidden'); });

// Listeners de Modais
[UI.DOM.infoModalCloseBtn, UI.DOM.cancelTransactionBtn, UI.DOM.cancelBalanceBtn, UI.DOM.closeOptionsModalBtn].forEach(b=>b.addEventListener('click',()=>b.closest('.fixed').classList.add('hidden')));
UI.DOM.addOptionBtn.addEventListener('click', () => { const newOpt = UI.DOM.newOptionInput.value.trim(); if (newOpt && currentOptionType) { let opts = getOptionsFromStorage(currentOptionType); if (!opts.includes(newOpt)) { opts.push(newOpt); saveOptionsToStorage(currentOptionType, opts); UI.populateDatalists(getOptionsFromStorage('partTypes'), getOptionsFromStorage('materialTypes')); UI.openOptionsModal(currentOptionType, opts); UI.DOM.newOptionInput.value = ''; } } });
UI.DOM.optionsList.addEventListener('click', (e) => { if (e.target.classList.contains('delete-option-btn')) { let opts = getOptionsFromStorage(currentOptionType); opts.splice(e.target.dataset.index, 1); saveOptionsToStorage(currentOptionType, opts); UI.populateDatalists(getOptionsFromStorage('partTypes'), getOptionsFromStorage('materialTypes')); UI.openOptionsModal(currentOptionType, opts); } });

UI.DOM.priceTableBtn.addEventListener('click', () => { UI.renderPriceTable(getAllPricingItems(), 'view'); UI.DOM.priceTableModal.classList.remove('hidden'); });
UI.DOM.closePriceTableBtn.addEventListener('click', () => UI.DOM.priceTableModal.classList.add('hidden'));
UI.DOM.editPriceTableBtn.addEventListener('click', () => UI.renderPriceTable(getAllPricingItems(), 'edit'));
UI.DOM.cancelPriceTableBtn.addEventListener('click', () => UI.renderPriceTable(getAllPricingItems(), 'view'));
UI.DOM.addPriceItemBtn.addEventListener('click', () => { document.getElementById('priceTableBody').appendChild(UI.createPriceTableRow({ id: `new-${Date.now()}` }, 'edit')); });
UI.DOM.savePriceTableBtn.addEventListener('click', async () => { const items = Array.from(document.getElementById('priceTableBody').querySelectorAll('tr')).map(r => ({ id: r.dataset.id, name: r.querySelector('.price-item-name').value, description: r.querySelector('.price-item-desc').value, price: parseFloat(r.querySelector('.price-item-price').value) })).filter(i => i.name); await savePriceTableChanges(items); UI.renderPriceTable(getAllPricingItems(), 'view'); });
UI.DOM.priceTableContainer.addEventListener('click', (e) => { const btn = e.target.closest('.delete-price-item-btn'); if(btn) { const row = btn.closest('tr'); if (!row.dataset.id.startsWith('new-')) { UI.showConfirmModal("Excluir este item?", "Excluir", "Cancelar").then(ok => ok && deletePriceItem(row.dataset.id)); } else { row.remove(); } } });
UI.DOM.transactionSourceContainer.addEventListener('click', (e) => { const t = e.target.closest('.source-selector'); if(t) UI.updateSourceSelectionUI(t.dataset.source); });
