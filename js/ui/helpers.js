// ==========================================================
// MÓDULO MODAL HANDLER (v4.5.2 - Hotfix Desacoplado)
// Responsabilidade: Gerenciar a exibição e lógica de 
// todos os modais da aplicação.
// ==========================================================

// CORREÇÃO FINAL: Importa APENAS o DOM. Removemos CHECK_ICON_SVG da importação.
import { DOM } from './dom.js';

// Importa a função de helper
import { updateSourceSelectionUI } from './helpers.js';

// Importa a função de data local
import { getLocalDateISOString } from '../utils.js';

// Ícone definido localmente para quebrar a dependência circular/quebrada com dom.js
const CHECK_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';

export const showInfoModal = (message) => {
    DOM.infoModalMessage.textContent = message;
    DOM.infoModal.classList.remove('hidden');
};

export const showForgotPasswordModal = () => {
    return new Promise((resolve) => {
        DOM.resetEmailInput.value = '';
        DOM.forgotPasswordModal.classList.remove('hidden');
        DOM.resetEmailInput.focus();

        const handleSend = () => {
            cleanupAndResolve(DOM.resetEmailInput.value.trim());
        };

        const handleCancel = () => {
            cleanupAndResolve(null);
        };

        const cleanupAndResolve = (value) => {
            DOM.sendResetEmailBtn.removeEventListener('click', handleSend);
            DOM.cancelResetBtn.removeEventListener('click', handleCancel);
            DOM.forgotPasswordModal.classList.add('hidden');
            resolve(value);
        };

        DOM.sendResetEmailBtn.addEventListener('click', handleSend, { once: true });
        DOM.cancelResetBtn.addEventListener('click', handleCancel, { once: true });
    });
};

export const showConfirmModal = (message, okText = "OK", cancelText = "Cancelar") => {
    return new Promise((resolve) => {
        DOM.confirmModalMessage.textContent = message;
        DOM.confirmOkBtn.textContent = okText;
        DOM.confirmCancelBtn.textContent = cancelText;
        DOM.confirmModal.classList.remove('hidden');

        const confirmListener = () => resolvePromise(true);
        const cancelListener = () => resolvePromise(false);

        const resolvePromise = (value) => {
            DOM.confirmModal.classList.add('hidden');
            DOM.confirmOkBtn.removeEventListener('click', confirmListener);
            DOM.confirmCancelBtn.removeEventListener('click', cancelListener);
            resolve(value);
        };

        DOM.confirmOkBtn.addEventListener('click', confirmListener, { once: true });
        DOM.confirmCancelBtn.addEventListener('click', cancelListener, { once: true });
    });
};

export const showSettlementModal = (orderId, amount) => {
    return new Promise((resolve) => {
        DOM.settlementOrderId.value = orderId;
        DOM.settlementAmountDisplay.textContent = `R$ ${amount.toFixed(2)}`;
        
        // Usa a data local correta
        DOM.settlementDate.value = getLocalDateISOString();
        
        // Define 'banco' como padrão ao abrir
        updateSourceSelectionUI(DOM.settlementSourceContainer, 'banco');

        DOM.settlementModal.classList.remove('hidden');
        DOM.settlementDate.focus();

        const handleConfirm = () => {
            const selectedSourceEl = DOM.settlementSourceContainer.querySelector('.source-selector.active');
            if (!selectedSourceEl) {
                const container = DOM.settlementSourceContainer;
                container.classList.add('ring-2', 'ring-red-500', 'rounded-md');
                setTimeout(() => container.classList.remove('ring-2', 'ring-red-500', 'rounded-md'), 1000);
                return;
            }
            
            const data = {
                date: DOM.settlementDate.value,
                source: selectedSourceEl.dataset.source
            };
            cleanupAndResolve(data);
        };

        const handleCancel = () => {
            cleanupAndResolve(null);
        };
        
        const handleSourceClick = (e) => {
             const target = e.target.closest('.source-selector');
             if (target) {
                updateSourceSelectionUI(DOM.settlementSourceContainer, target.dataset.source);
             }
        };

        const cleanupAndResolve = (value) => {
            DOM.settlementModal.classList.add('hidden');
            DOM.settlementConfirmBtn.removeEventListener('click', handleConfirm);
            DOM.settlementCancelBtn.removeEventListener('click', handleCancel);
            DOM.settlementSourceContainer.removeEventListener('click', handleSourceClick);
            resolve(value);
        };

        DOM.settlementConfirmBtn.addEventListener('click', handleConfirm, { once: false });
        DOM.settlementCancelBtn.addEventListener('click', handleCancel, { once: true });
        DOM.settlementSourceContainer.addEventListener('click', handleSourceClick);
    });
};

// ========================================================
// MODAIS GERAIS
// ========================================================

export const showOrderModal = () => {
    DOM.orderModal.classList.remove('hidden');
};

export const hideOrderModal = () => {
    DOM.orderModal.classList.add('hidden');
};

export const showTransactionModal = () => {
    DOM.transactionModal.classList.remove('hidden');
};

export const hideTransactionModal = () => {
    DOM.transactionModal.classList.add('hidden');
};

export const showPriceTableModal = () => {
    DOM.priceTableModal.classList.remove('hidden');
};

export const hidePriceTableModal = () => {
    DOM.priceTableModal.classList.add('hidden');
};

export const showViewModal = () => {
    DOM.viewModal.classList.remove('hidden');
};

export const hideViewModal = () => {
    DOM.viewModal.classList.add('hidden');
};
