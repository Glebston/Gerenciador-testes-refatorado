// js/listeners/financeListeners.js

function handleEditTransaction(UI, id, getTransactions) {
    const transaction = getTransactions().find(t => t.id === id);
    if (!transaction) return;
    
    UI.DOM.transactionId.value = transaction.id; 
    UI.DOM.transactionDate.value = transaction.date; 
    UI.DOM.transactionDescription.value = transaction.description;
    UI.DOM.transactionAmount.value = transaction.amount; 
    UI.DOM.transactionType.value = transaction.type; 
    UI.DOM.transactionCategory.value = transaction.category || '';
    
    UI.updateSourceSelectionUI(UI.DOM.transactionSourceContainer, transaction.source || 'banco');
    
    const isIncome = transaction.type === 'income';
    UI.DOM.transactionStatusContainer.classList.toggle('hidden', !isIncome);
    if (isIncome) {
        (transaction.status === 'a_receber' ? UI.DOM.a_receber : UI.DOM.pago).checked = true;
    }
    
    UI.DOM.transactionModalTitle.textContent = isIncome ? 'Editar Entrada' : 'Editar Despesa';
    UI.showTransactionModal();
}

export function initializeFinanceListeners(UI, deps) {
    const { services, getConfig, setConfig } = deps;

    UI.DOM.addIncomeBtn.addEventListener('click', () => { 
        UI.DOM.transactionForm.reset(); 
        UI.DOM.transactionId.value = ''; 
        UI.DOM.transactionType.value = 'income'; 
        UI.DOM.transactionModalTitle.textContent = 'Nova Entrada'; 
        UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0]; 
        UI.DOM.transactionStatusContainer.classList.remove('hidden'); 
        UI.DOM.pago.checked = true; 
        UI.updateSourceSelectionUI(UI.DOM.transactionSourceContainer, 'banco'); 
        UI.showTransactionModal();
    });

    UI.DOM.addExpenseBtn.addEventListener('click', () => { 
        UI.DOM.transactionForm.reset(); 
        UI.DOM.transactionId.value = ''; 
        UI.DOM.transactionType.value = 'expense'; 
        UI.DOM.transactionModalTitle.textContent = 'Nova Despesa'; 
        UI.DOM.transactionDate.value = new Date().toISOString().split('T')[0]; 
        UI.DOM.transactionStatusContainer.classList.add('hidden'); 
        UI.updateSourceSelectionUI(UI.DOM.transactionSourceContainer, 'banco'); 
        UI.showTransactionModal();
    });

    UI.DOM.transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("[DEBUG FinanceListener] Submit acionado.");

        const selectedSourceEl = UI.DOM.transactionSourceContainer.querySelector('.source-selector.active');
        if (!selectedSourceEl) {
            UI.showInfoModal("Por favor, selecione a Origem (Banco ou Caixa).");
            return;
        }
        const data = {
            date: UI.DOM.transactionDate.value,
            description: UI.DOM.transactionDescription.value,
            amount: parseFloat(UI.DOM.transactionAmount.value),
            type: UI.DOM.transactionType.value,
            category: UI.DOM.transactionCategory.value.trim(),
            source: selectedSourceEl.dataset.source,
            status: UI.DOM.transactionType.value === 'income' 
                ? (UI.DOM.a_receber.checked ? 'a_receber' : 'pago') 
                : 'pago'
        };
        
        try {
            const transactionId = UI.DOM.transactionId.value;
            
            // --- DEBUG DA NOVA LÓGICA ---
            console.log(`[DEBUG FinanceListener] ID Transação: ${transactionId}`);
            console.log(`[DEBUG FinanceListener] Serviços disponíveis:`, {
                getTransactionById: !!services.getTransactionById,
                updateOrder: !!services.updateOrderDiscountFromFinance
            });

            if (transactionId && services.getTransactionById && services.updateOrderDiscountFromFinance) {
                const originalTransaction = services.getTransactionById(transactionId);
                console.log("[DEBUG FinanceListener] Transação Original:", originalTransaction);

                if (originalTransaction && originalTransaction.orderId) {
                    const oldAmount = parseFloat(originalTransaction.amount) || 0;
                    const newAmount = data.amount;
                    const diff = newAmount - oldAmount;

                    console.log(`[DEBUG FinanceListener] Diferença calculada: ${diff} (Antigo: ${oldAmount}, Novo: ${newAmount})`);

                    if (Math.abs(diff) > 0.001) {
                        console.log("[DEBUG FinanceListener] Chamando atualização do pedido...");
                        await services.updateOrderDiscountFromFinance(originalTransaction.orderId, diff);
                    } else {
                        console.log("[DEBUG FinanceListener] Sem diferença de valor, pulando atualização do pedido.");
                    }
                } else {
                    console.log("[DEBUG FinanceListener] Transação não tem orderId vinculado.");
                }
            }
            // --- FIM DEBUG ---

            await services.saveTransaction(data, transactionId);
            UI.hideTransactionModal();

        } catch (error) {
            console.error("Erro ao salvar transação:", error);
            UI.showInfoModal("Não foi possível salvar o lançamento.");
        }
    });

    UI.DOM.cancelTransactionBtn.addEventListener('click', () => UI.hideTransactionModal());

    UI.DOM.transactionsList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.dataset.id) return;
        
        const id = btn.dataset.id;
        if (btn.classList.contains('edit-transaction-btn')) {
            handleEditTransaction(UI, id, services.getAllTransactions);
        } else if (btn.classList.contains('delete-transaction-btn')) {
            UI.showConfirmModal("Tem certeza que deseja excluir este lançamento?", "Excluir", "Cancelar")
              .then(ok => ok && services.deleteTransaction(id));
        } else if (btn.classList.contains('mark-as-paid-btn')) {
            services.markTransactionAsPaid(id);
        }
    });

    const renderFullDashboard = () => {
        // Debug para ver se o cálculo está sendo chamado na renderização
        const pendingRevenue = services.calculateTotalPendingRevenue ? services.calculateTotalPendingRevenue() : 0;
        console.log(`[DEBUG FinanceListener] Renderizando Dashboard. A Receber (Pedidos): ${pendingRevenue}`);
        
        UI.renderFinanceDashboard(services.getAllTransactions(), getConfig(), pendingRevenue);
    };

    UI.DOM.periodFilter.addEventListener('change', () => { 
        UI.DOM.customPeriodContainer.classList.toggle('hidden', UI.DOM.periodFilter.value !== 'custom'); 
        renderFullDashboard(); 
    });

    [UI.DOM.startDateInput, UI.DOM.endDateInput, UI.DOM.transactionSearchInput].forEach(element => {
        if(element) element.addEventListener('input', renderFullDashboard);
    });

    UI.DOM.adjustBalanceBtn.addEventListener('click', () => {
        UI.DOM.initialBalanceInput.value = (getConfig().initialBalance || 0).toFixed(2);
        UI.DOM.initialBalanceModal.classList.remove('hidden');
    });

    UI.DOM.saveBalanceBtn.addEventListener('click', async () => {
        const newBalance = parseFloat(UI.DOM.initialBalanceInput.value);
        if (isNaN(newBalance)) {
            UI.showInfoModal("Por favor, insira um valor numérico válido.");
            return;
        }
        await services.saveInitialBalance(newBalance);
        setConfig({ initialBalance: newBalance }); 
        renderFullDashboard(); 
        UI.DOM.initialBalanceModal.classList.add('hidden');
    });

    UI.DOM.transactionSourceContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.source-selector');
        if (target) {
            UI.updateSourceSelectionUI(UI.DOM.transactionSourceContainer, target.dataset.source);
        }
    });
}
