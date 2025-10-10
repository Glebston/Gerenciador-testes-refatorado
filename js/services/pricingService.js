import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, writeBatch, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';
import { DOM, showInfoModal, showConfirmModal } from '../ui.js';

// --- Variáveis de Estado do Módulo ---
let allPricingItems = [];
let pricingCollection = null;

/**
 * Inicializa o serviço de tabela de preços.
 * @param {string} companyId - O ID da empresa do usuário.
 */
export function initializePricingService(companyId) {
    pricingCollection = collection(db, `companies/${companyId}/pricing`);
    setupPricingListener();
}

/**
 * Configura o listener do Firestore para a coleção de preços.
 */
function setupPricingListener() {
    if (!pricingCollection) return;
    const q = query(pricingCollection, orderBy("createdAt", "asc"));
    onSnapshot(q, (snapshot) => {
        allPricingItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, (error) => {
        console.error("Erro ao carregar tabela de preços:", error);
        showInfoModal("Não foi possível carregar a tabela de preços.");
    });
}

/**
 * Abre o modal da tabela de preços na visão padrão.
 */
export function openPriceTable() {
    renderPriceTable('view');
    DOM.priceTableModal.classList.remove('hidden');
}

/**
 * Renderiza o conteúdo do modal da tabela de preços.
 * @param {string} mode - 'view' ou 'edit'.
 */
export function renderPriceTable(mode = 'view') {
    const isEditMode = mode === 'edit';
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
        </table>`;
    DOM.priceTableContainer.innerHTML = tableHTML;
    const tableBody = DOM.priceTableContainer.querySelector('#priceTableBody');
    
    if (allPricingItems.length === 0 && !isEditMode) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-6 text-gray-500">Nenhum item na tabela de preços. Clique em "Editar" para adicionar.</td></tr>`;
    } else {
        allPricingItems.forEach(item => {
            tableBody.appendChild(createPriceTableRow(item, mode));
        });
    }
    
    // Controla a visibilidade dos botões do footer
    DOM.editPriceTableBtn.classList.toggle('hidden', isEditMode);
    DOM.closePriceTableBtn.classList.toggle('hidden', isEditMode);
    DOM.priceTableEditMessage.classList.toggle('hidden', !isEditMode);
    DOM.savePriceTableBtn.classList.toggle('hidden', !isEditMode);
    DOM.cancelPriceTableBtn.classList.toggle('hidden', !isEditMode);
    DOM.addPriceItemBtn.classList.toggle('hidden', !isEditMode);
}

/**
 * Cria uma linha (<tr>) para a tabela de preços.
 * @param {object} item - O objeto do item de preço.
 * @param {string} mode - 'view' ou 'edit'.
 * @returns {HTMLElement} O elemento <tr> criado.
 */
function createPriceTableRow(item, mode) {
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
}

/**
 * Adiciona uma nova linha em branco no modo de edição da tabela.
 */
export function addPriceItem() {
    const newId = `new-${Date.now()}`;
    const newItem = { id: newId, name: '', description: '', price: 0 };
    const newRow = createPriceTableRow(newItem, 'edit');
    DOM.priceTableContainer.querySelector('#priceTableBody').appendChild(newRow);
}

/**
 * Deleta um item da tabela de preços.
 * @param {string} id - O ID do item a ser deletado.
 */
export async function deletePriceItem(id) {
    if (id.startsWith('new-')) { // Item ainda não salvo, apenas remove do DOM
        DOM.priceTableContainer.querySelector(`tr[data-id='${id}']`)?.remove();
        return;
    }

    const confirmed = await showConfirmModal("Tem certeza que deseja excluir este item? Esta ação será permanente.", "Excluir", "Cancelar");
    if (confirmed) {
        try {
            await deleteDoc(doc(pricingCollection, id));
            // O listener do Firestore cuidará de re-renderizar a tabela
        } catch (error) {
            console.error("Erro ao deletar item de preço:", error);
            showInfoModal("Não foi possível excluir o item.");
        }
    }
}

/**
 * Salva todas as alterações feitas na tabela de preços.
 */
export async function savePriceTable() {
    const batch = writeBatch(db);
    let hasChanges = false;
    const tableRows = DOM.priceTableContainer.querySelectorAll('#priceTableBody tr');
    
    for (const row of tableRows) {
        const id = row.dataset.id;
        const name = row.querySelector('.price-item-name').value.trim();
        const description = row.querySelector('.price-item-desc').value.trim();
        const price = parseFloat(row.querySelector('.price-item-price').value) || 0;

        if (!name) continue;

        if (id.startsWith('new-')) {
            const newDocRef = doc(pricingCollection);
            batch.set(newDocRef, { name, description, price, createdAt: serverTimestamp() });
            hasChanges = true;
        } else {
            const originalItem = allPricingItems.find(i => i.id === id);
            if (originalItem && (originalItem.name !== name || originalItem.description !== description || originalItem.price !== price)) {
                const docRef = doc(pricingCollection, id);
                batch.update(docRef, { name, description, price });
                hasChanges = true;
            }
        }
    }

    try {
        if (hasChanges) {
            await batch.commit();
            showInfoModal("Tabela de preços salva com sucesso!");
        }
        renderPriceTable('view');
    } catch (error) {
        console.error("Erro ao salvar tabela de preços:", error);
        showInfoModal("Ocorreu um erro ao salvar as alterações.");
    }
}