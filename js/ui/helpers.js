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
    // Evita problemas de fuso ao formatar apenas visualmente a string YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// RENOMEADO DE formatPhone PARA formatPhoneNumber PARA EVITAR ERROS NOS LISTENERS
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
 * Gerencia a seleção visual de botões (ex: Dinheiro/Pix/Cartão).
 * Aplica classes de "selecionado" ao botão clicado e remove dos outros.
 */
export const updateSourceSelectionUI = (container, selectedSource) => {
    if (!container) return;
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
        const source = btn.getAttribute('data-source');
        
        if (source === selectedSource) {
            // Estilo Selecionado (Indigo)
            btn.classList.remove('bg-slate-100', 'text-slate-600', 'border-slate-200');
            btn.classList.add('bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'ring-1', 'ring-indigo-200');
        } else {
            // Estilo Padrão (Cinza)
            btn.classList.add('bg-slate-100', 'text-slate-600', 'border-slate-200');
            btn.classList.remove('bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'ring-1', 'ring-indigo-200');
        }
    });
};

/**
 * Popula um <select> com opções simples ou objetos.
 */
export const populateDropdown = (selectElement, options) => {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Selecione...</option>';
    
    options.forEach(opt => {
        const option = document.createElement('option');
        // Suporta array de strings ["A", "B"] ou objetos [{value: "A", label: "A"}]
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        
        option.value = value;
        option.textContent = label;
        selectElement.appendChild(option);
    });
};

/**
 * CORREÇÃO: Função restaurada para popular os datalists (sugestões de input)
 */
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
    // Remove feedback anterior se houver
    const existingToast = document.getElementById('toast-feedback');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-feedback';
    
    // Configuração de Cores baseada no tipo
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

    // Animação de entrada
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-20px]', 'opacity-0');
    });

    // Auto-remove após 3 segundos
    setTimeout(() => {
        toast.classList.add('translate-y-[-20px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
