import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db, auth } from '../firebaseConfig.js';
import { DOM, showInfoModal, showConfirmModal } from '../ui.js';
import { getDeliveryCountdown, sortSizes, uploadToImgBB } from '../utils.js';

// --- Variáveis de Estado do Módulo ---
let allOrders = [];
let partCounter = 0;
let currentOrdersView = 'pending'; // 'pending' ou 'delivered'
let dbCollection = null; // Referência para a coleção de pedidos no Firestore
let userCompanyName = ''; // Nome da empresa para os PDFs

/**
 * Inicializa o serviço de pedidos, configurando a referência do banco de dados e o listener.
 */
export function initializeOrderService(companyId, companyName) {
    dbCollection = collection(db, `companies/${companyId}/orders`);
    userCompanyName = companyName;
    setupFirestoreListener();
}

/**
 * Retorna todos os pedidos atuais. Usado por outras partes do sistema (ex: backup).
 */
export function getOrders() {
    return allOrders;
}

/**
 * Configura o listener do Firestore para ouvir mudanças na coleção de pedidos em tempo real.
 */
function setupFirestoreListener() {
    if (!dbCollection) return;
    const q = query(dbCollection); // Pode adicionar orderBy aqui se necessário
    onSnapshot(q, (snapshot) => {
        allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOrders();
    }, (error) => {
        console.error("Erro ao buscar pedidos:", error);
        DOM.loadingIndicator.style.display = 'none';
        DOM.ordersList.innerHTML = '<p class="w-full text-center text-gray-500 col-span-full">Erro ao carregar pedidos.</p>';
    });
}

/**
 * Renderiza a lista de pedidos na tela de acordo com a visão selecionada (pendentes ou entregues).
 */
function renderOrders() {
    if (document.getElementById('ordersDashboard').classList.contains('hidden')) return;

    DOM.loadingIndicator.style.display = 'none';
    DOM.ordersList.className = ''; // Limpa classes antigas

    if (currentOrdersView === 'pending') {
        DOM.ordersList.classList.add('kanban-board');
        const nonDeliveredOrders = allOrders.filter(o => o.orderStatus !== 'Entregue');
        
        if (nonDeliveredOrders.length === 0) {
            DOM.ordersList.innerHTML = '<div class="w-full text-center py-10 text-gray-500">Nenhum pedido pendente.</div>';
            return;
        }
        
        nonDeliveredOrders.sort((a, b) => new Date(a.deliveryDate || '9999-12-31') - new Date(b.deliveryDate || '9999-12-31'));
        
        const groupedOrders = nonDeliveredOrders.reduce((acc, order) => {
            const date = order.deliveryDate || 'Sem Data';
            if (!acc[date]) acc[date] = [];
            acc[date].push(order);
            return acc;
        }, {});

        let html = '';
        for (const date in groupedOrders) {
            const orders = groupedOrders[date];
            const formattedDate = date === 'Sem Data' 
                ? 'Sem Data de Entrega' 
                : new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            
            html += `
                <div class="kanban-column">
                    <h2 class="font-bold text-lg text-gray-700 mb-4 flex items-center">
                        ${formattedDate}
                        <span class="ml-2 text-sm font-medium bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">${orders.length}</span>
                    </h2>
                    <div class="space-y-4">${orders.map(order => generateOrderCardHTML(order, 'pending')).join('')}</div>
                </div>`;
        }
        DOM.ordersList.innerHTML = html;
    } else { // 'delivered'
        DOM.ordersList.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4', '2xl:grid-cols-5', 'gap-6');
        const deliveredOrders = allOrders.filter(o => o.orderStatus === 'Entregue');
        
        if (deliveredOrders.length === 0) {
            DOM.ordersList.innerHTML = '<p class="col-span-full text-center py-10 text-gray-500">Nenhum pedido entregue encontrado.</p>';
            return;
        }
        
        deliveredOrders.sort((a, b) => new Date(b.deliveryDate || 0) - new Date(a.deliveryDate || 0));
        DOM.ordersList.innerHTML = deliveredOrders.map(order => generateOrderCardHTML(order, 'delivered')).join('');
    }
}

/**
 * Gera o HTML para um único card de pedido.
 * @param {object} order - O objeto do pedido.
 * @param {string} viewType - 'pending' ou 'delivered'.
 * @returns {string} O HTML do card.
 */
function generateOrderCardHTML(order, viewType) {
    let totalValue = 0;
    (order.parts || []).forEach(p => {
        const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
        const specificQty = (p.specifics || []).length;
        const standardSub = standardQty * (p.unitPriceStandard || p.unitPrice || 0);
        const specificSub = specificQty * (p.unitPriceSpecific || p.unitPrice || 0);
        totalValue += standardSub + specificSub;
    });
    totalValue -= (order.discount || 0);

    const countdown = getDeliveryCountdown(order.deliveryDate);
    const countdownColorClasses = {
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        green: 'bg-green-100 text-green-800',
        gray: 'bg-gray-100 text-gray-800'
    };
    const formattedDeliveryDate = order.deliveryDate ? new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir';
    
    const buttonsHtml = viewType === 'pending'
        ? `<button data-id="${order.id}" class="edit-btn p-2 rounded-md text-gray-500 hover:bg-yellow-100 hover:text-yellow-700 transition-colors" title="Editar">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
           </button>`
        : `<button data-id="${order.id}" class="replicate-btn p-2 rounded-md text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors" title="Replicar">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a1 1 0 102 0V5h6a1 1 0 100-2H5z" /></svg>
           </button>`;

    return `
        <div class="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col space-y-3 transform hover:-translate-y-1">
            <div class="flex justify-between items-start">
                <h3 class="text-lg font-bold text-gray-800">${order.clientName}</h3>
                <span class="status-badge status-${order.orderStatus.replace(/\s/g, '-')}">${order.orderStatus}</span>
            </div>
            ${viewType === 'pending' ? `<div class="text-sm font-medium text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span class="ml-1.5">Entrega: <strong>${formattedDeliveryDate}</strong></span>
            </div>` : ''}
            <p class="text-sm text-gray-600">Total: <span class="font-semibold text-blue-600">R$ ${totalValue.toFixed(2)}</span></p>
            ${viewType === 'pending' ? `<div class="text-sm font-semibold py-1 px-2 rounded-full text-center ${countdownColorClasses[countdown.color]}">${countdown.text}</div>` : ''}
            <div class="flex space-x-2 items-center pt-3 border-t border-gray-100 mt-auto">
                <button data-id="${order.id}" class="view-btn flex-1 bg-gray-100 text-gray-700 font-semibold py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors">Detalhes</button>
                ${buttonsHtml}
                <button data-id="${order.id}" class="delete-btn p-2 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                </button>
            </div>
        </div>`;
}
// ... Continuação de js/services/orderService.js ...

/**
 * Limpa o formulário de pedido e o prepara para uma nova entrada.
 */
function resetForm() {
    DOM.orderForm.reset();
    DOM.orderId.value = '';
    DOM.modalTitle.textContent = 'Novo Pedido';
    DOM.partsContainer.innerHTML = '';
    DOM.financialsContainer.innerHTML = '';
    DOM.existingFilesContainer.innerHTML = '';
    partCounter = 0;
    DOM.orderDate.value = new Date().toISOString().split('T')[0];
    updateFinancials();
}

/**
 * Abre o modal de pedido para um novo pedido.
 */
export function resetAndShowOrderForm() {
    resetForm();
    DOM.orderModal.classList.remove('hidden');
}

/**
 * Adiciona uma nova seção de "peça" ao formulário de pedido.
 * @param {object} partData - Dados para preencher a nova peça (usado ao editar/replicar).
 */
export function addPart(partData = {}) {
    partCounter++;
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
    partItem.querySelectorAll('.manage-options-btn').forEach(btn => btn.addEventListener('click', (e) => {
        // Esta função será conectada no main.js
        const event = new CustomEvent('openoptions', { detail: { type: e.target.dataset.type } });
        window.dispatchEvent(event);
    }));
    partItem.querySelectorAll('.part-type-selector').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newType = e.target.dataset.type;
            partItem.dataset.partType = newType;
            addContentToPart(partItem, {});
            renderFinancialSection();
        });
    });
}

/**
 * Adiciona o conteúdo específico (comum ou detalhado) a uma seção de peça.
 * @param {HTMLElement} partItem - O elemento da peça.
 * @param {object} partData - Os dados da peça.
 */
function addContentToPart(partItem, partData = {}) {
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
}

/**
 * Coleta todos os dados do formulário de pedido e os monta em um objeto.
 * @returns {object} O objeto de dados do pedido.
 */
function collectFormData() {
    const orderData = {
        clientName: DOM.clientName.value,
        clientPhone: DOM.clientPhone.value,
        orderStatus: DOM.orderStatus.value,
        orderDate: DOM.orderDate.value,
        deliveryDate: DOM.deliveryDate.value,
        generalObservation: DOM.generalObservation.value,
        parts: [],
        downPayment: parseFloat(DOM.downPayment.value) || 0,
        discount: parseFloat(DOM.discount.value) || 0,
        paymentMethod: DOM.paymentMethod.value,
        mockupUrls: Array.from(DOM.existingFilesContainer.querySelectorAll('a')).map(a => a.href)
    };
    
    DOM.partsContainer.querySelectorAll('.part-item').forEach(pItem => {
        const partId = pItem.dataset.partId;
        const part = {
            type: pItem.querySelector('.part-type').value,
            material: pItem.querySelector('.part-material').value,
            colorMain: pItem.querySelector('.part-color-main').value,
            partInputType: pItem.dataset.partType,
            sizes: {}, details: [], specifics: [],
            unitPriceStandard: 0, unitPriceSpecific: 0, unitPrice: 0
        };

        if (part.partInputType === 'comum') {
            pItem.querySelectorAll('.size-input').forEach(input => {
                if (input.value) {
                    const { category, size } = input.dataset;
                    if (!part.sizes[category]) part.sizes[category] = {};
                    part.sizes[category][size] = parseInt(input.value, 10);
                }
            });
            pItem.querySelectorAll('.specific-size-row').forEach(row => {
                const width = row.querySelector('.item-spec-width').value.trim();
                const height = row.querySelector('.item-spec-height').value.trim();
                const observation = row.querySelector('.item-spec-obs').value.trim();
                if (width || height || observation) {
                   part.specifics.push({ width, height, observation });
                }
            });
            const standardPriceRow = DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="standard"]`);
            if(standardPriceRow) part.unitPriceStandard = parseFloat(standardPriceRow.querySelector('.financial-price').value) || 0;
            
            const specificPriceRow = DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="specific"]`);
            if(specificPriceRow) part.unitPriceSpecific = parseFloat(specificPriceRow.querySelector('.financial-price').value) || 0;

        } else { // 'detalhado'
            pItem.querySelectorAll('.detailed-item-row').forEach(row => {
                const name = row.querySelector('.item-det-name').value;
                const size = row.querySelector('.item-det-size').value;
                const number = row.querySelector('.item-det-number').value;
                if (name || size || number) {
                    part.details.push({ name, size, number });
                }
            });
            const detailedPriceRow = DOM.financialsContainer.querySelector(`.financial-item[data-part-id="${partId}"][data-price-group="detailed"]`);
            if(detailedPriceRow) part.unitPrice = parseFloat(detailedPriceRow.querySelector('.financial-price').value) || 0;
        }
        orderData.parts.push(part);
    });
    return orderData;
}

/**
 * Salva um pedido novo ou atualiza um existente no Firestore.
 * @param {Event} e - O evento de submit do formulário.
 */
export async function saveOrder(e) {
    e.preventDefault();
    DOM.saveBtn.disabled = true;
    DOM.uploadIndicator.classList.remove('hidden');

    try {
        const files = DOM.mockupFiles.files;
        const uploadPromises = Array.from(files).map(file => uploadToImgBB(file));
        const newUrls = (await Promise.all(uploadPromises)).filter(Boolean);

        const orderData = collectFormData();
        orderData.mockupUrls.push(...newUrls);

        const orderId = DOM.orderId.value;
        const oldOrder = orderId ? allOrders.find(o => o.id === orderId) : null;
        
        if (orderId) {
            await updateDoc(doc(dbCollection, orderId), orderData);
        } else {
            await addDoc(dbCollection, orderData);
        }
        
        DOM.orderModal.classList.add('hidden');
        
        const newStatus = orderData.orderStatus;
        const oldStatus = oldOrder ? oldOrder.orderStatus : null;
        const isNowCompleted = (newStatus === 'Finalizado' || newStatus === 'Entregue');
        const wasNotCompletedBefore = (oldStatus !== 'Finalizado' && oldStatus !== 'Entregue');

        if (isNowCompleted && wasNotCompletedBefore) {
            const generateReceipt = await showConfirmModal("Pedido salvo! Deseja gerar um recibo de quitação?", "Sim, Gerar Recibo", "Não, Obrigado");
            if (generateReceipt) {
                generateReceiptPdf(orderData);
            }
        }

    } catch (error) {
        console.error("ERRO DETALHADO AO SALVAR:", error);
        showInfoModal('Erro ao salvar o pedido.');
    } finally {
        DOM.saveBtn.disabled = false;
        DOM.uploadIndicator.classList.add('hidden');
    }
}

/**
 * Preenche o formulário de pedido com os dados de um pedido existente para edição.
 * @param {string} orderId - O ID do pedido a ser editado.
 */
export function editOrder(orderId) {
    const orderData = allOrders.find(o => o.id === orderId);
    if (!orderData) return;

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

    (orderData.parts || []).forEach(addPart);
    
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
}

/**
 * Preenche o formulário para criar um novo pedido baseado em um existente.
 * @param {string} orderId - O ID do pedido a ser replicado.
 */
export function replicateOrder(orderId) {
    const orderData = allOrders.find(o => o.id === orderId);
    if (!orderData) return;
    
    editOrder(orderId); // Reutiliza a lógica de preenchimento do formulário
    
    // Sobrescreve campos para parecer um novo pedido
    DOM.orderId.value = '';
    DOM.modalTitle.textContent = 'Novo Pedido (Replicado)';
    DOM.orderStatus.value = 'Pendente';
    DOM.orderDate.value = new Date().toISOString().split('T')[0];
    DOM.deliveryDate.value = '';
    DOM.discount.value = '';
    updateFinancials();
}

/**
 * Deleta um pedido do Firestore após confirmação.
 * @param {string} id - O ID do pedido a ser deletado.
 */
export async function deleteOrder(id) {
    const confirmed = await showConfirmModal("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.", "Excluir", "Cancelar");
    if (confirmed) {
        try {
            await deleteDoc(doc(dbCollection, id));
            showInfoModal("Pedido excluído com sucesso.");
        } catch (error) {
            console.error("Erro ao excluir pedido:", error);
            showInfoModal("Não foi possível excluir o pedido.");
        }
    }
}

/**
 * Alterna a visão de pedidos entre 'pendentes' e 'entregues'.
 */
export function toggleOrdersView() {
    currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
    DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
    renderOrders();
}
// ... Continuação de js/services/orderService.js ...

// --- Funções da Seção Financeira do Formulário ---

/**
 * Cria uma linha na seção financeira do formulário de pedido.
 * @param {string} partId - ID da peça.
 * @param {string} name - Nome da peça.
 * @param {number} quantity - Quantidade de itens.
 * @param {string} priceGroup - 'standard', 'specific', ou 'detailed'.
 * @returns {HTMLElement} O elemento da linha financeira.
 */
function createFinancialRow(partId, name, quantity, priceGroup) {
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
}

/**
 * Renderiza toda a seção financeira no formulário com base nas peças adicionadas.
 */
function renderFinancialSection() {
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
                DOM.financialsContainer.appendChild(finRow);
            }
            if (specificQty > 0) {
                const finRow = createFinancialRow(partId, partName, specificQty, 'specific');
                DOM.financialsContainer.appendChild(finRow);
            }
        } else { // 'detalhado'
            const totalQty = partItem.querySelectorAll('.detailed-item-row').length;
            if (totalQty > 0) {
                const finRow = createFinancialRow(partId, partName, totalQty, 'detailed');
                DOM.financialsContainer.appendChild(finRow);
            }
        }
    });
    updateFinancials();
}

/**
 * Atualiza os cálculos totais (subtotal, total, restante) na seção financeira do formulário.
 */
function updateFinancials() {
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
}


// --- Funções de Visualização e PDF ---

/**
 * Exibe o modal com todos os detalhes de um pedido.
 * @param {string} orderId - O ID do pedido a ser visualizado.
 */
export function viewOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    let subTotal = 0;
    let partsHtml = (order.parts || []).map(p => {
        const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
        const specificQty = (p.specifics || []).length;
        const detailedQty = (p.details || []).length;

        const standardSub = standardQty * (p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0);
        const specificSub = specificQty * (p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0);
        const detailedSub = detailedQty * (p.unitPrice || 0);

        const partSubtotal = standardSub + specificSub + detailedSub;
        subTotal += partSubtotal;

        let itemsDetailHtml = '';
        if (p.partInputType === 'comum') {
            let standardSizesHtml = '';
            if (p.sizes && Object.keys(p.sizes).length > 0) {
                standardSizesHtml = Object.entries(p.sizes).map(([cat, sizes]) =>
                    `<strong>${cat}:</strong> ${sortSizes(sizes).map(([size, qty]) => `${size}(${qty})`).join(', ')}`
                ).join('<br>');
            }
            let specificSizesHtml = '';
            if (p.specifics && p.specifics.length > 0) {
                specificSizesHtml = '<br><strong>Específicos:</strong><br>' + p.specifics.map(s =>
                    `&nbsp;&nbsp;- L: ${s.width || 'N/A'}, A: ${s.height || 'N/A'} (${s.observation || 'Sem obs.'})`
                ).join('<br>');
            }
            if (standardSizesHtml || specificSizesHtml) {
                itemsDetailHtml = `<div class="text-xs text-gray-600 pl-2 mt-1">${standardSizesHtml}${specificSizesHtml}</div>`;
            }
        } else if (p.partInputType === 'detalhado' && p.details && p.details.length > 0) {
            itemsDetailHtml = '<div class="text-xs text-gray-600 pl-2 mt-1">' + p.details.map(d => `${d.name || ''} - ${d.size || ''} - ${d.number || ''}`).join('<br>') + '</div>';
        }

        let unitPriceHtml = '';
        if(p.partInputType === 'comum') {
            if(standardQty > 0) unitPriceHtml += `R$ ${(p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0).toFixed(2)} (Padrão)<br>`;
            if(specificQty > 0) unitPriceHtml += `R$ ${(p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0).toFixed(2)} (Específico)`;
        } else {
            unitPriceHtml = `R$ ${(p.unitPrice || 0).toFixed(2)}`;
        }

        return `
            <tr>
                <td class="py-1 px-2 border">${p.type}${itemsDetailHtml}</td>
                <td class="py-1 px-2 border">${p.material}</td>
                <td class="py-1 px-2 border">${p.colorMain}</td>
                <td class="py-1 px-2 border text-center">${standardQty + specificQty + detailedQty}</td>
                <td class="py-1 px-2 border text-right">${unitPriceHtml}</td>
                <td class="py-1 px-2 border text-right font-semibold">R$ ${partSubtotal.toFixed(2)}</td>
            </tr>`;
    }).join('');

    const discount = order.discount || 0;
    const grandTotal = subTotal - discount;
    const remaining = grandTotal - (order.downPayment || 0);

    const modalContent = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
            <div id="printable-details" class="p-8 pb-8 overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4">Detalhes do Pedido - ${order.clientName}</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                    <div><strong>Telefone:</strong> ${order.clientPhone || 'N/A'}</div>
                    <div><strong>Status:</strong> <span class="font-semibold">${order.orderStatus}</span></div>
                    <div><strong>Data do Pedido:</strong> ${order.orderDate ? new Date(order.orderDate + 'T00:00:00').toLocaleDateString('pt-br') : 'N/A'}</div>
                    <div><strong>Data de Entrega:</strong> ${order.deliveryDate ? new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-br') : 'N/A'}</div>
                </div>
                <h3 class="font-bold text-lg mt-4">Peças</h3>
                <table class="w-full text-left text-sm mt-2">
                    <thead><tr class="bg-gray-100"><th class="px-2 py-1">Tipo/Detalhes</th><th class="px-2 py-1">Material</th><th class="px-2 py-1">Cor</th><th class="px-2 py-1 text-center">Qtd</th><th class="px-2 py-1 text-right">V. Un.</th><th class="px-2 py-1 text-right">Subtotal</th></tr></thead>
                    <tbody>${partsHtml}</tbody>
                </table>
                <h3 class="font-bold text-lg mt-4">Observação Geral</h3>
                <p class="text-sm p-2 border rounded-md mt-2 min-h-[40px]">${order.generalObservation || 'Nenhuma.'}</p>
                <h3 class="font-bold text-lg mt-4">Financeiro</h3>
                <div class="grid grid-cols-2 gap-x-8 mt-2 border-t pt-4 text-sm">
                    <div><strong>Valor Bruto:</strong> R$ ${subTotal.toFixed(2)}</div>
                    <div><strong>Adiantamento:</strong> R$ ${(order.downPayment || 0).toFixed(2)}</div>
                    <div><strong>Desconto:</strong> R$ ${discount.toFixed(2)}</div>
                    <div><strong>Forma de Pagamento:</strong> ${order.paymentMethod || 'N/A'}</div>
                    <div class="mt-2 col-span-2 grid grid-cols-2 gap-x-8">
                        <div class="font-bold text-blue-600 text-lg"><strong>Valor Final:</strong> R$ ${grandTotal.toFixed(2)}</div>
                        <div class="font-bold text-red-600 text-lg"><strong>Resta Pagar:</strong> R$ ${remaining.toFixed(2)}</div>
                    </div>
                </div>
                <div id="mockupContainerView" class="pt-4 border-t mt-4">
                    <h3 class="font-bold text-lg">Arquivos</h3>
                    <div class="flex flex-wrap gap-4 mt-2">
                        ${(order.mockupUrls || []).map(url => `<a href="${url}" target="_blank"><img src="${url}" class="w-32 h-32 object-cover border rounded-md mockup-image"></a>`).join('') || 'Nenhum arquivo.'}
                    </div>
                </div>
            </div>
            <div class="p-4 bg-gray-100 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <button id="comprehensivePdfBtn" data-name="${order.clientName}" data-id="${order.id}" class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Gerar PDF do pedido</button>
                <button id="closeViewBtn" class="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg">Fechar</button>
            </div>
        </div>`;
    DOM.viewModal.innerHTML = modalContent;
    DOM.viewModal.classList.remove('hidden');
}

// ... Parte Final de js/services/orderService.js (Funções de PDF) ...

/**
 * Gera um PDF completo e detalhado do pedido.
 * @param {string} orderId - O ID do pedido.
 * @param {string} clientName - O nome do cliente.
 */
export async function generateComprehensivePdf(orderId, clientName) {
    showInfoModal("Iniciando geração do PDF...");
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showInfoModal("Erro: Pedido não encontrado.");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const A4_WIDTH = 210;
        const MARGIN = 15;
        const contentWidth = A4_WIDTH - MARGIN * 2;
        let yPosition = MARGIN;

        // --- CABEÇALHO ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(userCompanyName || 'Relatório de Pedido', A4_WIDTH / 2, yPosition, { align: 'center' });
        yPosition += 10;

        // --- DADOS DO CLIENTE ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Pedido - ${order.clientName}`, MARGIN, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const clientInfo = [
            [`Telefone:`, `${order.clientPhone || 'N/A'}`],
            [`Data do Pedido:`, `${order.orderDate ? new Date(order.orderDate + 'T00:00:00').toLocaleDateString('pt-br') : 'N/A'}`],
            [`Status:`, `${order.orderStatus}`],
            [`Data de Entrega:`, `${order.deliveryDate ? new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-br') : 'N/A'}`]
        ];
        doc.autoTable({
            body: clientInfo,
            startY: yPosition,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold' } },
            didDrawPage: (data) => { yPosition = data.cursor.y; }
        });
        yPosition = doc.autoTable.previous.finalY + 5;

        // --- TABELA DE PEÇAS ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Peças do Pedido', MARGIN, yPosition);
        yPosition += 6;

        const tableHead = [['Peça / Detalhes', 'Material', 'Cor', 'Qtd', 'V. Un.', 'Subtotal']];
        const tableBody = [];
        let subTotal = 0;

        (order.parts || []).forEach(p => {
            const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
            const specificQty = (p.specifics || []).length;
            const detailedQty = (p.details || []).length;
            const totalQty = standardQty + specificQty + detailedQty;

            const standardSub = standardQty * (p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0);
            const specificSub = specificQty * (p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0);
            const detailedSub = detailedQty * (p.unitPrice || 0);
            const partSubtotal = standardSub + specificSub + detailedSub;
            subTotal += partSubtotal;

            let detailsText = '';
            if (p.partInputType === 'comum') {
                if (p.sizes && Object.keys(p.sizes).length > 0) {
                    detailsText += Object.entries(p.sizes).map(([cat, sizes]) =>
                        `${cat}: ${sortSizes(sizes).map(([size, qty]) => `${size}(${qty})`).join(', ')}`
                    ).join('\n');
                }
                if (p.specifics && p.specifics.length > 0) {
                    detailsText += (detailsText ? '\n' : '') + 'Específicos:\n' + p.specifics.map(s =>
                        `- L:${s.width||'N/A'}, A:${s.height||'N/A'} (${s.observation||'Sem obs.'})`
                    ).join('\n');
                }
            } else if (p.partInputType === 'detalhado' && p.details && p.details.length > 0) {
                detailsText = p.details.map(d => `${d.name||''} - ${d.size||''} - ${d.number||''}`).join('\n');
            }
            
            let unitPriceText = '';
            if(p.partInputType === 'comum') {
                if(standardQty > 0) unitPriceText += `R$ ${(p.unitPriceStandard !== undefined ? p.unitPriceStandard : p.unitPrice || 0).toFixed(2)} (Padrão)\n`;
                if(specificQty > 0) unitPriceText += `R$ ${(p.unitPriceSpecific !== undefined ? p.unitPriceSpecific : p.unitPrice || 0).toFixed(2)} (Específico)`;
            } else {
                unitPriceText = `R$ ${(p.unitPrice || 0).toFixed(2)}`;
            }

            tableBody.push([
                { content: `${p.type}\n${detailsText}`, styles: { fontSize: 8 } },
                p.material,
                p.colorMain,
                totalQty,
                { content: unitPriceText.trim(), styles: { halign: 'right' } },
                { content: `R$ ${partSubtotal.toFixed(2)}`, styles: { halign: 'right' } }
            ]);
        });

        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: yPosition,
            theme: 'grid',
            headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 60 },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            },
            didDrawPage: (data) => { yPosition = data.cursor.y; }
        });
        yPosition = doc.autoTable.previous.finalY + 8;

        // --- OBSERVAÇÃO E FINANCEIRO ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Observação Geral', MARGIN, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(order.generalObservation || 'Nenhuma.', contentWidth);
        doc.text(obsLines, MARGIN, yPosition);
        yPosition += (obsLines.length * 4) + 8;

        const discount = order.discount || 0;
        const grandTotal = subTotal - discount;
        const remaining = grandTotal - (order.downPayment || 0);

        const financialDetails = [
            ['Valor Bruto:', `R$ ${subTotal.toFixed(2)}`],
            ['Desconto:', `R$ ${discount.toFixed(2)}`],
            ['Adiantamento:', `R$ ${(order.downPayment || 0).toFixed(2)}`],
            ['Forma de Pgto:', `${order.paymentMethod || 'N/A'}`],
            ['VALOR TOTAL:', `R$ ${grandTotal.toFixed(2)}`],
            ['RESTA PAGAR:', `R$ ${remaining.toFixed(2)}`]
        ];

        doc.autoTable({
            body: financialDetails,
            startY: yPosition,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1.5 },
            columnStyles: { 0: { fontStyle: 'bold' } },
            didParseCell: (data) => {
                if (data.row.index >= 4) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 12;
                }
            },
            didDrawPage: (data) => { yPosition = data.cursor.y; }
        });
        yPosition = doc.autoTable.previous.finalY;

        // --- IMAGENS ---
        if (order.mockupUrls && order.mockupUrls.length > 0) {
            yPosition += 10;
            if (yPosition > 250) { // Check se precisa de nova página
                doc.addPage();
                yPosition = MARGIN;
            }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Arquivos (Mockups)', MARGIN, yPosition);
            yPosition += 8;
            
            for (const url of order.mockupUrls) {
                try {
                    const imgData = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'Anonymous';
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/jpeg', 0.9));
                        };
                        img.onerror = (err) => reject(new Error(`Falha ao carregar imagem: ${url}`));
                        img.src = url;
                    });

                    const imgProps = doc.getImageProperties(imgData);
                    const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
                    
                    if (yPosition + imgHeight > 280) { // 297 (A4) - MARGIN
                        doc.addPage();
                        yPosition = MARGIN;
                    }
                    
                    doc.addImage(imgData, 'JPEG', MARGIN, yPosition, contentWidth, imgHeight);
                    yPosition += imgHeight + 5;

                } catch (imgError) {
                    console.error(imgError);
                    if (yPosition > 280) { doc.addPage(); yPosition = MARGIN; }
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    doc.text(`- Não foi possível carregar a imagem: ${url}`, MARGIN, yPosition);
                    yPosition += 5;
                    doc.setTextColor(0);
                }
            }
        }
        
        doc.save(`Pedido_${clientName.replace(/\s/g, '_')}.pdf`);
        showInfoModal("PDF gerado com sucesso!");

    } catch (error) {
        console.error("Erro ao gerar PDF programático:", error);
        showInfoModal("Ocorreu um erro inesperado ao gerar o PDF.");
    }
}

/**
 * Gera um PDF simples de recibo de quitação.
 * @param {object} orderData - O objeto de dados do pedido.
 */
export async function generateReceiptPdf(orderData) {
    let totalValue = 0;
    (orderData.parts || []).forEach(p => {
        const standardQty = Object.values(p.sizes || {}).flatMap(cat => Object.values(cat)).reduce((s, c) => s + c, 0);
        const specificQty = (p.specifics || []).length;
        const standardSub = standardQty * (p.unitPriceStandard || p.unitPrice || 0);
        const specificSub = specificQty * (p.unitPriceSpecific || p.unitPrice || 0);
        totalValue += standardSub + specificSub;
    });
    totalValue -= (orderData.discount || 0);

    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const companyUser = userCompanyName || (auth.currentUser ? auth.currentUser.email : 'Sua Empresa');

    const receiptHtml = `
        <div style="font-family: Arial, sans-serif; padding: 40px; border: 1px solid #eee; width: 700px; margin: auto; background-color: white;">
            <h1 style="text-align: center; font-size: 24px; margin-bottom: 40px; color: #333;">RECIBO DE QUITAÇÃO</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Recebemos de <strong>${orderData.clientName || ''}</strong>, a importância de 
                <strong>R$ ${totalValue.toFixed(2)}</strong>, referente à quitação total do pedido de 
                ${(orderData.parts[0]?.type || 'fardamento personalizado').toLowerCase()}.
            </p>
            <p style="font-size: 14px; color: #777; margin-top: 30px;">
                Declaramos que o valor acima foi integralmente recebido, não restando nenhum débito pendente referente a este pedido.
            </p>
            <p style="text-align: right; margin-top: 50px; font-size: 16px;">${today}</p>
            <div style="margin-top: 80px; text-align: center;">
                <div style="display: inline-block; border-top: 1px solid #333; width: 300px; padding-top: 8px; font-size: 14px;">
                    Assinatura ( ${companyUser} )
                </div>
            </div>
        </div>
    `;
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        await doc.html(receiptHtml, {
            callback: function (doc) {
                doc.save(`Recibo_${orderData.clientName.replace(/\s/g, '_')}.pdf`);
            },
            x: 5,
            y: 5,
            width: 200, 
            windowWidth: 700 
        });

    } catch (error) {
        console.error("Erro ao gerar PDF do Recibo:", error);
        showInfoModal("Não foi possível gerar o PDF do recibo.");
    }
}
// ... Final de js/services/orderService.js ...