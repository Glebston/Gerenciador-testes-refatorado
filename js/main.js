// js/main.js
// ========================================================
// PARTE 1: INICIALIZAÇÃO DINÂMICA (v5.7.19 - SELF-HEALING DATES)
// ========================================================

async function main() {
    
    const cacheBuster = `?v=${new Date().getTime()}`;

    try {
        // ========================================================
        // PARTE 1.A: IMPORTAÇÕES DINÂMICAS DE MÓCULOS
        // ========================================================

        const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
        const { doc, getDoc, writeBatch, collection } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        const { db, auth } = await import(`./firebaseConfig.js${cacheBuster}`);
        const { handleLogout } = await import(`./auth.js${cacheBuster}`);

        const { 
            initializeOrderService, 
            saveOrder, 
            deleteOrder, 
            getOrderById, 
            getAllOrders, 
            cleanupOrderService,
            calculateTotalPendingRevenue,   
            updateOrderDiscountFromFinance  
        } = await import(`./services/orderService.js${cacheBuster}`);
        
        const { 
            initializeFinanceService, 
            saveTransaction, 
            deleteTransaction, 
            markTransactionAsPaid, 
            saveInitialBalance, 
            getAllTransactions, 
            cleanupFinanceService, 
            getTransactionByOrderId,
            deleteAllTransactionsByOrderId,
            getTransactionById              
        } = await import(`./services/financeService.js${cacheBuster}`);
        
        const { initializePricingService, savePriceTableChanges, deletePriceItem, getAllPricingItems, cleanupPricingService } = await import(`./services/pricingService.js${cacheBuster}`);
        const { initializeIdleTimer } = await import(`./utils.js${cacheBuster}`);
        const UI = await import(`./ui.js${cacheBuster}`);

        const { initializeAuthListeners } = await import(`./listeners/authListeners.js${cacheBuster}`);
        const { initializeNavigationListeners } = await import(`./listeners/navigationListeners.js${cacheBuster}`);
        const { initializeOrderListeners } = await import(`./listeners/orderListeners.js${cacheBuster}`);
        const { initializeFinanceListeners } = await import(`./listeners/financeListeners.js${cacheBuster}`);
        const { initializeModalAndPricingListeners } = await import(`./listeners/modalAndPricingListeners.js${cacheBuster}`);


        // ========================================================
        // PARTE 2: ESTADO GLOBAL E CONFIGURAÇÕES DA APLICAÇÃO
        // ========================================================

        let userCompanyId = null;
        let userCompanyName = null;
        let userBankBalanceConfig = { initialBalance: 0 };

        let currentDashboardView = 'orders';
        let currentOrdersView = 'pending';
        let partCounter = 0;
        let currentOptionType = ''; 

        const defaultOptions = {
            partTypes: ['Gola redonda manga curta', 'Gola redonda manga longa', 'Gola redonda manga longa com capuz', 'Gola redonda manga curta (sublimada na frente)', 'Gola polo manga curta', 'Gola polo manga longa', 'Gola V manga curta', 'Gola V manga longa', 'Short', 'Calça'],
            materialTypes: ['Malha fria', 'Drifity', 'Cacharrel', 'PP', 'Algodão Fio 30', 'TNT drive', 'Piquê', 'Brim']
        };


        // ========================================================
        // PARTE 3: LÓGICA DE INICIALIZAÇÃO E AUTENTICAÇÃO
        // ========================================================
        
        const initializeAppLogic = async (user) => {
            console.log("🚀 [MAIN] Iniciando lógica da aplicação...");
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
                
                // --- FORCE SYNC VISUAL ---
                if (UI.DOM.periodFilter) {
                    UI.DOM.periodFilter.value = 'thisMonth';
                }

                // --- INICIALIZAÇÃO REATIVA ---
                console.log("🔌 [MAIN] Conectando serviços...");
                initializeOrderService(userCompanyId, handleOrderChange, () => currentOrdersView);
                initializeFinanceService(userCompanyId, handleFinanceChange, () => userBankBalanceConfig);
                initializePricingService(userCompanyId, handlePricingChange); 
                
                // --- RENDERIZAÇÃO INICIAL (HARDCODED "THIS MONTH") ---
                const now = new Date();
                const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                const pendingRevenue = calculateTotalPendingRevenue ? calculateTotalPendingRevenue(startOfThisMonth, endOfThisMonth) : 0;
                console.log(`🎨 [MAIN] Render inicial (Hardcoded Dates). Pendente: R$ ${pendingRevenue}`);
                
                UI.renderOrders(getAllOrders(), currentOrdersView);
                UI.renderFinanceDashboard(getAllTransactions(), userBankBalanceConfig, pendingRevenue);
                
                initializeIdleTimer(UI.DOM, handleLogout);
                initializeAndPopulateDatalists(); 
                UI.updateNavButton(currentDashboardView);
                
                setTimeout(() => {
                    UI.DOM.authContainer.classList.add('hidden'); 
                    UI.DOM.app.classList.remove('hidden');
                    
                    // --- SAFETY REFRESH (500ms) ---
                    setTimeout(() => {
                        console.log("⏰ [MAIN] Safety Refresh (500ms)...");
                        // Garante sincronia visual
                        if (UI.DOM.periodFilter && !UI.DOM.periodFilter.value) UI.DOM.periodFilter.value = 'thisMonth';
                        
                        if (calculateTotalPendingRevenue) {
                            // Usa o helper que agora tem Autocorreção
                            const dates = getCurrentDashboardDates(); 
                            const freshPending = calculateTotalPendingRevenue(dates.startDate, dates.endDate);
                            
                            console.log(`💰 [MAIN] Pendente Pós-Refresh: R$ ${freshPending} (Usando: ${dates.startDate?.toLocaleDateString()} - ${dates.endDate?.toLocaleDateString()})`);
                            
                            UI.renderFinanceKPIs(getAllTransactions(), userBankBalanceConfig, freshPending);
                        }
                    }, 500); 

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            checkBackupReminder();
                        });
                    });
                }, 0);

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
        // PARTE 4: HANDLERS DE MUDANÇA (LÓGICA REATIVA)
        // ========================================================

        /**
         * Helper Robusto com AUTOCORREÇÃO (SELF-HEALING)
         * Se as datas falharem ou o filtro estiver ambíguo, força "Este Mês".
         */
        const getCurrentDashboardDates = () => {
            const now = new Date();
            const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            if (!UI.DOM.periodFilter) return { startDate: defaultStart, endDate: defaultEnd };
            
            let filter = UI.DOM.periodFilter.value;
            if (!filter) filter = 'thisMonth'; 

            let startDate = null, endDate = null;

            if (filter === 'custom') {
                if (UI.DOM.startDateInput.value) startDate = new Date(UI.DOM.startDateInput.value + 'T00:00:00');
                if (UI.DOM.endDateInput.value) endDate = new Date(UI.DOM.endDateInput.value + 'T23:59:59');
                
                // AUTOCORREÇÃO: Se o filtro é Custom mas as datas estão vazias,
                // assume "Este Mês" para não zerar o dashboard por acidente.
                if (!startDate || !endDate) {
                    console.warn("⚠️ [MAIN] Filtro Custom sem datas. Forçando 'Este Mês'.");
                    startDate = defaultStart;
                    endDate = defaultEnd;
                }
            } else {
                const startOfThisMonth = defaultStart;
                const endOfThisMonth = defaultEnd;
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                const startOfThisYear = new Date(now.getFullYear(), 0, 1);
                const endOfThisYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

                switch(filter) {
                    case 'thisMonth': startDate = startOfThisMonth; endDate = endOfThisMonth; break;
                    case 'lastMonth': startDate = startOfLastMonth; endDate = endOfLastMonth; break;
                    case 'thisYear': startDate = startOfThisYear; endDate = endOfThisYear; break;
                }
            }
            
            // Última linha de defesa
            if (!startDate || !endDate) {
                startDate = defaultStart;
                endDate = defaultEnd;
            }

            return { startDate, endDate };
        };

        const handleOrderChange = (type, order, viewType) => {
            const isDelivered = order.orderStatus === 'Entregue';

            if (viewType === 'pending') {
                if (isDelivered) {
                    UI.removeOrderCard(order.id);
                } else {
                    switch (type) {
                        case 'added': UI.addOrderCard(order, viewType); break;
                        case 'modified': UI.updateOrderCard(order, viewType); break;
                        case 'removed': UI.removeOrderCard(order.id); break;
                    }
                }
            } 
            else if (viewType === 'delivered') {
                if (!isDelivered) {
                    UI.removeOrderCard(order.id);
                } else {
                    switch (type) {
                        case 'added': UI.addOrderCard(order, viewType); break;
                        case 'modified': UI.updateOrderCard(order, viewType); break;
                        case 'removed': UI.removeOrderCard(order.id); break;
                    }
                }
            }

            // ATUALIZAÇÃO DOS KPIS FINANCEIROS
            if (calculateTotalPendingRevenue) {
                const { startDate, endDate } = getCurrentDashboardDates();
                
                // Debug para garantir que as datas não estão nulas
                // console.log(`🔄 [HANDLER] Datas usadas: ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`);
                
                const pendingRevenue = calculateTotalPendingRevenue(startDate, endDate);
                UI.renderFinanceKPIs(getAllTransactions ? getAllTransactions() : [], userBankBalanceConfig, pendingRevenue);
            }
        };

        const handleFinanceChange = (type, transaction, config) => {
            const { startDate, endDate } = getCurrentDashboardDates();

            const pendingRevenue = calculateTotalPendingRevenue ? calculateTotalPendingRevenue(startDate, endDate) : 0;
            UI.renderFinanceKPIs(getAllTransactions(), config, pendingRevenue);
            
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            let passesDateFilter = true;
            
            if (startDate && endDate) passesDateFilter = transactionDate >= startDate && transactionDate <= endDate;
            else if(startDate && !endDate) passesDateFilter = transactionDate >= startDate;
            else if(!startDate && endDate) passesDateFilter = transactionDate <= endDate;

            const searchTerm = UI.DOM.transactionSearchInput.value.toLowerCase();
            const passesSearchFilter = transaction.description.toLowerCase().includes(searchTerm);

            if (!passesDateFilter || !passesSearchFilter) {
                if (type === 'modified' || type === 'removed') {
                    UI.removeTransactionRow(transaction.id);
                }
                return; 
            }

            switch (type) {
                case 'added': UI.addTransactionRow(transaction); break;
                case 'modified': UI.updateTransactionRow(transaction); break;
                case 'removed': UI.removeTransactionRow(transaction.id); break;
            }
        };

        const handlePricingChange = (type, item) => {
            const isEditMode = !UI.DOM.editPriceTableBtn.classList.contains('hidden');
            const mode = isEditMode ? 'view' : 'edit';
            switch (type) {
                case 'added': UI.addPriceTableRow(item, mode); break;
                case 'modified': UI.updatePriceTableRow(item, mode); break;
                case 'removed': UI.removePriceTableRow(item.id); break;
            }
        };

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
            reader.readText(file);
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
            const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

            let needsReminder = false;
            
            if (!lastBackup) {
                needsReminder = true;
            } else {
                if ((Date.now() - parseInt(lastBackup)) > sevenDaysInMillis) {
                    needsReminder = true;
                }
            }

            if (needsReminder) {
                const banner = UI.DOM.backupReminderBanner;
                banner.classList.remove('hidden');
                banner.classList.remove('toast-enter');
                void banner.offsetWidth;
                banner.classList.add('toast-enter');
            }
        };

        initializeAuthListeners(UI);

        initializeNavigationListeners(UI, {
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

        initializeOrderListeners(UI, {
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

        initializeFinanceListeners(UI, {
            services: {
                saveTransaction,
                deleteTransaction,
                markTransactionAsPaid,
                getAllTransactions,
                saveInitialBalance,
                getTransactionById,              
                calculateTotalPendingRevenue,    
                updateOrderDiscountFromFinance   
            },
            getConfig: () => userBankBalanceConfig,
            setConfig: (newState) => {
                if (newState.initialBalance !== undefined) {
                    userBankBalanceConfig.initialBalance = newState.initialBalance;
                }
            }
        });

        initializeModalAndPricingListeners(UI, {
            services: {
                getAllPricingItems,
                savePriceTableChanges, 
                deletePriceItem
            },
            helpers: {
                getOptionsFromStorage,
                saveOptionsToStorage
            },
            getState: () => ({ currentOptionType })
        });

    } catch (error) {
        console.error("Falha crítica ao inicializar o PagLucro Gestor:", error);
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; font-family: sans-serif;">
                <h1 style="color: #D90000;">Erro Crítico de Inicialização</h1>
                <p>Não foi possível carregar os componentes da aplicação.</p>
                <p>Isso pode ser um problema de conexão ou um cache corrompido.</p>
                <p>Por favor, tente <strong>limpar o cache do seu navegador (Ctrl+Shift+R ou Cmd+Shift+R)</strong> e recarregar a página.</p>
                <p style="margin-top: 20px; font-size: 0.8em; color: #666;">Detalhe do erro: ${error.message}</p>
            </div>
        `;
    }
}
main();
