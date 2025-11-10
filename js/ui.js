// ==========================================================
// MÓDULO UI "GERENTE" (v4.3.4)
// Responsabilidade: Importar e reexportar funções de 
// especialistas.
// ==========================================================

// v4.3.0: Importa o DOM e constantes do especialista
import { DOM, SIZES_ORDER, CHECK_ICON_SVG } from './ui/dom.js';

// v4.3.1: Importa os Modais do especialista
import * as Modals from './ui/modalHandler.js';

// v4.3.2: Importa o Renderizador Financeiro
import * as FinanceUI from './ui/financeRenderer.js';

// v4.3.2: Importa o Renderizador de Pedidos
import * as OrderUI from './ui/orderRenderer.js';

// v4.3.3: Importa o Manipulador de Formulário
import * as FormHandler from './ui/formHandler.js';

// v4.3.4: Importa o Renderizador da Tabela de Preços
import * as PriceTableUI from './ui/priceTableRenderer.js';


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
// OUTRAS FUNÇÕES DE UI (Helpers)
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

// v4.3.4: Reexporta todos os especialistas
export {
    ...Modals,
    ...OrderUI,
    ...FinanceUI,
    ...FormHandler,
    ...PriceTableUI
};
