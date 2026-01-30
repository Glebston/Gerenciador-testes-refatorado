// js/listeners/catalogListeners.js
// ========================================================
// OUVINTES DO CATÁLOGO (O MAESTRO)
// Responsabilidade: Conectar DOM + Service + Renderer
// ========================================================

import { auth } from "../firebaseConfig.js";
import * as CatalogService from "../services/catalogService.js";
import { renderCatalogUI } from "../ui/catalogRenderer.js";

const DOM = {
    // Navegação e Views
    menuBtn: document.getElementById('catalogDashboardBtn'),
    catalogView: document.getElementById('catalogDashboard'),
    ordersView: document.getElementById('ordersDashboard'),
    financeView: document.getElementById('financeDashboard'),
    searchContainer: document.getElementById('searchContainer'),
    
    // Modal
    modal: document.getElementById('catalogModal'),
    form: document.getElementById('catalogForm'),
    saveBtn: document.getElementById('saveCatalogBtn'),
    cancelBtn: document.getElementById('cancelCatalogBtn'),
    closeXBtn: document.getElementById('closeCatalogModalBtn'),
    openModalBtn: document.getElementById('addCatalogItemBtn'),

    // Inputs do Formulário
    itemId: document.getElementById('catalogItemId'),
    title: document.getElementById('catalogTitle'),
    category: document.getElementById('catalogCategory'),
    price: document.getElementById('catalogPrice'),
    description: document.getElementById('catalogDescription'),
    imageInput: document.getElementById('catalogImageInput'),
    imagePreview: document.getElementById('catalogImagePreview'),
    imagePlaceholder: document.getElementById('catalogImagePlaceholder'),
    uploadLoader: document.getElementById('catalogUploadLoader'),

    // Lista
    list: document.getElementById('catalogList')
};

let currentCompanyId = null;
let tempImageUrl = ""; // Armazena URL temporária durante edição

export function initCatalogListeners() {
    
    // 1. Navegação: Trocar para o Catálogo
    if (DOM.menuBtn) {
        
        // --- TRAVA DE SEGURANÇA PREMIUM ---
        const userPlan = localStorage.getItem('userPlan');
        
        // No seu sistema: 'pro' = PREMIUM | 'essencial' = PRO
        // Só remove o 'hidden' se o plano for 'pro' (Premium)
        if (userPlan === 'pro') {
            DOM.menuBtn.classList.remove('hidden'); 
        }
        // ----------------------------------

        DOM.menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;
            
            // Define ID da empresa (assumindo user.uid para MVP, ajustável para user_mappings)
            currentCompanyId = user.uid; 
            
            switchViewToCatalog();
            loadCatalogData();
        });
    }

    // 2. Abrir Modal (Novo Item)
    if (DOM.openModalBtn) {
        DOM.openModalBtn.addEventListener('click', () => {
            openModal(); // Modo Criação (limpo)
        });
    }

    // 3. Fechar Modal
    if (DOM.cancelBtn) DOM.cancelBtn.addEventListener('click', closeModal);
    if (DOM.closeXBtn) DOM.closeXBtn.addEventListener('click', closeModal);

    // 4. Preview de Imagem
    if (DOM.imageInput) {
        DOM.imageInput.addEventListener('change', handleImageSelect);
    }

    // 5. Salvar (Criar ou Editar)
    if (DOM.saveBtn) {
        DOM.saveBtn.addEventListener('click', handleSave);
    }

    // 6. Ações da Lista (Event Delegation: Editar, Excluir, Toggle)
    if (DOM.list) {
        DOM.list.addEventListener('click', handleListActions);
        DOM.list.addEventListener('change', handleListChanges); // Para o Toggle Switch
    }
}

// --- FUNÇÕES DE NAVEGAÇÃO ---

function switchViewToCatalog() {
    // Esconde tudo
    if(DOM.ordersView) DOM.ordersView.classList.add('hidden');
    if(DOM.financeView) DOM.financeView.classList.add('hidden');
    if(DOM.searchContainer) DOM.searchContainer.classList.add('hidden');
    
    // Mostra Catálogo
    DOM.catalogView.classList.remove('hidden');
    
    // Feedback visual no menu (Opcional: fechar dropdown se necessário)
    document.getElementById('userDropdown').classList.add('hidden');
}

async function loadCatalogData() {
    if (!currentCompanyId) return;
    
    try {
        const data = await CatalogService.getCatalogItems(currentCompanyId);
        renderCatalogUI(data, currentCompanyId);
    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
        DOM.list.innerHTML = `<p class="text-red-500 text-center col-span-full">Erro ao carregar dados.</p>`;
    }
}

// --- FUNÇÕES DO MODAL ---

function openModal(item = null) {
    DOM.modal.classList.remove('hidden');
    
    // Reseta estado
    DOM.saveBtn.disabled = false;
    DOM.saveBtn.textContent = "Salvar Produto";
    DOM.uploadLoader.classList.add('hidden');

    if (item) {
        // MODO EDIÇÃO
        DOM.itemId.value = item.id;
        DOM.title.value = item.title;
        DOM.category.value = item.category;
        DOM.price.value = item.price;
        DOM.description.value = item.description;
        
        // Configura Imagem Existente
        tempImageUrl = item.imageUrl;
        DOM.imagePreview.src = item.imageUrl;
        DOM.imagePreview.classList.remove('hidden');
        DOM.imagePlaceholder.classList.add('hidden');
    } else {
        // MODO CRIAÇÃO
        DOM.form.reset();
        DOM.itemId.value = "";
        tempImageUrl = "";
        DOM.imagePreview.src = "";
        DOM.imagePreview.classList.add('hidden');
        DOM.imagePlaceholder.classList.remove('hidden');
    }
}

function closeModal() {
    DOM.modal.classList.add('hidden');
}

// --- LÓGICA DE UPLOAD E SALVAMENTO ---

async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview Local Imediato
    const reader = new FileReader();
    reader.onload = (ev) => {
        DOM.imagePreview.src = ev.target.result;
        DOM.imagePreview.classList.remove('hidden');
        DOM.imagePlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

async function handleSave(e) {
    e.preventDefault();
    
    const title = DOM.title.value.trim();
    if (!title) {
        alert("Por favor, informe o título do produto.");
        return;
    }

    const file = DOM.imageInput.files[0];
    const isEditing = !!DOM.itemId.value;

    // Validação: Criação exige imagem
    if (!isEditing && !file) {
        alert("A imagem do produto é obrigatória.");
        return;
    }

    // Bloqueia botão
    const originalText = DOM.saveBtn.textContent;
    DOM.saveBtn.disabled = true;
    DOM.saveBtn.textContent = "Salvando...";
    DOM.uploadLoader.classList.remove('hidden');

    try {
        let finalImageUrl = tempImageUrl;

        // Se tem arquivo novo, faz upload
        if (file) {
            finalImageUrl = await CatalogService.uploadCatalogImage(file);
        }

        const itemData = {
            companyId: currentCompanyId, // Passado para o serviço validar user
            title: title,
            category: DOM.category.value.trim(),
            price: DOM.price.value.trim(),
            description: DOM.description.value.trim(),
            imageUrl: finalImageUrl
        };

        if (isEditing) {
            // Atualiza (merge)
            await CatalogService.updateCatalogItem(DOM.itemId.value, itemData, currentCompanyId);
        } else {
            // Cria Novo
            await CatalogService.addCatalogItem(itemData);
        }

        closeModal();
        await loadCatalogData(); // Recarrega lista

    } catch (error) {
        alert("Erro: " + error.message);
    } finally {
        DOM.saveBtn.disabled = false;
        DOM.saveBtn.textContent = originalText;
        DOM.uploadLoader.classList.add('hidden');
    }
}

// --- AÇÕES DA LISTA (DELEGATION) ---

async function handleListActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;

    if (action === 'deleteItem') {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            try {
                await CatalogService.deleteCatalogItem(id, currentCompanyId);
                await loadCatalogData();
            } catch (error) {
                alert("Erro ao excluir: " + error.message);
            }
        }
    }

    if (action === 'editItem') {
        // Busca dados atuais do DOM ou recarrega do banco? 
        // Para eficiência, vamos buscar do banco rapidinho ou filtrar da lista atual se tivéssemos salvo em memória.
        // Como o Firestore cacheia, getDoc é rápido.
        // SIMPLIFICAÇÃO: Vamos pegar do array retornado no loadCatalogData se o tornarmos global, 
        // mas para manter stateless, vamos fazer um "fetch" rápido ou reconstruir do card (arriscado).
        // MELHOR: Vamos pegar do banco.
        
        // *Nota: Para MVP, vamos assumir que o serviço tem um método getItem ou vamos passar os dados via data-attributes no renderer.
        // Como não criamos getItem no Service, vamos adicionar logicamente aqui a busca na lista renderizada? Não, muito complexo.
        // Vamos apenas recarregar a lista e filtrar. É rápido.
        const result = await CatalogService.getCatalogItems(currentCompanyId);
        const item = result.items.find(i => i.id === id);
        if (item) openModal(item);
    }
}

async function handleListChanges(e) {
    // Para o Toggle Switch (Checkbox)
    const toggle = e.target;
    if (toggle.type === 'checkbox' && toggle.dataset.action === 'toggleStatus') {
        const id = toggle.dataset.id;
        const newStatus = toggle.checked;

        try {
            await CatalogService.toggleItemStatus(id, newStatus, currentCompanyId);
            // Atualiza contadores sem recarregar tudo visualmente (opcional), 
            // mas vamos recarregar para garantir consistência dos contadores de limite.
            await loadCatalogData(); 
        } catch (error) {
            alert(error.message); // Exibe erro da Regra dos 20
            toggle.checked = !newStatus; // Reverte visualmente
        }
    }
}
