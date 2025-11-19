// js/listeners/orderListeners.js
import { fileToBase64, uploadToImgBB, generateReceiptPdf, generateComprehensivePdf } from '../utils.js';

/**
 * Função utilitária para adicionar listeners com segurança.
 * Evita que a aplicação quebre se um elemento não existir no DOM.
 */
function safeListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    } else {
        // Aviso silencioso para desenvolvedores, não para o usuário
        // console.warn(`Elemento não encontrado para o evento: ${event}`);
    }
}

/**
 * Coleta os dados do formulário do pedido.
 */
function collectFormData(UI) {
    // Coleta a origem (Banco/Caixa) do adiantamento via Container (Seguro)
    let activeSource = 'banco';
    if (UI.DOM.downPaymentSourceContainer) {
        const activeSourceEl = UI.DOM.downPaymentSourceContainer.querySelector('.source-selector.active');
        if (activeSourceEl && activeSourceEl.dataset.source) {
            activeSource = activeSourceEl.dataset.source;
        }
    }
    
    // Seleção segura do status "A Receber"
    const statusReceiver = document.getElementById('downPaymentStatusAReceber');
    const isAReceber = statusReceiver ? statusReceiver.checked : false;

    // Blindagem do paymentMethod
    const paymentMethodValue = UI.DOM.paymentMethod ? UI.DOM.paymentMethod.value : '';

    const data = {
        clientName: UI.DOM.clientName.value, 
        clientPhone: UI.DOM.clientPhone.value, 
        orderStatus: UI.DOM.orderStatus.value,
        orderDate: UI.DOM.orderDate.value, 
        deliveryDate: UI.DOM.deliveryDate.value, 
        generalObservation: UI.DOM.generalObservation.value,
        parts: [], 
        // CORREÇÃO DE NOMES AQUI (Input suffix)
        downPayment: parseFloat(UI.DOM.downPaymentInput.value) || 0, 
        discount: parseFloat(UI.DOM.discountInput.value) || 0,
        paymentMethod: paymentMethodValue,
        // CORREÇÃO: mockupFilesInput
        mockupUrls: Array.from(UI.DOM.existingFilesContainer.querySelectorAll('a')).map(a => a.href),
        
        // Novos campos da "Ponte"
        downPaymentDate: UI.DOM.downPaymentDateInput ? UI.DOM.downPaymentDateInput.value : new Date().toISOString().split('T')[0],
        paymentFinSource: activeSource,
        paymentFinStatus: isAReceber ? 'a_receber' : 'pago'
    };
    
    UI.DOM.partsContainer.querySelectorAll('.part-item').forEach(p => {
        const id = p.dataset.partId;
        const part = { type: p.querySelector('.part-type').value, material: p.querySelector('.part-material').value, colorMain: p.querySelector('.part-color-main').value, partInputType: p.dataset.partType, sizes: {}, details: [], specifics: [], unitPriceStandard: 0, unitPriceSpecific: 0, unitPrice: 0 };
        if (part.partInputType === 'comum') {
            p.querySelectorAll('.size-input').forEach(i => { if (i.value) { const {category, size} = i.dataset; if (!part.sizes[category]) part.sizes[category] = {}; part.sizes[category][size] = parseInt(i.value, 10); }});
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
}

/**
 * Inicializa todos os event listeners relacionados a Pedidos.
 */
export function initializeOrderListeners(UI, deps) {

    const { getState, setState, getOptionsFromStorage, services, userCompanyName } = deps;

    // --- Funcionalidades de Pedidos ---
    safeListener(UI.DOM.addOrderBtn, 'click', () => { 
        setState({ partCounter: 0 }); 
        UI.resetForm(); 
        UI.showOrderModal(); 
    });

    // ========================================================
    // LÓGICA DA "PONTE" (FORMULÁRIO DE PEDIDO)
    // ========================================================
    safeListener(UI.DOM.orderForm, 'submit', async (e) => {
        e.preventDefault();
        if(UI.DOM.saveBtn) UI.DOM.saveBtn.disabled = true; 
        if(UI.DOM.uploadIndicator) UI.DOM.uploadIndicator.classList.remove('hidden');
        
        try {
            // CORREÇÃO: mockupFilesInput
            const files = UI.DOM.mockupFilesInput ? UI.DOM.mockupFilesInput.files : [];
            const uploadPromises = Array.from(files).map(file => fileToBase64(file).then(uploadToImgBB));
            const newUrls = (await Promise.all(uploadPromises)).filter(Boolean);
            
            const orderData = collectFormData(UI); 
            orderData.mockupUrls.push(...newUrls);
            
            // CORREÇÃO: orderIdInput
            const orderId = UI.DOM.orderIdInput.value;
            const savedOrderId = await services.saveOrder(orderData, orderId); 
            
            const downPaymentAmount = parseFloat(orderData.downPayment) || 0;
            const clientName = orderData.clientName;

            const existingTransaction = await services.getTransactionByOrderId(savedOrderId);

            if (downPaymentAmount > 0) {
                const transactionData = {
                    date: orderData.downPaymentDate,
                    description: `Adiantamento Pedido - ${clientName}`,
                    amount: downPaymentAmount,
                    type: 'income',
                    category: 'Adiantamento de Pedido', 
                    source: orderData.paymentFinSource,
                    status: orderData.paymentFinStatus,
                    orderId: savedOrderId
                };
                
                if (existingTransaction) {
                    if (orderData.orderStatus !== 'Entregue') {
                         await services.saveTransaction(transactionData, existingTransaction.id);
                    }
                } 
                else {
                    await services.saveTransaction(transactionData, null);
                }
            } 
            else {
                if (existingTransaction) {
                    await services.deleteTransaction(existingTransaction.id);
                }
            }

            UI.hideOrderModal();
            
            if (orderData.orderStatus === 'Finalizado' || orderData.orderStatus === 'Entregue') {
                const generate = await UI.showConfirmModal(
                    "Pedido salvo com sucesso! Deseja gerar o Recibo de Quitação e Entrega?", 
                    "Sim, gerar recibo", 
                    "Não, obrigado"
                );
                if (generate) {
                    const fullOrderData = { ...orderData, id: savedOrderId };
                    await generateReceiptPdf(fullOrderData, userCompanyName, UI.showInfoModal);
                }
            } else {
                 UI.showInfoModal("Pedido salvo com sucesso!");
            }

        } catch (error) { 
            console.error("Erro ao salvar pedido:", error);
            UI.showInfoModal('Ocorreu um erro ao salvar o pedido. Por favor, verifique os dados e tente novamente.'); 
        } finally { 
            if(UI.DOM.saveBtn) UI.DOM.saveBtn.disabled = false; 
            if(UI.DOM.uploadIndicator) UI.DOM.uploadIndicator.classList.add('hidden'); 
        }
    });

    // ========================================================
    // LISTA DE PEDIDOS E BOTÕES DE AÇÃO
    // ========================================================
    safeListener(UI.DOM.ordersList, 'click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.dataset.id) return;

        const id = btn.dataset.id;
        const order = services.getOrderById(id);
        if (!order) return;

        if (btn.classList.contains('edit-btn')) {
            let { partCounter } = getState();
            partCounter = 0;
            partCounter = UI.populateFormForEdit(order, partCounter);
            setState({ partCounter });
            UI.showOrderModal();
            
        } else if (btn.classList.contains('replicate-btn')) {
            let { partCounter } = getState();
            partCounter = 0;
            partCounter = UI.populateFormForEdit(order, partCounter);
            setState({ partCounter });
            
            // CORREÇÃO: orderIdInput
            UI.DOM.orderIdInput.value = ''; 
            UI.DOM.modalTitle.textContent = 'Novo Pedido (Replicado)';
            UI.DOM.orderStatus.value = 'Pendente'; 
            UI.DOM.orderDate.value = new Date().toISOString().split('T')[0];
            UI.DOM.deliveryDate.value = ''; 
            // CORREÇÃO: Inputs corretos
            UI.DOM.discountInput.value = ''; 
            UI.DOM.downPaymentInput.value = '';
            UI.updateFinancials();
            
            if(UI.DOM.downPaymentDateInput) UI.DOM.downPaymentDateInput.value = new Date().toISOString().split('T')[0];
            // Nota: downPaymentStatusPago é acessado via DOM global ou check interno na UI helpers
            
            if (UI.DOM.downPaymentSourceContainer) {
                UI.updateSourceSelectionUI(UI.DOM.downPaymentSourceContainer, 'banco');
            }
            
            UI.showOrderModal();
            
        } else if (btn.classList.contains('delete-btn')) {
            UI.showConfirmModal("Tem certeza que deseja excluir este pedido?", "Excluir", "Cancelar")
              .then(async (confirmed) => {
                  if (confirmed) {
                      try {
                          await services.deleteAllTransactionsByOrderId(id);
                          await services.deleteOrder(id);
                      } catch (error) {
                          console.error("Erro ao excluir pedido e finanças:", error);
                          UI.showInfoModal("Falha ao excluir. Verifique o console.");
                      }
                  }
              });
        } else if (btn.classList.contains('view-btn')) {
            UI.viewOrder(order);
            UI.showViewModal();
            
        } else if (btn.classList.contains('settle-and-deliver-btn')) {
            try {
                let totalValue = 0;
                (order.parts || []).forEach(p => {
                    const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
                    const specificQty = (p.specifics || []).length;
                    const detailedQty = (p.details || []).length;
                    const standardSub = standardQty * (p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0);
                    const specificSub = specificQty * (p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0);
                    const detailedSub = detailedQty * (p.unitPrice || 0);
                    totalValue += standardSub + specificSub + detailedSub;
                });
                totalValue -= (order.discount || 0);

                const adiantamentoExistente = order.downPayment || 0;
                const valorRestante = totalValue - adiantamentoExistente;

                const updatedOrderData = { ...order };
                updatedOrderData.downPayment = totalValue; 
                updatedOrderData.orderStatus = 'Entregue';

                if (valorRestante <= 0) {
                    const confirmed = await UI.showConfirmModal(
                        "Este pedido já está pago. Deseja apenas marcá-lo como 'Entregue'?",
                        "Sim, marcar como 'Entregue'",
                        "Cancelar"
                    );
                    
                    if (confirmed) {
                        await services.saveOrder(updatedOrderData, id);
                        const generate = await UI.showConfirmModal(
                            "Pedido movido para 'Entregues' com sucesso! Deseja gerar o Recibo de Quitação e Entrega?",
                            "Sim, gerar recibo",
                            "Não, obrigado"
                        );
                        if (generate) {
                            await generateReceiptPdf(updatedOrderData, userCompanyName, UI.showInfoModal);
                        }
                    }
                } 
                else {
                    const settlementData = await UI.showSettlementModal(id, valorRestante);

                    if (settlementData) { 
                        await services.saveOrder(updatedOrderData, id);

                        const transactionData = {
                            date: settlementData.date, 
                            description: `Quitação Pedido - ${updatedOrderData.clientName}`,
                            amount: valorRestante,
                            type: 'income',
                            category: 'Quitação de Pedido', 
                            source: settlementData.source, 
                            status: 'pago',
                            orderId: id 
                        };
                        
                        await services.saveTransaction(transactionData, null);
                        
                        const generate = await UI.showConfirmModal(
                            "Pedido quitado e movido para 'Entregues' com sucesso! Deseja gerar o Recibo de Quitação e Entrega?",
                            "Sim, gerar recibo",
                            "Não, obrigado"
                        );
                        if (generate) {
                            await generateReceiptPdf(updatedOrderData, userCompanyName, UI.showInfoModal);
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao quitar e entregar pedido:", error);
                UI.showInfoModal("Ocorreu um erro ao atualizar o pedido.");
            }
        }
    });

    // Listeners do ViewModal
    safeListener(UI.DOM.viewModal, 'click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.id === 'closeViewBtn') { 
            UI.hideViewModal();
            UI.DOM.viewModal.innerHTML = ''; 
        }
        if (btn.id === 'comprehensivePdfBtn') {
            generateComprehensivePdf(btn.dataset.id, services.getAllOrders(), userCompanyName, UI.showInfoModal);
        }
    });

    // --- Interações dentro do Modal de Pedidos ---
    safeListener(UI.DOM.cancelBtn, 'click', () => UI.hideOrderModal());
    
    safeListener(UI.DOM.addPartBtn, 'click', () => { 
        let { partCounter } = getState();
        partCounter++; 
        UI.addPart({}, partCounter); 
        setState({ partCounter });
    });
    
    // CORREÇÃO: Uso dos nomes corretos com safeListener
    safeListener(UI.DOM.downPaymentInput, 'input', UI.updateFinancials);
    safeListener(UI.DOM.discountInput, 'input', UI.updateFinancials);

    safeListener(UI.DOM.clientPhone, 'input', (e) => {
        e.target.value = UI.formatPhoneNumber(e.target.value);
    });

    // Listener delegado para o modal de pedido
    safeListener(UI.DOM.orderModal, 'click', (e) => {
        const optionsBtn = e.target.closest('button.manage-options-btn'); 
        if (optionsBtn) { 
            const currentOptionType = optionsBtn.dataset.type;
            setState({ currentOptionType });
            UI.openOptionsModal(currentOptionType, getOptionsFromStorage(currentOptionType)); 
        }
        
        const removeMockupBtn = e.target.closest('.remove-mockup-btn');
        if (removeMockupBtn) {
            removeMockupBtn.parentElement.remove(); 
        }
        
        const sourceBtn = e.target.closest('#downPaymentSourceContainer .source-selector');
        if (sourceBtn && UI.DOM.downPaymentSourceContainer) {
            UI.updateSourceSelectionUI(UI.DOM.downPaymentSourceContainer, sourceBtn.dataset.source);
        }
    });
}
