// ==========================================================
// MÓDULO UI "GERENTE" (v4.3.2)
// Responsabilidade: Importar e reexportar funções de 
// especialistas.
// ==========================================================

// v4.3.0: Importa o DOM e constantes do especialista
import { DOM, SIZES_ORDER, CHECK_ICON_SVG } from './ui/dom.js';

// v4.3.1: Importa os Modais do especialista
import * as Modals from './ui/modalHandler.js';

// v4.3.2: Importa o Renderizador Financeiro
import * as FinanceUI from './ui/financeRenderer.js';

// v4.3.2: Importa o Renderizador de Pedidos (do passo anterior)
import * as OrderUI from './ui/orderRenderer.js';


// Funções de UI Geral
export const updateNavButton = (currentDashboardView) => {
    const isOrdersView = currentDashboardView === 'orders';
    if (isOrdersView) {
        DOM.financeDashboardBtn.innerHTML = `📊 Financeiro`;
    } else {
        DOM.financeDashboardBtn.innerHTML = `📋 Pedidos`;
    }
};

export const handleCookieConsent = () => {
    if (localStorage.getItem('cookieConsent')) {
        DOM.cookieBanner.classList.add('hidden');
    } else {
        DOM.cookieBanner.classList.remove('hidden');
    }
};

// ==========================================================
// SEÇÃO DE RENDERIZAÇÃO DA TABELA DE PREÇOS
// ==========================================================

/**
 * Cria uma linha da tabela de preços (HTML ou Elemento)
 */
export const createPriceTableRow = (item, mode) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';
    tr.dataset.id = item.id;
    
    const price = (typeof item.price === 'number') ? item.price.toFixed(2) : '0.00';

    if (mode === 'edit') {
        tr.innerHTML = `
            <td class="p-2"><input type="text" class="p-2 border rounded-md w-full price-item-name" value="${item.name || ''}"></td>
            <td class="p-2"><input type="text" class="p-2 border rounded-md w-full price-item-desc" value="${item.description || ''}"></td>
            <td class="p-2"><input type="number" step="0.01" class="p-2 border rounded-md w-full text-right price-item-price" value="${price}"></td>
            <td class="p-2 text-center"><button class="delete-price-item-btn text-red-500 hover:text-red-700 font-bold text-xl">&times;</button></td>
        `;
    } else {
        tr.innerHTML = `
            <td class="p-3 font-medium text-gray-800">${item.name || ''}</td>
            <td class="p-3 text-gray-600">${item.description || ''}</td>
            <td class="p-3 text-right font-semibold text-gray-800">R$ ${price}</td>
        `;
    }
    return tr;
};

/**
 * Adiciona uma linha na tabela de preços
 */
export const addPriceTableRow = (item, mode) => {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    const tr = createPriceTableRow(item, mode);
    tableBody.appendChild(tr);
    
    // Remove placeholder
    const placeholder = tableBody.querySelector('.pricing-placeholder');
    if (placeholder) placeholder.remove();
};

/**
 * Atualiza uma linha da tabela de preços
 */
export const updatePriceTableRow = (item, mode) => {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    const row = tableBody.querySelector(`tr[data-id="${item.id}"]`);
    if (row) {
        const tr = createPriceTableRow(item, mode);
        row.replaceWith(tr);
    }
};

/**
 * Remove uma linha da tabela de preços
 */
export const removePriceTableRow = (itemId) => {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;

    const row = tableBody.querySelector(`tr[data-id="${itemId}"]`);
    if (row) {
        row.remove();
    }
    
    // Adiciona placeholder se a tabela ficar vazia
    if (tableBody.children.length === 0 && !DOM.addPriceItemBtn.classList.contains('hidden')) { // Apenas se estiver em modo de edição
         tableBody.innerHTML = `<tr class="pricing-placeholder"><td colspan="4" class="text-center p-6 text-gray-500">Nenhum item. Clique em "Adicionar Item".</td></tr>`;
    }
};

/**
 * Função principal de renderização da tabela de preços (carga inicial)
 */
export const renderPriceTable = (allPricingItems, mode = 'view') => {
    const isEditMode = mode === 'edit';
    DOM.priceTableContainer.innerHTML = ''; 

    let tableHTML = `
        <table class="w-full text-left table-auto">
            <thead>
                <tr class="bg-gray-100">
                    <th class="p-3 text-sm font-semibold text-gray-700 w-1/3">Serviço/Item</th>
                    <th class="p-3 text-sm font-semibold text-gray-700 w-1/2">Descrição</th>
                    <th class="p-3 text-sm font-semibold text-gray-700 text-right">Preço (R$)</th>
                    ${isEditMode ? '<th class="p-3 text-sm font-semibold text-gray-700 text-center w-16">Ação</th>' : ''}
                </tr>
            </thead>
            <tbody id="priceTableBody"></tbody>
        </table>
    `;
    DOM.priceTableContainer.innerHTML = tableHTML;
    const tableBody = document.getElementById('priceTableBody');
    
    if (allPricingItems.length === 0) {
        const colSpan = isEditMode ? 4 : 3;
        const message = isEditMode ? 'Nenhum item. Clique em "Adicionar Item".' : 'Nenhum item na tabela de preços. Clique em "Editar" para adicionar.';
        tableBody.innerHTML = `<tr class="pricing-placeholder"><td colspan="${colSpan}" class="text-center p-6 text-gray-500">${message}</td></tr>`;
    } else {
        // Usa a função granular para construir a lista inicial
        allPricingItems.forEach(item => {
            const tr = createPriceTableRow(item, mode);
            tableBody.appendChild(tr);
        });
    }
    
    DOM.editPriceTableBtn.classList.toggle('hidden', isEditMode);
    DOM.closePriceTableBtn.classList.toggle('hidden', isEditMode);
    DOM.priceTableEditMessage.classList.toggle('hidden', !isEditMode);
    DOM.savePriceTableBtn.classList.toggle('hidden', !isEditMode);
    DOM.cancelPriceTableBtn.classList.toggle('hidden', !isEditMode);
    DOM.addPriceItemBtn.classList.toggle('hidden', !isEditMode);
};


// ==========================================================
// SEÇÃO DO FORMULÁRIO DE PEDIDOS (LÓGICA INTERNA)
// ==========================================================

export const updateFinancials = () => {
    let subtotal = 0;
    DOM.financialsContainer.querySelectorAll('.financial-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.financial-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.financial-price').value) || 0;
        const itemSubtotal = quantity * price;
        item.querySelector('.financial-subtotal').textContent = `R$ ${itemSubtotal.toFixed(2)}`;
        subtotal += itemSubtotal;
    });

    const discount = parseFloat(DOM.discount.value) || 0;
    const grandTotal = Math.max(0, subtotal - discount);
    const downPayment = parseFloat(DOM.downPayment.value) || 0;

    DOM.grandTotal.textContent = `R$ ${grandTotal.toFixed(2)}`;
    DOM.remainingTotal.textContent = `R$ ${(grandTotal - downPayment).toFixed(2)}`;
};

const createFinancialRow = (partId, name, quantity, priceGroup) => {
    const finTpl = document.getElementById('financialRowTemplate').content.cloneNode(true);
    const finItem = finTpl.querySelector('.financial-item');
    finItem.dataset.partId = partId;
    finItem.dataset.priceGroup = priceGroup;

    finItem.querySelector('.financial-part-name > span:first-child').textContent = name;
    const label = priceGroup === 'standard' ? '(Padrão)' : priceGroup === 'specific' ? '(Específico)' : '';
    finItem.querySelector('.price-group-label').textContent = label;

    finItem.querySelector('.financial-quantity').value = quantity;
    finItem.querySelector('.financial-price').addEventListener('input', updateFinancials);

    return finItem;
};

export const renderFinancialSection = () => {
    // ==========================================================
    // INÍCIO DA CORREÇÃO v4.2.6: Preservar preços unitários ao mudar quantidade
    // ==========================================================
    
    // 1. Salva os preços unitários existentes antes de limpar o DOM
    const existingPrices = new Map();
    DOM.financialsContainer.querySelectorAll('.financial-item').forEach(item => {
        const partId = item.dataset.partId;
        const priceGroup = item.dataset.priceGroup;
        const price = item.querySelector('.financial-price').value;
        if (price) { // Salva apenas se houver um valor
            existingPrices.set(`${partId}-${priceGroup}`, price);
        }
    });

    DOM.financialsContainer.innerHTML = '';
    
    DOM.partsContainer.querySelectorAll('.part-item').forEach(partItem => {
        const partId = partItem.dataset.partId;
        const partName = partItem.querySelector('.part-type').value || `Peça ${partId}`;
        const partType = partItem.dataset.partType;

        if (partType === 'comum') {
            let standardQty = 0;
            partItem.querySelectorAll('.size-input').forEach(input => {
                standardQty += parseInt(input.value) || 0;
            });
            const specificQty = partItem.querySelectorAll('.specific-size-row').length;

            if (standardQty > 0) {
                const finRow = createFinancialRow(partId, partName, standardQty, 'standard');
                // 2. Reaplica o preço salvo, se existir
                const key = `${partId}-standard`;
                if (existingPrices.has(key)) {
                    finRow.querySelector('.financial-price').value = existingPrices.get(key);
                }
                DOM.financialsContainer.appendChild(finRow);
            }
            if (specificQty > 0) {
                const finRow = createFinancialRow(partId, partName, specificQty, 'specific');
                // 2. Reaplica o preço salvo, se existir
                const key = `${partId}-specific`;
                if (existingPrices.has(key)) {
                    finRow.querySelector('.financial-price').value = existingPrices.get(key);
                }
                DOM.financialsContainer.appendChild(finRow);
            }
        } else { // 'detalhado'
            const totalQty = partItem.querySelectorAll('.detailed-item-row').length;
            if (totalQty > 0) {
                const finRow = createFinancialRow(partId, partName, totalQty, 'detailed');
                // 2. Reaplica o preço salvo, se existir
                const key = `${partId}-detailed`;
                if (existingPrices.has(key)) {
                    finRow.querySelector('.financial-price').value = existingPrices.get(key);
                }
                DOM.financialsContainer.appendChild(finRow);
            }
        }
    });
    
    // 3. Recalcula o total (que já era chamado)
    updateFinancials();
    
    // ==========================================================
    // FIM DA CORREÇÃO v4.2.6
    // ==========================================================
};

const addContentToPart = (partItem, partData = {}) => {
    const contentContainer = partItem.querySelector('.part-content-container');
    contentContainer.innerHTML = '';
    const partType = partItem.dataset.partType;

    partItem.querySelectorAll('.part-type-selector').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === partType);
    });

    if (partType === 'comum') {
        const comumTpl = document.getElementById('comumPartContentTemplate').content.cloneNode(true);
        
        const sizesGrid = comumTpl.querySelector('.sizes-grid');
        const categories = {
            'Baby Look': ['PP', 'P', 'M', 'G', 'GG', 'XG'],
            'Normal': ['PP', 'P', 'M', 'G', 'GG', 'XG'],
            'Infantil': ['2 anos', '4 anos', '6 anos', '8 anos', '10 anos', '12 anos']
        };
        let gridHtml = '';
        for (const category in categories) {
            gridHtml += `<div class="p-3 border rounded-md bg-white"><h4 class="font-semibold mb-2">${category}</h4><div class="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-start">`;
            categories[category].forEach(size => {
                const value = partData.sizes?.[category]?.[size] || '';
                gridHtml += `
                    <div class="size-input-container">
                        <label class="text-sm font-medium mb-1">${size}</label>
                        <input type="number" data-category="${category}" data-size="${size}" value="${value}" class="p-2 border rounded-md w-full text-center size-input">
                    </div>`;
            });
            gridHtml += '</div></div>';
        }
        sizesGrid.innerHTML = gridHtml;
        
        const specificList = comumTpl.querySelector('.specific-sizes-list');
        const addSpecificRow = (spec = {}) => {
            const specTpl = document.getElementById('specificSizeRowTemplate').content.cloneNode(true);
            specTpl.querySelector('.item-spec-width').value = spec.width || '';
            specTpl.querySelector('.item-spec-height').value = spec.height || '';
            specTpl.querySelector('.item-spec-obs').value = spec.observation || '';
            specTpl.querySelector('.remove-specific-row-btn').addEventListener('click', (e) => {
                e.target.closest('.specific-size-row').remove();
                renderFinancialSection();
            });
            specificList.appendChild(specTpl);
        };

        (partData.specifics || []).forEach(addSpecificRow);

        comumTpl.querySelector('.add-specific-size-btn').addEventListener('click', () => {
            addSpecificRow();
            renderFinancialSection();
        });

        comumTpl.querySelector('.toggle-sizes-btn').addEventListener('click', (e) => e.target.nextElementSibling.classList.toggle('hidden'));
        sizesGrid.addEventListener('input', renderFinancialSection);
        contentContainer.appendChild(comumTpl);

    } else { // 'detalhado'
        const detalhadoTpl = document.getElementById('detalhadoPartContentTemplate').content.cloneNode(true);
        const listContainer = detalhadoTpl.querySelector('.detailed-items-list');
        const addRow = (detail = {}) => {
            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-2 items-center detailed-item-row';
            row.innerHTML = `
                <div class="col-span-5"><input type="text" placeholder="Nome na Peça" class="p-1 border rounded-md w-full text-sm item-det-name" value="${detail.name || ''}"></div>
                <div class="col-span-4"><input type="text" placeholder="Tamanho" class="p-1 border rounded-md w-full text-sm item-det-size" value="${detail.size || ''}"></div>
                <div class="col-span-2"><input type="text" placeholder="Nº" class="p-1 border rounded-md w-full text-sm item-det-number" value="${detail.number || ''}"></div>
                <div class="col-span-1 flex justify-center"><button type="button" class="remove-detailed-row text-red-500 font-bold">&times;</button></div>`;
            row.querySelector('.remove-detailed-row').addEventListener('click', () => {
                row.remove();
                renderFinancialSection();
            });
            listContainer.appendChild(row);
        };
        (partData.details || [{}]).forEach(addRow);
        detalhadoTpl.querySelector('.add-detailed-row-btn').addEventListener('click', () => {
            addRow();
            renderFinancialSection();
        });
        contentContainer.appendChild(detalhadoTpl);
    }
};

export const addPart = (partData = {}, partCounter) => {
    const partTpl = document.getElementById('partTemplate').content.cloneNode(true);
    const partItem = partTpl.querySelector('.part-item');
    partItem.dataset.partId = partCounter;
    partItem.dataset.partType = partData.partInputType || 'comum';
    
    const partTypeInput = partItem.querySelector('.part-type');
    partTypeInput.value = partData.type || '';
    partItem.querySelector('.part-material').value = partData.material || '';
    partItem.querySelector('.part-color-main').value = partData.colorMain || '';
    
    partTypeInput.addEventListener('input', renderFinancialSection);
    
    addContentToPart(partItem, partData);
    DOM.partsContainer.appendChild(partItem);
    
    renderFinancialSection();
    
    partItem.querySelector('.remove-part-btn').addEventListener('click', () => {
        partItem.remove();
        renderFinancialSection();
    });
    partItem.querySelectorAll('.part-type-selector').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newType = e.target.dataset.type;
            partItem.dataset.partType = newType;
            addContentToPart(partItem, {}); 
            renderFinancialSection();
        });
    });
};

export const resetForm = () => {
    DOM.orderForm.reset();
    DOM.orderId.value = '';
    DOM.modalTitle.textContent = 'Novo Pedido';
    DOM.partsContainer.innerHTML = '';
    DOM.financialsContainer.innerHTML = '';
    DOM.existingFilesContainer.innerHTML = '';
    DOM.orderDate.value = new Date().toISOString().split('T')[0];
    
    // v5.0: Define padrões para os novos campos da "Ponte"
    DOM.downPaymentDate.value = new Date().toISOString().split('T')[0];
    DOM.downPaymentStatusPago.checked = true;
    updateSourceSelectionUI(DOM.downPaymentSourceContainer, 'banco');
    
    updateFinancials();
};

export const populateFormForEdit = (orderData, currentPartCounter) => {
    resetForm();
    
    DOM.orderId.value = orderData.id;
    DOM.modalTitle.textContent = 'Editar Pedido';
    DOM.clientName.value = orderData.clientName;
    DOM.clientPhone.value = orderData.clientPhone;
    DOM.orderStatus.value = orderData.orderStatus;
    DOM.orderDate.value = orderData.orderDate;
    DOM.deliveryDate.value = orderData.deliveryDate;
    DOM.generalObservation.value = orderData.generalObservation;
    DOM.downPayment.value = orderData.downPayment || '';
    DOM.discount.value = orderData.discount || '';
    DOM.paymentMethod.value = orderData.paymentMethod || '';
    
    // v5.0: Popula os novos campos da "Ponte"
    DOM.downPaymentDate.value = orderData.downPaymentDate || new Date().toISOString().split('T')[0];
    const finStatus = orderData.paymentFinStatus || 'pago';
    (finStatus === 'a_receber' ? DOM.downPaymentStatusAReceber : DOM.downPaymentStatusPago).checked = true;
    updateSourceSelectionUI(DOM.downPaymentSourceContainer, orderData.paymentFinSource || 'banco');


    DOM.existingFilesContainer.innerHTML = '';
    if (orderData.mockupUrls && orderData.mockupUrls.length) {
        orderData.mockupUrls.forEach(url => {
            const fileWrapper = document.createElement('div');
            fileWrapper.className = 'flex items-center justify-between bg-gray-100 p-2 rounded-md';
            
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'text-blue-600 hover:underline text-sm truncate';
            link.textContent = url.split('/').pop().split('?')[0];
            
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'remove-mockup-btn text-red-500 hover:text-red-700 font-bold ml-2 px-2';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remover anexo';

            fileWrapper.appendChild(link);
            fileWrapper.appendChild(deleteBtn);
            DOM.existingFilesContainer.appendChild(fileWrapper);
        });
    }

    (orderData.parts || []).forEach(part => {
        currentPartCounter++;
        addPart(part, currentPartCounter);
    });
    
    DOM.financialsContainer.querySelectorAll('.financial-item').forEach(finRow => {
        const partId = finRow.dataset.partId;
        const priceGroup = finRow.dataset.priceGroup;
        const part = orderData.parts[partId - 1];
        if (!part) return;

        if (priceGroup === 'standard') {
            finRow.querySelector('.financial-price').value = part.unitPriceStandard || part.unitPrice || '';
        } else if (priceGroup === 'specific') {
            finRow.querySelector('.financial-price').value = part.unitPriceSpecific || part.unitPrice || '';
        } else if (priceGroup === 'detailed') {
            finRow.querySelector('.financial-price').value = part.unitPrice || '';
        }
    });

    updateFinancials();
    DOM.orderModal.classList.remove('hidden');
    return currentPartCounter;
};

// ==========================================================
// OUTRAS FUNÇÕES DE UI
// ==========================================================

/**
 * Atualiza a UI dos seletores de origem (Banco/Caixa)
 * @param {HTMLElement} container - O elemento container (ex: DOM.transactionSourceContainer)
 * @param {string} selectedSource - 'banco' ou 'caixa'
 */
export const updateSourceSelectionUI = (container, selectedSource) => {
    if (!container) return;
    container.querySelectorAll('.source-selector').forEach(btn => {
        const isSelected = btn.dataset.source === selectedSource;
        btn.classList.toggle('active', isSelected);
        const iconPlaceholder = btn.querySelector('.icon-placeholder');
        iconPlaceholder.innerHTML = isSelected ? CHECK_ICON_SVG : '';
    });
};

export const populateDatalists = (partTypes, materialTypes) => {
    DOM.partTypeList.innerHTML = partTypes.map(opt => `<option value="${opt}"></option>`).join('');
    DOM.partMaterialList.innerHTML = materialTypes.map(opt => `<option value="${opt}"></option>`).join('');
};

export const openOptionsModal = (type, options) => {
    const title = type === 'partTypes' ? 'Tipos de Peça' : 'Tipos de Material';
    DOM.optionsModalTitle.textContent = `Gerenciar ${title}`;
    DOM.optionsList.innerHTML = options.map((opt, index) =>
        `<div class="flex justify-between items-center p-2 bg-gray-100 rounded-md">
            <span>${opt}</span>
            <button class="delete-option-btn text-red-500 hover:text-red-700 font-bold" data-index="${index}">&times;</button>
        </div>`
    ).join('');
    DOM.optionsModal.classList.remove('hidden');
};

export const formatPhoneNumber = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g,'');             // Remove tudo o que não é dígito
    value = value.replace(/^(\d{2})(\d)/g,'($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
    value = value.replace(/(\d)(\d{4})$/,'$1-$2');    // Coloca hífen entre o quarto e o quinto dígitos
    return value;
}

// v4.3.2: Reexporta os especialistas
export {
    ...Modals,
    ...OrderUI,
    ...FinanceUI
};
