// js/listeners/navigationListeners.js

// v5.36.0: Correção do FAB (Event Bubbling Fix)
// O 'UI' agora é injetado pelo main.js (Orquestrador)
import { resetIdleTimer } from '../utils.js'; // Importa o utilitário

/**
 * Inicializa listeners de navegação, menu de usuário e eventos globais da UI.
 * @param {object} UI - O módulo UI (injetado pelo main.js)
 * @param {object} deps - Dependências injetadas (handlers, state, etc.)
 */
export function initializeNavigationListeners(UI, deps) {

    // --- Eventos Globais da Aplicação ---
    window.addEventListener('load', () => {
        if (localStorage.getItem('cookieConsent') !== 'true') {
            UI.DOM.cookieBanner.classList.remove('hidden');
        }
    });
    ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));

    // --- Navegação Principal (Dashboard Toggle) ---
    UI.DOM.financeDashboardBtn.addEventListener('click', () => {
        let { currentDashboardView } = deps.getState();
        
        currentDashboardView = currentDashboardView === 'orders' ? 'finance' : 'orders';
        deps.setState({ currentDashboardView }); 

        UI.DOM.ordersDashboard.classList.toggle('hidden', currentDashboardView !== 'orders');
        UI.DOM.financeDashboard.classList.toggle('hidden', currentDashboardView === 'orders');
        UI.updateNavButton(currentDashboardView);
        
        if (currentDashboardView === 'finance') {
            UI.renderFinanceDashboard(deps.getTransactions(), deps.getConfig());
        } else {
            const { currentOrdersView } = deps.getState();
            UI.renderOrders(deps.getOrders(), currentOrdersView);
        }
    });

    // --- Menu de Usuário (Topo) ---
    UI.DOM.userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne fechamento imediato
        UI.DOM.userDropdown.classList.toggle('hidden');
    });
    
    // --- LÓGICA DO BOTÃO FLUTUANTE (FAB) - CORRIGIDO ---
    // Verifica se os elementos existem para evitar erros
    if (UI.DOM.fabBtn && UI.DOM.fabMenu) {
        UI.DOM.fabBtn.addEventListener('click', (e) => {
            // [CORREÇÃO CRÍTICA] Impede que o clique suba para o document e feche o menu instantaneamente
            e.stopPropagation(); 
            
            UI.DOM.fabMenu.classList.toggle('hidden');
            
            // Efeito visual no botão (opcional, rotaciona se for ícone)
            const icon = UI.DOM.fabBtn.querySelector('i, svg');
            if (icon) icon.classList.toggle('rotate-45'); // Classe genérica de rotação se houver
            
            // Alterna a cor ou estilo visual para indicar estado "Ativo"
            UI.DOM.fabBtn.classList.toggle('bg-red-600'); // Exemplo: vira vermelho para fechar
            UI.DOM.fabBtn.classList.toggle('bg-blue-600'); // Exemplo: volta para azul
        });
    }

    // --- FECHAMENTO GLOBAL DE MENUS (Click Outside) ---
    document.addEventListener('click', (e) => { 
        // 1. Fecha Dropdown de Usuário
        if (UI.DOM.userMenuBtn && !UI.DOM.userMenuBtn.parentElement.contains(e.target)) {
            UI.DOM.userDropdown.classList.add('hidden');
        }

        // 2. Fecha Menu FAB
        if (UI.DOM.fabBtn && UI.DOM.fabMenu) {
            // Se o clique NÃO foi no botão E NÃO foi no menu -> Fecha
            if (!UI.DOM.fabBtn.contains(e.target) && !UI.DOM.fabMenu.contains(e.target)) {
                if (!UI.DOM.fabMenu.classList.contains('hidden')) {
                    UI.DOM.fabMenu.classList.add('hidden');
                    
                    // Reseta estilos visuais do botão
                    const icon = UI.DOM.fabBtn.querySelector('i, svg');
                    if (icon) icon.classList.remove('rotate-45');
                    UI.DOM.fabBtn.classList.remove('bg-red-600');
                    UI.DOM.fabBtn.classList.add('bg-blue-600');
                }
            }
        }
    });

    // --- Alternar Visualização (Pendentes / Entregues) ---
    UI.DOM.toggleViewBtn.addEventListener('click', () => {
        let { currentOrdersView } = deps.getState();

        currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
        deps.setState({ currentOrdersView });

        UI.DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
        UI.renderOrders(deps.getOrders(), currentOrdersView);
    });

    // --- Backup & Dados ---
    UI.DOM.backupBtn.addEventListener('click', deps.handleBackup);
    UI.DOM.restoreFileInput.addEventListener('change', deps.handleRestore);

    UI.DOM.requestDeletionBtn.addEventListener('click', async () => { 
        const confirmed = await UI.showConfirmModal("Isto registrará uma solicitação. Envie um e-mail ao administrador para formalizar. Continuar?", "Sim", "Cancelar");
        if (confirmed) {
            UI.showInfoModal(`Para concluir, envie um e-mail para paglucrobr@gmail.com solicitando a remoção da sua conta.`);
        }
    });

    // --- Banners (Cookie & Backup) ---
    UI.DOM.cookieAcceptBtn.addEventListener('click', () => { 
        localStorage.setItem('cookieConsent', 'true'); 
        UI.DOM.cookieBanner.classList.add('hidden'); 
    });
    
    UI.DOM.backupNowBtn.addEventListener('click', () => { 
        deps.handleBackup(); 
        UI.DOM.backupReminderBanner.classList.add('hidden'); 
    });
    
    UI.DOM.dismissBackupReminderBtn.addEventListener('click', () => UI.DOM.backupReminderBanner.classList.add('hidden'));
}
