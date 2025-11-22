// js/ui/financeRenderer.js
// ==========================================================
// MÓDULO FINANCE RENDERER (v5.15.0 - ROBUST CONTEXT AWARENESS)
// ==========================================================

import { DOM } from './dom.js';

// --- Estado Local do Renderizador ---
let isFirstRender = true;
let lastRenderedFilter = ''; // Memoriza qual foi o último filtro desenhado

const generateTransactionRowHTML = (t) => {
    const isIncome = t.type === 'income';
    const isReceivable = isIncome && t.status === 'a_receber';
    
    const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
    const formattedDate = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const transactionAmount = typeof t.amount === 'number' ? t.amount.toFixed(2) : '0.00';
    
    const statusBadge = isReceivable ? `<span class="ml-2 text-xs font-semibold py-1 px-2 rounded-full bg-yellow-100 text-yellow-800">A Receber</span>` : '';
    const sourceBadge = `<span class="text-xs font-semibold py-1 px-2 rounded-full ${t.source === 'caixa' ? 'bg-gray-200 text-gray-800' : 'bg-indigo-100 text-indigo-800'}">${t.source === 'caixa' ? 'Caixa' : 'Banco'}</span>`;
    
    const isLinkedToOrder = !!t.orderId;
    let actionsHtml = '';

    if (isReceivable) { 
        actionsHtml = `<button data-id="${t.id}" class="mark-as-paid-btn text-green-600 hover:underline text-sm font-semibold">Receber</button> `;
    }

    actionsHtml += `
        <button data-id="${t.id}" class="edit-transaction-btn text-blue-500 hover:underline text-sm">Editar</button>
        <button data-id="${t.id}" class="delete-transaction-btn text-red-500 hover:underline text-sm ml-2">Excluir</button>
    `;

    if (isLinkedToOrder) {
        actionsHtml += `<span class="block text-xs text-gray-500 italic mt-1" title="Vinculado ao Pedido ID: ${t.orderId}">Lançado via Pedido</span>`;
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

export const addTransactionRow = (transaction) => {
    const tr = document.createElement('tr');
    tr.className = `border-b hover:bg-gray-50 ${transaction.status === 'a_receber' ? 'bg-yellow-50' : ''}`;
    tr.dataset.id = transaction.id;
    tr.dataset.date = transaction.date;
    tr.innerHTML = generateTransactionRowHTML(transaction);

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
    
    const placeholder = DOM.transactionsList.querySelector('.transactions-placeholder');
    if (placeholder) placeholder.remove();
};

export const updateTransactionRow = (transaction) => {
    const row = DOM.transactionsList.querySelector(`tr[data-id="${transaction.id}"]`);
    if (row) {
        row.className = `border-b hover:bg-gray-50 ${transaction.status === 'a_receber' ? 'bg-yellow-50' : ''}`;
        row.innerHTML = generateTransactionRowHTML(transaction);
        const oldDate = row.dataset.date;
        if (transaction.date !== oldDate) {
            row.remove();
            addTransactionRow(transaction);
        }
    }
};

export const removeTransactionRow = (transactionId) => {
    const row = DOM.transactionsList.querySelector(`tr[data-id="${transactionId}"]`);
    if (row) {
        row.remove();
    }
    if (DOM.transactionsList.children.length === 0) {
        showTransactionsPlaceholder(false);
    }
};

const showTransactionsPlaceholder = (isSearch) => {
    const message = isSearch ? 'Nenhum lançamento encontrado para a busca.' : 'Nenhum lançamento encontrado para este período.';
    DOM.transactionsList.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500 transactions-placeholder">${message}</td></tr>`;
};

export const renderFinanceKPIs = (allTransactions, userBankBalanceConfig, pendingOrdersValue = 0) => {
    
    // --- LÓGICA DE FILTRO ---
    const filterValue = DOM.periodFilter ? DOM.periodFilter.value : 'thisMonth';
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
    
    if (!startDate || !endDate) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const filteredTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        if (startDate && endDate) return transactionDate >= startDate && transactionDate <= endDate;
        return true;
    });

    // --- CÁLCULOS BASE ---
    let faturamentoBruto = 0, despesasTotais = 0, contasAReceber = 0, valorRecebido = 0;
    let bankFlow = 0;
    let cashFlow = 0;

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
        
        if (t.source === 'caixa') {
            if (t.type === 'income' && t.status !== 'a_receber') cashFlow += amount;
            else if (t.type === 'expense') cashFlow -= amount;
        } else { 
            if (t.type === 'income' && t.status !== 'a_receber') bankFlow += amount;
            else if (t.type === 'expense') bankFlow -= amount;
        }
    });

    // --- SOMATÓRIA HÍBRIDA (TRANSAÇÕES + PEDIDOS) ---
    let incomingPendingValue = parseFloat(pendingOrdersValue) || 0;
    
    // --- BLINDAGEM VISUAL V2 (CONTEXT AWARE) ---
    if (DOM.contasAReceber) {
        const currentText = DOM.contasAReceber.textContent;
        const currentDomValue = parseFloat(currentText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const isTrustedValue = DOM.contasAReceber.dataset.trusted === 'true';
        
        // Verifica se o filtro mudou desde a última renderização
        const filterChanged = lastRenderedFilter !== filterValue;

        // O Escudo só ativa se TODAS as condições forem verdadeiras:
        // 1. NÃO é a primeira carga (se for, tem que limpar o placeholder)
        // 2. O filtro NÃO mudou (se mudou, o valor antigo não serve mais, pode aceitar zero)
        // 3. O valor chegando é ZERO (o problema que queremos evitar)
        // 4. O valor na tela é maior que zero (tem algo pra proteger)
        // 5. O valor na tela é confiável (não é lixo de HTML)
        
        const shouldShield = !isFirstRender && !filterChanged && incomingPendingValue === 0 && currentDomValue > 0 && isTrustedValue;

        if (shouldShield) {
            console.warn(`🛡️ [RENDERER] Escudo Ativado: Mantendo R$ ${currentDomValue} (Zero Fantasma detectado no mesmo contexto).`);
            incomingPendingValue = currentDomValue - contasAReceber; 
            if (incomingPendingValue < 0) incomingPendingValue = 0;
        } else {
            // Se o escudo não ativou, verificamos se precisamos limpar atributos antigos
            if (isFirstRender || filterChanged) {
                 // Reseta a confiança para garantir que o novo valor seja aceito
                 // console.log("🧹 [RENDERER] Contexto novo ou primeira carga. Aceitando qualquer valor.");
            }
        }
    }

    // Aplica o valor
    contasAReceber += incomingPendingValue;

    const lucroLiquido = valorRecebido - despesasTotais;
    const saldoEmConta = (userBankBalanceConfig.initialBalance || 0) + bankFlow;
    const saldoEmCaixa = cashFlow;

    // --- ATUALIZAÇÃO DO DOM ---
    if (DOM.faturamentoBruto) DOM.faturamentoBruto.textContent = `R$ ${faturamentoBruto.toFixed(2)}`;
    if (DOM.despesasTotais) DOM.despesasTotais.textContent = `R$ ${despesasTotais.toFixed(2)}`;
    
    if (DOM.contasAReceber) {
        DOM.contasAReceber.textContent = `R$ ${contasAReceber.toFixed(2)}`;
        DOM.contasAReceber.dataset.trusted = 'true';
    }
    
    if (DOM.lucroLiquido) DOM.lucroLiquido.textContent = `R$ ${lucroLiquido.toFixed(2)}`;
    if (DOM.saldoEmConta) DOM.saldoEmConta.textContent = `R$ ${saldoEmConta.toFixed(2)}`;
    if (DOM.saldoEmCaixa) DOM.saldoEmCaixa.textContent = `R$ ${saldoEmCaixa.toFixed(2)}`;
    
    // --- CATEGORIAS ---
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
        if (!containerElement) return;
        
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
    
    // Atualiza estado local
    isFirstRender = false;
    lastRenderedFilter = filterValue;
    
    return filteredTransactions;
};

export const renderFinanceDashboard = (allTransactions, userBankBalanceConfig, pendingOrdersValue = 0) => {
    if (!DOM.periodFilter) return;

    const filteredTransactions = renderFinanceKPIs(allTransactions, userBankBalanceConfig, pendingOrdersValue);

    const searchTerm = DOM.transactionSearchInput.value.toLowerCase();
    const displayTransactions = searchTerm ?
        filteredTransactions.filter(t => t.description.toLowerCase().includes(searchTerm)) :
        filteredTransactions;
        
    DOM.transactionsList.innerHTML = ''; 
    if (displayTransactions.length === 0) {
        showTransactionsPlaceholder(searchTerm.length > 0);
        return;
    }
    
    displayTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    displayTransactions.forEach(addTransactionRow);
};
