import { DOM, CHECK_ICON_SVG } from './dom.js';

// =============================================================================
// FORMATADORES
// =============================================================================

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export const formatPhoneNumber = (v) => {
    if (!v) return '';
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
};

// =============================================================================
// MANIPULAÇÃO DE UI (Helpers)
// =============================================================================

/**
 * Atualiza o estilo do botão de Navegação (Financeiro vs Pedidos)
 * Esta era a função que faltava!
 */
export const updateNavButton = (currentView) => {
    const btn = DOM.financeDashboardBtn;
    if (!btn) return;

    if (currentView === 'finance') {
        // Estilo Ativo (Sólido)
        btn.classList.remove('bg-white', 'text-indigo-600', 'hover:bg-indigo-50');
        btn.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Voltar para Pedidos
        `;
    } else {
        // Estilo Inativo (Outline)
        btn.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
        btn.classList.add('bg-white', 'text-indigo-600', 'hover:bg-indigo-50');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gestão Financeira
        `;
    }
};

export const updateSourceSelectionUI = (container, selectedSource) => {
    if (!container) return;
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
        const source = btn.getAttribute('data-source');
        
        if (source === selectedSource) {
            btn.classList.remove('bg-slate-100', 'text-slate-600', 'border-slate-200');
            btn.classList.add('bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'ring-1', 'ring-indigo-200');
        } else {
            btn.classList.add('bg-slate-100', 'text-slate-600', 'border-slate-200');
            btn.classList.remove('bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'ring-1', 'ring-indigo-200');
        }
    });
};

export const populateDropdown = (selectElement, options) => {
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">Selecione...</option>';
    options.forEach(opt => {
        const option = document.createElement('option');
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        option.value = value;
        option.textContent = label;
        selectElement.appendChild(option);
    });
};

export const populateDatalists = (partTypes, materialTypes) => {
    const typeList = document.getElementById('part-type-list');
    const materialList = document.getElementById('part-material-list');

    if (typeList) {
        typeList.innerHTML = '';
        (partTypes || []).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            typeList.appendChild(option);
        });
    }

    if (materialList) {
        materialList.innerHTML = '';
        (materialTypes || []).forEach(material => {
            const option = document.createElement('option');
            option.value = material;
            materialList.appendChild(option);
        });
    }
};

// =============================================================================
// FEEDBACK AO USUÁRIO (TOASTS)
// =============================================================================

export const showFeedback = (message, type = 'success') => {
    const existingToast = document.getElementById('toast-feedback');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-feedback';
    
    const colors = type === 'success' 
        ? 'bg-white border-l-4 border-green-500 text-slate-800' 
        : 'bg-white border-l-4 border-red-500 text-slate-800';

    const icon = type === 'success' ? CHECK_ICON_SVG : '⚠️';

    toast.className = `fixed top-5 right-5 z-[100] flex items-center p-4 rounded shadow-2xl transform transition-all duration-300 translate-y-[-20px] opacity-0 ${colors}`;
    
    toast.innerHTML = `
        <div class="mr-3">${icon}</div>
        <div class="font-medium">${message}</div>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-20px]', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-[-20px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
