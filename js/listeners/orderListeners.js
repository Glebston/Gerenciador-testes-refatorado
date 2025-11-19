// js/ui/orderRenderer.js
import { DOM, SIZES_ORDER } from './dom.js';

// =============================================================================
// HELPERS INTERNOS
// =============================================================================

const getStatusColor = (status) => {
    const map = {
        'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Em Produção': 'bg-blue-100 text-blue-800 border-blue-200',
        'Acabamento': 'bg-purple-100 text-purple-800 border-purple-200',
        'Finalizado': 'bg-green-100 text-green-800 border-green-200',
        'Entregue': 'bg-gray-100 text-gray-600 border-gray-200 line-through'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
};

const countTotalParts = (parts) => {
    if (!parts || !Array.isArray(parts)) return 0;
    return parts.reduce((acc, p) => {
        let qty = 0;
        // Soma tamanhos padrão
        if (p.sizes) {
            Object.values(p.sizes).forEach(cat => {
                Object.values(cat).forEach(q => qty += (parseInt(q) || 0));
            });
        }
        // Soma tamanhos específicos e detalhados
        if (p.specifics) qty += p.specifics.length;
        if (p.details) qty += p.details.length;
        return acc + qty;
    }, 0);
};

// =============================================================================
// FUNÇÕES DE RENDERIZAÇÃO DE CARD
// =============================================================================

const createOrderCard = (order) => {
    const card = document.createElement('div');
    card.className = `bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all duration-200 relative group ${getStatusColor(order.orderStatus).replace('bg-', 'border-').split(' ')[2]}`;
    
    // Determina se mostra o botão de deletar (apenas se não estiver entregue/finalizado para segurança básica visual)
    // (A lógica real de permissão fica no listener)
    const deleteBtnHTML = `
        <button data-id="${order.id}" class="delete-btn absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir Pedido">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    `;

    // Formata data de entrega
    let deliveryDisplay = '<span class="text-gray-400 text-xs">Sem data</span>';
    if (order.deliveryDate) {
        const [y, m, d] = order.deliveryDate.split('-');
        const deliveryDateObj = new Date(y, m - 1, d);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let colorClass = 'text-gray-500';
        if (order.orderStatus !== 'Entregue' && order.orderStatus !== 'Finalizado') {
             if (deliveryDateObj < today) colorClass = 'text-red-600 font-bold'; // Atrasado
             else if (deliveryDateObj.getTime() === today.getTime()) colorClass = 'text-orange-500 font-bold'; // Hoje
        }
        deliveryDisplay = `<span class="${colorClass} text-xs flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            ${d}/${m}
        </span>`;
    }

    const totalParts = countTotalParts(order.parts);
    const statusBadge = `<span class="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(order.orderStatus)}">${order.orderStatus}</span>`;
    
    // Botão de ação principal (Quitar/Entregar ou Ver)
    let actionBtn = '';
    if (order.orderStatus !== 'Entregue') {
        actionBtn = `
            <button data-id="${order.id}" class="settle-and-deliver-btn flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                Entregar
            </button>
        `;
    }

    card.innerHTML = `
        ${deleteBtnHTML}
        <div class="flex justify-between items-start mb-2">
            <div class="flex flex-col">
                <span class="text-[10px] text-gray-400 font-mono">#${order.orderId || String(order.id).slice(0,6)}</span>
                <h3 class="font-bold text-gray-800 text-base leading-tight truncate w-40" title="${order.clientName}">${order.clientName}</h3>
            </div>
            ${statusBadge}
        </div>

        <div class="flex items-center gap-2 mb-3 text-sm text-gray-600">
             ${deliveryDisplay}
             <span class="text-gray-300">|</span>
             <span class="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" /></svg>
                ${totalParts} pçs
             </span>
        </div>

        <div class="flex gap-2 mt-3 border-t border-gray-100 pt-3">
            <button data-id="${order.id}" class="view-btn flex-1 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 py-1.5 rounded text-xs font-medium transition-colors">
                Ver Detalhes
            </button>
            <button data-id="${order.id}" class="edit-btn flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 py-1.5 rounded text-xs font-medium transition-colors">
                Editar
            </button>
            <button data-id="${order.id}" class="replicate-btn w-8 bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 rounded text-xs font-medium transition-colors flex items-center justify-center" title="Replicar Pedido">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            </button>
        </div>
        ${actionBtn ? `<div class="mt-2">${actionBtn}</div>` : ''}
    `;

    return card;
};

// =============================================================================
// FUNÇÃO PRINCIPAL EXPORTADA
// =============================================================================

export const renderOrders = (orders, viewType = 'pending') => {
    // BLINDAGEM DE ERRO (CORREÇÃO v5.7.57)
    // Verifica se os elementos do DOM existem antes de tentar manipulá-los.
    // Isso previne o erro "Cannot read properties of undefined (reading 'style')".
    
    if (!DOM.ordersList) {
        console.error("Elemento 'ordersList' não encontrado no DOM map.");
        return;
    }

    // 1. Controle de Visibilidade dos Dashboards
    if (DOM.ordersDashboard) DOM.ordersDashboard.classList.remove('hidden');
    if (DOM.financeDashboard) DOM.financeDashboard.classList.add('hidden');

    // 2. Controle do Botão de Alternância (Entregues vs Pendentes)
    if (DOM.toggleViewBtn) {
        if (viewType === 'delivered') {
            DOM.toggleViewBtn.textContent = 'Ver Pendentes';
            DOM.toggleViewBtn.classList.remove('bg-indigo-100', 'text-indigo-700');
            DOM.toggleViewBtn.classList.add('bg-gray-200', 'text-gray-700');
        } else {
            DOM.toggleViewBtn.textContent = 'Ver Entregues';
            DOM.toggleViewBtn.classList.add('bg-indigo-100', 'text-indigo-700');
            DOM.toggleViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
        }
    }

    // 3. Filtragem
    DOM.ordersList.innerHTML = ''; // Limpa a lista
    
    const filteredOrders = orders.filter(order => {
        if (viewType === 'delivered') {
            return order.orderStatus === 'Entregue';
        } else {
            return order.orderStatus !== 'Entregue';
        }
    });

    // 4. Ordenação (Data de Entrega mais próxima primeiro)
    filteredOrders.sort((a, b) => {
        // Trata nulos como "final da fila"
        if (!a.deliveryDate) return 1;
        if (!b.deliveryDate) return -1;
        return new Date(a.deliveryDate) - new Date(b.deliveryDate);
    });

    // 5. Renderização
    if (filteredOrders.length === 0) {
        DOM.ordersList.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="text-lg font-medium">Nenhum pedido ${viewType === 'delivered' ? 'entregue' : 'pendente'}.</p>
            </div>
        `;
    } else {
        filteredOrders.forEach(order => {
            const card = createOrderCard(order);
            DOM.ordersList.appendChild(card);
        });
    }
};

// =============================================================================
// MÓDULO DE VISUALIZAÇÃO (VIEW MODAL)
// =============================================================================

export const viewOrder = (order) => {
    if (!DOM.viewModal) return;

    // Monta HTML das peças
    let partsHTML = '';
    if (order.parts && order.parts.length > 0) {
        partsHTML = order.parts.map((part, index) => {
            let sizesHTML = '';
            
            // Tamanhos Comuns
            if (part.sizes) {
                const sizesEntries = [];
                SIZES_ORDER.forEach(size => {
                    // Verifica categorias padrão
                    ['masculino', 'feminino', 'infantil'].forEach(cat => {
                        if (part.sizes[cat] && part.sizes[cat][size]) {
                            sizesEntries.push(`${size} (${cat.charAt(0).toUpperCase()}): <strong>${part.sizes[cat][size]}</strong>`);
                        }
                    });
                });
                if(sizesEntries.length > 0) sizesHTML += `<div class="mb-1 text-sm text-gray-600">${sizesEntries.join(' | ')}</div>`;
            }
            
            // Específicos
            if (part.specifics && part.specifics.length > 0) {
                partsHTML += `<div class="mt-2 pl-2 border-l-2 border-yellow-200">`;
                part.specifics.forEach(spec => {
                    sizesHTML += `<div class="text-xs text-gray-500">Específico: ${spec.width || '?'}x${spec.height || '?'}cm ${spec.observation ? `(${spec.observation})` : ''}</div>`;
                });
                partsHTML += `</div>`;
            }

            // Detalhados (Numerados)
            if (part.details && part.details.length > 0) {
                 sizesHTML += `<div class="mt-1 flex flex-wrap gap-1">`;
                 part.details.forEach(det => {
                     sizesHTML += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        ${det.name} ${det.number ? `#${det.number}` : ''} (${det.size})
                     </span>`;
                 });
                 sizesHTML += `</div>`;
            }

            return `
                <div class="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div class="flex justify-between items-start mb-1">
                         <h4 class="font-bold text-gray-700">Item ${index + 1}: ${part.type}</h4>
                         <span class="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">${part.material} - ${part.colorMain}</span>
                    </div>
                    ${sizesHTML}
                </div>
            `;
        }).join('');
    } else {
        partsHTML = '<p class="text-gray-400 italic">Nenhuma peça registrada.</p>';
    }
    
    // Mockups
    let mockupsHTML = '';
    if (order.mockupUrls && order.mockupUrls.length > 0) {
        mockupsHTML = `
        <div class="mb-6">
            <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Arquivos de Mockup</h4>
            <div class="flex flex-wrap gap-2">
                ${order.mockupUrls.map(url => `
                    <a href="${url}" target="_blank" class="block w-20 h-20 rounded overflow-hidden border border-gray-200 hover:border-indigo-500 transition-colors relative group">
                        <img src="${url}" class="w-full h-full object-cover" alt="Mockup">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>`;
    }

    // Renderiza Modal
    DOM.viewModal.innerHTML = `
        <div class="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl relative">
            <div class="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">Pedido #${order.orderId || '---'}</h2>
                    <p class="text-sm text-gray-500">${order.clientName}</p>
                </div>
                <button id="closeViewBtn" class="text-gray-400 hover:text-gray-600 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div class="p-6">
                <div class="flex flex-wrap gap-4 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    <div>
                        <span class="block text-gray-400 text-xs uppercase">Status</span>
                        <span class="font-bold ${getStatusColor(order.orderStatus).split(' ')[1]}">${order.orderStatus}</span>
                    </div>
                    <div>
                        <span class="block text-gray-400 text-xs uppercase">Entrega</span>
                        <span class="font-bold text-gray-700">${order.deliveryDate ? order.deliveryDate.split('-').reverse().join('/') : '---'}</span>
                    </div>
                     <div>
                        <span class="block text-gray-400 text-xs uppercase">Financeiro</span>
                        <span class="font-bold text-gray-700">${(order.downPayment >= (order.total || 0)) ? 'Pago' : 'Pendente'}</span>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1">Itens do Pedido</h3>
                    ${partsHTML}
                </div>

                ${order.generalObservation ? `
                <div class="mb-6 bg-yellow-50 p-3 rounded border border-yellow-100">
                    <h4 class="text-xs font-bold text-yellow-700 uppercase mb-1">Observações Gerais</h4>
                    <p class="text-sm text-yellow-800 whitespace-pre-line">${order.generalObservation}</p>
                </div>` : ''}

                ${mockupsHTML}

            </div>

            <div class="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button id="comprehensivePdfBtn" data-id="${order.id}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Gerar PDF Completo
                </button>
            </div>
        </div>
    `;
    
    DOM.viewModal.classList.remove('hidden');
    DOM.viewModal.classList.add('flex');
};

export const hideViewModal = () => {
    if (!DOM.viewModal) return;
    DOM.viewModal.classList.add('hidden');
    DOM.viewModal.classList.remove('flex');
    DOM.viewModal.innerHTML = ''; // Limpa memória
};
