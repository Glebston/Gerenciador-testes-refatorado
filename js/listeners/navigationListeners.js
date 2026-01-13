// js/listeners/navigationListeners.js

// v5.37.0: Correção Definitiva do FAB (Estado Explícito + StopPropagation)
// O 'UI' agora é injetado pelo main.js (Orquestrador)
import { resetIdleTimer } from '../utils.js'; 

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
        e.stopPropagation(); 
        UI.DOM.userDropdown.classList.toggle('hidden');
    });
    
    // --- LÓGICA DO BOTÃO FLUTUANTE (FAB) - BLINDADA ---
    if (UI.DOM.fabBtn && UI.DOM.fabMenu) {
        UI.DOM.fabBtn.addEventListener('click', (e) => {
            // 1. Impede que o clique feche o menu imediatamente (Bubbling)
            e.stopPropagation(); 
            
            const menu = UI.DOM.fabMenu;
            const btn = UI.DOM.fabBtn;
            const icon = btn.querySelector('i, svg');
            
            // 2. Verifica o estado REAL do menu (Verdade Única)
            const isClosed = menu.classList.contains('hidden');

            if (isClosed) {
                // AÇÃO: ABRIR
                menu.classList.remove('hidden');
                
                // Visual: Estado Ativo (Vermelho/X)
                btn.classList.remove('bg-blue-600');
                btn.classList.add('bg-red-600');
                if (icon) icon.classList.add('rotate-45');
                
            } else {
                // AÇÃO: FECHAR
                menu.classList.add('hidden');
                
                // Visual: Estado Inativo (Azul/+)
                btn.classList.remove('bg-red-600');
                btn.classList.add('bg-blue-600');
                if (icon) icon.classList.remove('rotate-45');
            }
        });
    }

    // --- FECHAMENTO GLOBAL DE MENUS (Click Outside) ---
    document.addEventListener('click', (e) => { 
        // 1. Fecha Dropdown de Usuário
        if (UI.DOM.userMenuBtn && !UI.DOM.userMenuBtn.parentElement.contains(e.target)) {
            UI.DOM.userDropdown.classList.add('hidden');
        }

        // 2. Fecha Menu FAB (Sincronizado)
        if (UI.DOM.fabBtn && UI.DOM.fabMenu) {
            // Se o clique NÃO foi no botão E NÃO foi no menu -> Fecha
            if (!UI.DOM.fabBtn.contains(e.target) && !UI.DOM.fabMenu.contains(e.target)) {
                
                // Só executa se estiver aberto, para economizar processamento
                if (!UI.DOM.fabMenu.classList.contains('hidden')) {
                    UI.DOM.fabMenu.classList.add('hidden');
                    
                    // Reseta estilos visuais do botão forçadamente para garantir sincronia
                    const btn = UI.DOM.fabBtn;
                    const icon = btn.querySelector('i, svg');
                    
                    btn.classList.remove('bg-red-600');
                    btn.classList.add('bg-blue-600');
                    if (icon) icon.classList.remove('rotate-45');
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
