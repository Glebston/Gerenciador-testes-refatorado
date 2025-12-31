// js/listeners/orderListeners.js
// ==========================================================
// MÓDULO ORDER LISTENERS (v5.30.2 - FIXED CLOSE, ESC & ZOMBIE ID)
// ==========================================================

import { fileToBase64, uploadToImgBB, generateReceiptPdf, generateComprehensivePdf, generateProductionOrderPdf, runDatabaseMigration } from '../utils.js';

/**
 * Coleta os dados do formulário do pedido.
 */
function collectFormData(UI) {
    const paymentList = UI.getPaymentList ? UI.getPaymentList() : [];
    const totalDownPayment = paymentList.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

    const paymentMethodValue = UI.DOM.paymentMethod ? UI.DOM.paymentMethod.value : '';

    const data = {
        clientName: UI.DOM.clientName.value, 
        clientPhone: UI.DOM.clientPhone.value, 
        orderStatus: UI.DOM.orderStatus.value,
        orderDate: UI.DOM.orderDate.value, 
        deliveryDate: UI.DOM.deliveryDate.value, 
        generalObservation: UI.DOM.generalObservation.value,
        parts: [], 
        downPayment: totalDownPayment, 
        discount: parseFloat(UI.DOM.discount.value) || 0,
        paymentMethod: paymentMethodValue, 
        mockupUrls: Array.from(UI.DOM.existingFilesContainer.querySelectorAll('a')).map(a => a.href),
        
        downPaymentDate: new Date().toISOString().split('T')[0], 
        paymentFinSource: 'banco',
        paymentFinStatus: 'pago'
    };
    
    // Coleta Peças
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

export function initializeOrderListeners(UI, deps) {

    const { getState, setState, getOptionsFromStorage, services, userCompanyName } = deps;

    // --- GATILHO SECRETO DE MIGRAÇÃO (SHIFT + Clique no Título) ---
    if (UI.DOM.modalTitle) {
        UI.DOM.modalTitle.addEventListener('click', (e) => {
            if (e.shiftKey) {
                runDatabaseMigration(UI.showInfoModal);
            }
        });
    }

    // Abertura do Modal de Novo Pedido
    UI.DOM.addOrderBtn.addEventListener('click', () => { 
        setState({ partCounter: 0 }); 
        UI.resetForm(); 
        UI.showOrderModal(); 
    });

    // --- SALVAR PEDIDO (Lógica Anti-Perda de Dados) ---
    UI.DOM.orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        UI.DOM.saveBtn.disabled = true; 
        UI.DOM.uploadIndicator.classList.remove('hidden');
        
        try {
            // 1. Upload de Imagens
            const files = UI.DOM.mockupFiles.files;
            const uploadPromises = Array.from(files).map(file => fileToBase64(file).then(uploadToImgBB));
            const newUrls = (await Promise.all(uploadPromises)).filter(Boolean);
            
            // 2. Coleta de Dados
            const orderData = collectFormData(UI); 
            orderData.mockupUrls.push(...newUrls);
            
            // Tratamento robusto do ID (remove espaços em branco invisíveis)
            let orderId = UI.DOM.orderId.value ? UI.DOM.orderId.value.trim() : '';
            
            if (orderId) {
                orderData.id = orderId;
            }

            // 3. Salvar no Banco (Com Fallback para "Pedido Fantasma")
            let savedOrderId;
            try {
                savedOrderId = await services.saveOrder(orderData, orderId);
            } catch (saveError) {
                // Se o erro for "No document to update", significa que o ID existe no formulário
                // mas o pedido foi apagado do banco. Para não perder os dados digitados,
                // salvamos como um NOVO pedido.
                if (saveError.message && saveError.message.includes("No document to update")) {
                    console.warn("Pedido original não encontrado (ID Fantasma). Salvando como novo...");
                    delete orderData.id; // Remove o ID antigo
                    savedOrderId = await services.saveOrder(orderData, null); // Força criar novo
                    UI.showInfoModal("Atenção: O pedido original não foi encontrado no banco (talvez excluído). Seus dados foram salvos em um NOVO pedido para evitar perdas.");
                } else {
                    throw saveError; // Se for outro erro, repassa pra frente
                }
            }
            
            // 4. Atualizar Finanças
            const clientName = orderData.clientName;
            const existingTransactions = services.getTransactionsByOrderId ? services.getTransactionsByOrderId(savedOrderId) : [];
            const newPaymentList = UI.getPaymentList ? UI.getPaymentList() : [];

            const idsInNewList = newPaymentList.map(p => p.id).filter(id => id);
            for (const existing of existingTransactions) {
                if (existing.category !== 'Quitação de Pedido' && !idsInNewList.includes(existing.id)) {
                    await services.deleteTransaction(existing.id);
                }
            }

            for (const payment of newPaymentList) {
                const transactionData = {
                    date: payment.date,
                    description: `Adiantamento Pedido - ${clientName}`,
                    amount: parseFloat(payment.amount),
                    type: 'income',
                    category: 'Adiantamento de Pedido',
                    source: payment.source,
                    status: 'pago',
                    orderId: savedOrderId
                };
                await services.saveTransaction(transactionData, payment.id);
            }

            UI.hideOrderModal();
            
            // 5. Pós-Salvar (Recibos)
            if (orderData.orderStatus === 'Finalizado' || orderData.orderStatus === 'Entregue') {
                const generate = await UI.showConfirmModal(
                    "Pedido salvo com sucesso! Deseja gerar o Recibo de Quitação e Entrega?", 
                    "Sim, gerar recibo", 
                    "Não, obrigado"
                );
                if (generate) {
                    const fullOrderData = { ...orderData, id: savedOrderId };
                    await generateReceiptPdf(fullOrderData, userCompanyName(), UI.showInfoModal);
                }
            } else {
                 if (!savedOrderId) UI.showInfoModal("Pedido salvo com sucesso!"); // Só mostra se não houve aviso de "Novo Pedido" antes
            }

        } catch (error) { 
            console.error("Erro ao salvar pedido:", error);
            UI.showInfoModal(`Erro crítico ao salvar: ${error.message || 'Verifique o console'}`); 
        } finally { 
            UI.DOM.saveBtn.disabled = false; 
            UI.DOM.uploadIndicator.classList.add('hidden'); 
        }
    });

    // --- LISTENERS DA GRID (Apenas Abertura/Edição/Exclusão) ---
    // Removemos daqui a lógica do botão Fechar e do Dropdown para evitar conflitos
    UI.DOM.ordersList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        
        // Se clicar no botão de fechar (caso ele estivesse aqui por engano)
        if (btn.id === 'closeViewBtn') return; // Ignora, pois é tratado no listener do ViewModal

        if (!id && !btn.id.includes('Pdf')) return;

        const order = id ? services.getOrderById(id) : null;

        if (btn.classList.contains('edit-btn') && order) {
            let { partCounter } = getState();
            partCounter = 0;
            const transactions = services.getTransactionsByOrderId ? services.getTransactionsByOrderId(id) : [];
            const downPayments = transactions.filter(t => t.category === 'Adiantamento de Pedido');
            partCounter = UI.populateFormForEdit(order, partCounter);
            if (UI.setPaymentList) {
                UI.setPaymentList(downPayments);
            }
            setState({ partCounter });
            UI.showOrderModal();
            
        } else if (btn.classList.contains('replicate-btn') && order) {
            let { partCounter } = getState();
            partCounter = 0;
            partCounter = UI.populateFormForEdit(order, partCounter);
            setState({ partCounter });
            UI.DOM.orderId.value = ''; 
            UI.DOM.modalTitle.textContent = 'Novo Pedido (Replicado)';
            UI.DOM.orderStatus.value = 'Pendente'; 
            UI.DOM.orderDate.value = new Date().toISOString().split('T')[0];
            UI.DOM.deliveryDate.value = ''; 
            UI.DOM.discount.value = ''; 
            UI.updateFinancials();
            if (UI.setPaymentList) UI.setPaymentList([]);
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
        } else if (btn.classList.contains('view-btn') && order) {
            UI.viewOrder(order);
            UI.showViewModal();
            
        } else if (btn.classList.contains('settle-and-deliver-btn') && order) {
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

                const updatedOrderData = { ...order, id: id };
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
                            await generateReceiptPdf(updatedOrderData, userCompanyName(), UI.showInfoModal);
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
                            await generateReceiptPdf(updatedOrderData, userCompanyName(), UI.showInfoModal);
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao quitar e entregar pedido:", error);
                UI.showInfoModal("Ocorreu um erro ao atualizar o pedido.");
            }
        }
    });

    // --- LISTENER DO MODAL DE DETALHES (View/Visualizar) ---
    // AQUI ficam os botões internos do modal de visualização (Fechar, Dropdown, PDFs)
    UI.DOM.viewModal.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        
        // 1. Botão FECHAR (X) - MOVIDO PARA CÁ
        if (btn && btn.id === 'closeViewBtn') { 
            UI.hideViewModal();
            UI.DOM.viewModal.innerHTML = ''; 
            return;
        }

        // 2. Lógica do Dropdown (Documentos)
        if (btn && btn.id === 'documentsBtn') {
            e.stopPropagation(); 
            const menu = UI.DOM.viewModal.querySelector('#documentsMenu');
            if(menu) menu.classList.toggle('hidden');
            return; 
        }

        // Fecha menu se clicar fora do botão de documentos
        const menu = UI.DOM.viewModal.querySelector('#documentsMenu');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }

        if (!btn) return;
        
        // Ações de PDF e WhatsApp
        if (btn.id === 'comprehensivePdfBtn') {
            generateComprehensivePdf(btn.dataset.id, services.getAllOrders(), userCompanyName(), UI.showInfoModal);
        }
        
        if (btn.id === 'productionPdfBtn') {
            generateProductionOrderPdf(btn.dataset.id, services.getAllOrders(), userCompanyName(), UI.showInfoModal);
        }

        if (btn.id === 'whatsappBtn') {
            const order = services.getOrderById(btn.dataset.id);
            if (!order || !order.clientPhone) {
                UI.showInfoModal("Este pedido não possui telefone cadastrado.");
                return;
            }

            let phone = order.clientPhone.replace(/\D/g, '');
            if (phone.length <= 11) phone = '55' + phone;

            const company = userCompanyName(); 
            const firstName = order.clientName.split(' ')[0]; 

            const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            const approvalLink = `${baseUrl}/aprovacao.html?id=${order.id}`;

            const message = `Olá ${firstName}, aqui é da ${company}. Segue o link para conferência e aprovação do layout do seu pedido: ${approvalLink} . Por favor, confira os nomes e tamanhos. Qualquer dúvida, estou à disposição!`;

            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            
            const link = document.createElement('a');
            link.href = url;
            link.target = 'whatsapp_tab'; 
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // --- LISTENER GLOBAL DE TECLAS (ESC) ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Prioridade: Fecha ViewModal primeiro, depois OrderModal
            const viewModalOpen = UI.DOM.viewModal && !UI.DOM.viewModal.classList.contains('hidden');
            const orderModalOpen = UI.DOM.orderModal && !UI.DOM.orderModal.classList.contains('hidden');

            if (viewModalOpen) {
                UI.hideViewModal();
                UI.DOM.viewModal.innerHTML = '';
            } else if (orderModalOpen) {
                UI.hideOrderModal();
            }
        }
    });

    // Listeners menores
    UI.DOM.cancelBtn.addEventListener('click', () => UI.hideOrderModal());
    
    UI.DOM.addPartBtn.addEventListener('click', () => { 
        let { partCounter } = getState();
        partCounter++; 
        UI.addPart({}, partCounter); 
        setState({ partCounter });
    });
    
    UI.DOM.discount.addEventListener('input', UI.updateFinancials);

    UI.DOM.clientPhone.addEventListener('input', (e) => {
     e.target.value = UI.formatPhoneNumber(e.target.value);
    });

    UI.DOM.orderModal.addEventListener('click', (e) => {
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
        if (sourceBtn) {
            UI.updateSourceSelectionUI(UI.DOM.downPaymentSourceContainer, sourceBtn.dataset.source);
        }
    });
}
