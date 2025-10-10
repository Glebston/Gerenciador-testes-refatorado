import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDocs, collection, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { DOM, showInfoModal, handleCookieConsent, updateNavButton, showForgotPasswordModal, showConfirmModal } from './ui.js';
import { initializeOrderService, resetAndShowOrderForm, saveOrder, editOrder, replicateOrder, deleteOrder, toggleOrdersView, viewOrder, generateComprehensivePdf, generateReceiptPdf, getOrders } from './services/orderService.js';
import { initializeFinanceService, openTransactionModal, saveTransaction, editTransaction, deleteTransaction, markTransactionAsPaid, renderFinanceDashboard, openInitialBalanceModal, handleSaveInitialBalance, copyTransactionsToClipboard, getTransactions } from './services/financeService.js';
import { initializePricingService, openPriceTable, renderPriceTable, addPriceItem, deletePriceItem, savePriceTable } from './services/pricingService.js';
import { resetIdleTimer } from './utils.js';

// --- Variáveis Globais (movidas aqui para o main) ---
let userCompanyId = null;
let userCompanyName = null;
let userBankBalanceConfig = { initialBalance: 0 };
let currentDashboardView = 'orders'; // 'orders' ou 'finance'

// --- Funções de Suporte (Datalists e Opções) ---

const defaultOptions = {
    partTypes: ['Gola redonda manga curta', 'Gola redonda manga longa', 'Gola redonda manga longa com capuz', 'Gola redonda manga curta (sublimada na frente)', 'Gola polo manga curta', 'Gola polo manga longa', 'Gola V manga curta', 'Gola V manga longa', 'Short', 'Calça'],
    materialTypes: ['Malha fria', 'Drifity', 'Cacharrel', 'PP', 'Algodão Fio 30', 'TNT drive', 'Piquê', 'Brim']
};
let currentOptionType = '';

function getOptionsFromStorage(type) {
    const stored = localStorage.getItem(`${userCompanyId}_${type}`);
    return stored ? JSON.parse(stored) : defaultOptions[type];
}

function saveOptionsToStorage(type, options) {
    localStorage.setItem(`${userCompanyId}_${type}`, JSON.stringify(options));
}

function populateDatalists() {
    const partTypes = getOptionsFromStorage('partTypes');
    const materialTypes = getOptionsFromStorage('materialTypes');
    DOM.partTypeList.innerHTML = partTypes.map(opt => `<option value="${opt}"></option>`).join('');
    DOM.partMaterialList.innerHTML = materialTypes.map(opt => `<option value="${opt}"></option>`).join('');
}

function initializeAndPopulateDatalists() {
    if (!localStorage.getItem(`${userCompanyId}_partTypes`)) saveOptionsToStorage('partTypes', defaultOptions.partTypes);
    if (!localStorage.getItem(`${userCompanyId}_materialTypes`)) saveOptionsToStorage('materialTypes', defaultOptions.materialTypes);
    populateDatalists();
}

function openOptionsModal(type) {
    currentOptionType = type;
    const title = type === 'partTypes' ? 'Tipos de Peça' : 'Tipos de Material';
    const options = getOptionsFromStorage(type);
    DOM.optionsModalTitle.textContent = `Gerenciar ${title}`;
    DOM.optionsList.innerHTML = options.map((opt, index) =>
        `<div class="flex justify-between items-center p-2 bg-gray-100 rounded-md">
            <span>${opt}</span>
            <button class="delete-option-btn text-red-500 hover:text-red-700 font-bold" data-index="${index}">&times;</button>
        </div>`
    ).join('');
    DOM.optionsModal.classList.remove('hidden');
}

function addOption() {
    const newOption = DOM.newOptionInput.value.trim();
    if (newOption && currentOptionType) {
        let options = getOptionsFromStorage(currentOptionType);
        if (!options.includes(newOption)) {
            options.push(newOption);
            saveOptionsToStorage(currentOptionType, options);
            populateDatalists();
            openOptionsModal(currentOptionType);
            DOM.newOptionInput.value = '';
        }
    }
}

function deleteOption(index) {
    if (currentOptionType) {
        let options = getOptionsFromStorage(currentOptionType);
        options.splice(index, 1);
        saveOptionsToStorage(currentOptionType, options);
        populateDatalists();
        openOptionsModal(currentOptionType);
    }
}

// --- Lógica de Backup (Movida aqui para o main para ter acesso a todos os dados) ---

async function handleBackup() {
    const orders = getOrders(); // Pega os pedidos do orderService
    const transactions = getTransactions(); // Pega as transações do financeService

    if (orders.length === 0 && transactions.length === 0) {
        showInfoModal("Não há dados para fazer backup.");
        return;
    }
    
    const backupData = {
        orders: orders.map(({ id, ...rest }) => rest), // Remove IDs do Firestore
        transactions: transactions.map(({ id, ...rest }) => rest) // Remove IDs do Firestore
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
    
    localStorage.setItem(`lastAutoBackupTimestamp_${userCompanyId}`, Date.now());
    showInfoModal("Backup completo gerado com sucesso!");
    DOM.backupReminderBanner.classList.add('hidden'); // Esconde o banner após o backup manual ou auto
}

async function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const dataFromFile = JSON.parse(e.target.result);
            let ordersToRestore = [];
            let transactionsToRestore = [];

            if (Array.isArray(dataFromFile)) { // Formato antigo: apenas pedidos
                ordersToRestore = dataFromFile;
                showInfoModal("Backup de formato antigo detectado. Apenas os pedidos serão restaurados.");
            } else if (typeof dataFromFile === 'object' && (dataFromFile.orders || dataFromFile.transactions)) {
                ordersToRestore = dataFromFile.orders || [];
                transactionsToRestore = dataFromFile.transactions || [];
            } else {
                throw new Error("Formato de arquivo de backup inválido.");
            }
            
            if (!Array.isArray(ordersToRestore) || !Array.isArray(transactionsToRestore)) {
                throw new Error("Dados de backup corrompidos.");
            }

            await processRestore(ordersToRestore, transactionsToRestore);
        } catch (error) {
            console.error("Erro na restauração:", error);
            showInfoModal("Arquivo de backup inválido ou corrompido.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Limpa o input de arquivo
}

async function processRestore(ordersToRestore, transactionsToRestore) {
    const choice = await showConfirmModal("Escolha o modo de importação:", "Adicionar aos existentes", "Substituir tudo");
    if (choice === null) return; // Usuário cancelou

    if (choice) { // Adicionar aos existentes
        const ordersCollectionRef = collection(db, `companies/${userCompanyId}/orders`);
        const transactionsCollectionRef = collection(db, `companies/${userCompanyId}/transactions`);
        
        const batch = db.batch(); // Cria um batch para operações atômicas
        ordersToRestore.forEach(order => {
            const newDocRef = doc(ordersCollectionRef);
            batch.set(newDocRef, order);
        });
        transactionsToRestore.forEach(transaction => {
            const newDocRef = doc(transactionsCollectionRef);
            batch.set(newDocRef, transaction);
        });
        await batch.commit();
        showInfoModal(`${ordersToRestore.length} pedido(s) e ${transactionsToRestore.length} lançamento(s) foram ADICIONADOS.`);
    } else { // Substituir tudo
        const confirmReplace = await showConfirmModal(
            "ATENÇÃO: Isto vai APAGAR TODOS os seus pedidos E lançamentos financeiros atuais. A ação NÃO PODE SER DESFEITA. Continuar?",
            "Sim, substituir tudo",
            "Cancelar"
        );
        if (confirmReplace) {
            const ordersCollectionRef = collection(db, `companies/${userCompanyId}/orders`);
            const transactionsCollectionRef = collection(db, `companies/${userCompanyId}/transactions`);

            const deleteBatch = db.batch();
            const [ordersSnap, transactionsSnap] = await Promise.all([
                getDocs(query(ordersCollectionRef)),
                getDocs(query(transactionsCollectionRef))
            ]);

            ordersSnap.forEach(docSnap => deleteBatch.delete(docSnap.ref));
            transactionsSnap.forEach(docSnap => deleteBatch.delete(docSnap.ref));
            
            if(ordersSnap.size > 0 || transactionsSnap.size > 0) {
                await deleteBatch.commit();
            }

            const addBatch = db.batch();
            ordersToRestore.forEach(order => {
                const newDocRef = doc(ordersCollectionRef);
                addBatch.set(newDocRef, order);
            });
            transactionsToRestore.forEach(transaction => {
                const newDocRef = doc(transactionsCollectionRef);
                addBatch.set(newDocRef, transaction);
            });

            if (ordersToRestore.length > 0 || transactionsToRestore.length > 0) {
                await addBatch.commit();
            }
            
            showInfoModal(`Dados substituídos. ${ordersToRestore.length} pedido(s) e ${transactionsToRestore.length} lançamento(s) importados.`);
        }
    }
}

function checkBackupReminder() {
    const storageKey = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackupTimestamp = localStorage.getItem(storageKey);
    if (!lastBackupTimestamp) {
        return;
    }

    const now = Date.now();
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    
    if ((now - parseInt(lastBackupTimestamp)) > sevenDaysInMillis) {
        DOM.backupReminderBanner.classList.remove('hidden');
    }
}

function triggerAutoBackupIfNeeded() {
    const storageKey = `lastAutoBackupTimestamp_${userCompanyId}`;
    const lastBackupTimestamp = localStorage.getItem(storageKey);
    // Só dispara se for o primeiro login após 7 dias do último backup.
    // O backup manual também atualiza essa timestamp, então a lógica é simplificada.
    if (!lastBackupTimestamp) {
        // Se nunca houve backup, não dispara o auto.
        return; 
    }

    const now = Date.now();
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
            
    if ((now - parseInt(lastBackupTimestamp)) > sevenDaysInMillis) {
        // Mostra o modal de informação que o backup semi-automático está sendo feito.
        showInfoModal("Backup semi-automático iniciado. Seu último backup foi há mais de 7 dias.");
        handleBackup(); // Executa o backup
    }
}


// --- Lógica de Inicialização Principal ---

async function initializeAppLogic(user) {
    userCompanyId = user.uid; // Inicializa com UID, será substituído pelo companyId
    
    // Busca o mapeamento de usuário para companyId
    const userMappingRef = doc(db, "user_mappings", user.uid);
    const userMappingSnap = await getDoc(userMappingRef);
    
    if (userMappingSnap.exists()) {
        userCompanyId = userMappingSnap.data().companyId;
        
        // Busca os dados da empresa para nome e config de saldo
        const companyRef = doc(db, "companies", userCompanyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
            const companyData = companySnap.data();
            userCompanyName = companyData.companyName || user.email;
            userBankBalanceConfig = companyData.bankBalanceConfig || { initialBalance: 0 };
        } else {
            userCompanyName = user.email; // Fallback se companyId existir mas documento da empresa não
            userBankBalanceConfig = { initialBalance: 0 };
        }
        DOM.userEmail.textContent = userCompanyName;
        
        // Inicializa os serviços com o companyId correto
        initializeOrderService(userCompanyId, userCompanyName);
        initializeFinanceService(userCompanyId, userBankBalanceConfig);
        initializePricingService(userCompanyId);
        
        resetIdleTimer();
        initializeAndPopulateDatalists();
        checkBackupReminder();
        triggerAutoBackupIfNeeded();
        updateNavButton(currentDashboardView); // Define o estado inicial do botão de navegação

        DOM.authContainer.classList.add('hidden');
        DOM.app.classList.remove('hidden');

    } else {
        showInfoModal("Erro: Usuário não associado a nenhuma empresa. Fale com o suporte.");
        // Força logout se não houver companyId
        await auth.signOut(); // Usa await para garantir que o logout ocorra antes de renderizar auth
        DOM.authContainer.classList.remove('hidden');
        DOM.app.classList.add('hidden');
    }
}

// --- Event Listeners Globais ---
// Os listeners são movidos para o main.js porque ele é o ponto de entrada e o único que 'enxerga' todos os módulos.
// Eles chamam as funções apropriadas nos respectivos módulos.

window.addEventListener('load', () => {
    // Listener de autenticação do Firebase (permanece aqui para controlar a visibilidade da app)
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await initializeAppLogic(user);
        } else {
            // Limpa o estado da UI ao deslogar
            DOM.app.classList.add('hidden');
            DOM.authContainer.classList.remove('hidden');
            userCompanyId = null;
            userCompanyName = null;
            userBankBalanceConfig = { initialBalance: 0 };
            currentDashboardView = 'orders'; // Reseta a visão para a tela de pedidos
            updateNavButton(currentDashboardView);
            // Garante que o dropdown do usuário esteja fechado ao deslogar
            DOM.userDropdown.classList.add('hidden');
        }
        handleCookieConsent();
    });
});

DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.loginEmail.value;
    const password = DOM.loginPassword.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showInfoModal("E-mail ou senha incorretos.");
        console.error("Falha no login:", error.code);
    }
});

DOM.forgotPasswordBtn.addEventListener('click', async () => {
    const email = await showForgotPasswordModal();
    if (!email) { return; }
    try {
        await sendPasswordResetEmail(auth, email);
        showInfoModal("Se uma conta existir para este e-mail, um link para redefinição de senha foi enviado.");
    } catch (error) {
        console.error("Erro na tentativa de redefinição de senha (silenciado para o usuário):", error.code);
        showInfoModal("Se uma conta existir para este e-mail, um link para redefinição de senha foi enviado.");
    }
});

DOM.infoModalCloseBtn.addEventListener('click', () => DOM.infoModal.classList.add('hidden'));
DOM.logoutBtn.addEventListener('click', () => auth.signOut()); // Usa diretamente signOut aqui
DOM.requestDeletionBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmModal(
        "Isto registrará uma solicitação de exclusão de conta. Para formalizar o pedido, você precisará enviar um e-mail ao administrador. Deseja continuar?",
        "Sim, continuar",
        "Cancelar"
    );
    if (confirmed) {
        const adminEmail = "paglucrobr@gmail.com";
        const userEmail = auth.currentUser ? auth.currentUser.email : "[seu e-mail]";
        showInfoModal(`Para concluir, por favor, envie um e-mail de ${userEmail} para ${adminEmail} solicitando a remoção da sua conta. O administrador processará seu pedido.`);
    }
});
DOM.backupBtn.addEventListener('click', handleBackup);
DOM.restoreFileInput.addEventListener('change', handleRestore);

// Pedidos
DOM.addOrderBtn.addEventListener('click', resetAndShowOrderForm);
DOM.cancelBtn.addEventListener('click', () => DOM.orderModal.classList.add('hidden'));
DOM.addPartBtn.addEventListener('click', () => addPart());
DOM.orderForm.addEventListener('submit', saveOrder);
DOM.downPayment.addEventListener('input', () => {}); // Listener interno em orderService
DOM.discount.addEventListener('input', () => {}); // Listener interno em orderService

DOM.ordersList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('edit-btn')) editOrder(id);
    if (btn.classList.contains('replicate-btn')) replicateOrder(id);
    if (btn.classList.contains('delete-btn')) deleteOrder(id);
    if (btn.classList.contains('view-btn')) viewOrder(id);
});

DOM.toggleViewBtn.addEventListener('click', toggleOrdersView);

DOM.viewModal.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'closeViewBtn') {
        DOM.viewModal.classList.add('hidden');
        DOM.viewModal.innerHTML = '';
    }
    if (btn.id === 'comprehensivePdfBtn') {
        generateComprehensivePdf(btn.dataset.id, btn.dataset.name);
    }
});

// Switch entre Dashboards
DOM.financeDashboardBtn.addEventListener('click', () => {
    currentDashboardView = currentDashboardView === 'orders' ? 'finance' : 'orders';
    const isOrders = currentDashboardView === 'orders';
    
    DOM.ordersDashboard.classList.toggle('hidden', !isOrders);
    DOM.financeDashboard.classList.toggle('hidden', isOrders);
    
    updateNavButton(currentDashboardView);
    
    if (!isOrders) renderFinanceDashboard();
});

// Dropdown do Usuário
DOM.userMenuBtn.addEventListener('click', () => DOM.userDropdown.classList.toggle('hidden'));
document.addEventListener('click', (e) => {
    if (DOM.userMenuBtn && !DOM.userMenuBtn.parentElement.contains(e.target) && !DOM.userDropdown.classList.contains('hidden')) {
        DOM.userDropdown.classList.add('hidden');
    }
});

// Transações Financeiras
DOM.addIncomeBtn.addEventListener('click', () => openTransactionModal('income'));
DOM.addExpenseBtn.addEventListener('click', () => openTransactionModal('expense'));
DOM.cancelTransactionBtn.addEventListener('click', () => DOM.transactionModal.classList.add('hidden'));
DOM.transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTransaction();
});
DOM.periodFilter.addEventListener('change', renderFinanceDashboard);
DOM.startDateInput.addEventListener('change', renderFinanceDashboard);
DOM.endDateInput.addEventListener('change', renderFinanceDashboard);
DOM.copyReportBtn.addEventListener('click', copyTransactionsToClipboard);

DOM.transactionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('edit-transaction-btn')) { editTransaction(id); }
    if (btn.classList.contains('delete-transaction-btn')) { deleteTransaction(id); }
    if (btn.classList.contains('mark-as-paid-btn')) { markTransactionAsPaid(id); }
});

// Modais de Opções (Datalists)
window.addEventListener('openoptions', (e) => openOptionsModal(e.detail.type)); // Custom event para abrir modal de opções
DOM.addOptionBtn.addEventListener('click', addOption);
DOM.closeOptionsModalBtn.addEventListener('click', () => DOM.optionsModal.classList.add('hidden'));
DOM.optionsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-option-btn')) {
        deleteOption(e.target.dataset.index);
    }
});

// Backup Reminder
DOM.backupNowBtn.addEventListener('click', handleBackup); // Reusa handleBackup
DOM.dismissBackupReminderBtn.addEventListener('click', () => DOM.backupReminderBanner.classList.add('hidden'));

document.getElementById('existingFilesContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-mockup-btn')) {
        e.target.parentElement.remove();
    }
});

DOM.transactionSearchInput.addEventListener('input', renderFinanceDashboard);

// Tabela de Preços
DOM.priceTableBtn.addEventListener('click', openPriceTable);
DOM.closePriceTableBtn.addEventListener('click', () => DOM.priceTableModal.classList.add('hidden'));
DOM.editPriceTableBtn.addEventListener('click', () => renderPriceTable('edit'));
DOM.cancelPriceTableBtn.addEventListener('click', () => renderPriceTable('view'));
DOM.savePriceTableBtn.addEventListener('click', savePriceTable);
DOM.addPriceItemBtn.addEventListener('click', addPriceItem);
DOM.priceTableContainer.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-price-item-btn');
    if (deleteBtn) {
        const row = deleteBtn.closest('tr');
        const id = row.dataset.id;
        deletePriceItem(id); // Chama a função do pricingService
    }
});

// Seleção de Origem da Transação
DOM.transactionSourceContainer.addEventListener('click', (e) => {
    const target = e.target.closest('.source-selector');
    if (!target) return;
    // Isso é tratado diretamente na UI, mas se houver uma necessidade de notificar o financeService no futuro, este é o local.
});

// Saldo Inicial
DOM.adjustBalanceBtn.addEventListener('click', openInitialBalanceModal);
DOM.saveBalanceBtn.addEventListener('click', handleSaveInitialBalance);
DOM.cancelBalanceBtn.addEventListener('click', () => DOM.initialBalanceModal.classList.add('hidden'));

// Consentimento de Cookies
DOM.cookieAcceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'true');
    DOM.cookieBanner.classList.add('hidden');
});

// Atalhos de Teclado
window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (!DOM.confirmModal.classList.contains('hidden')) {
            event.preventDefault();
            DOM.confirmOkBtn.click();
        } else if (!DOM.initialBalanceModal.classList.contains('hidden')) {
            event.preventDefault();
            DOM.saveBalanceBtn.click();
        } else if (!DOM.forgotPasswordModal.classList.contains('hidden')) {
            event.preventDefault();
            DOM.sendResetEmailBtn.click();
        } else if (!DOM.infoModal.classList.contains('hidden')) {
            event.preventDefault();
            DOM.infoModalCloseBtn.click();
        }
    }

    if (event.key === 'Escape') {
        if (!DOM.confirmModal.classList.contains('hidden')) {
            DOM.confirmCancelBtn.click();
        } else if (!DOM.initialBalanceModal.classList.contains('hidden')) {
            DOM.cancelBalanceBtn.click();
        } else if (!DOM.forgotPasswordModal.classList.contains('hidden')) {
            DOM.cancelResetBtn.click();
        } else if (!DOM.viewModal.classList.contains('hidden')) {
            document.getElementById('closeViewBtn')?.click();
        } else if (!DOM.orderModal.classList.contains('hidden')) {
            DOM.cancelBtn.click();
        } else if (!DOM.priceTableModal.classList.contains('hidden')) {
            if (!DOM.cancelPriceTableBtn.classList.contains('hidden')) {
                DOM.cancelPriceTableBtn.click();
            } else {
                DOM.closePriceTableBtn.click();
            }
        } else if (!DOM.transactionModal.classList.contains('hidden')) {
            DOM.cancelTransactionBtn.click();
        } else if (!DOM.optionsModal.classList.contains('hidden')) {
            DOM.closeOptionsModalBtn.click();
        } else if (!DOM.infoModal.classList.contains('hidden')) {
            DOM.infoModalCloseBtn.click();
        }
    }
});

// Listener de Atividade do Usuário para Reiniciar o Timer de Inatividade
['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));