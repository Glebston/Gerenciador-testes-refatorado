// js/listeners/navigationListeners.js
// ==========================================================
// MÓDULO NAVIGATION LISTENERS (v5.39.0 - FAB Live Fix)
// Status: BLINDADO (Busca dinâmica de ID + Correção CSS)
// ==========================================================

import { resetIdleTimer } from '../utils.js'; 

export function initializeNavigationListeners(UI, deps) {

    // --- 1. Eventos Globais de Sistema ---
    window.addEventListener('load', () => {
        if (localStorage.getItem('cookieConsent') !== 'true') {
            if(UI.DOM.cookieBanner) UI.DOM.cookieBanner.classList.remove('hidden');
        }
    });
    
    // Timer de inatividade
    ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));

    // --- 2. Navegação Principal (Dashboard) ---
    if (UI.DOM.financeDashboardBtn) {
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
    }

    // --- 3. CONTROLE MESTRE DE CLIQUES (SOLUÇÃO LIVE DOM) ---
    document.addEventListener('click', (e) => {
        
        // A. Lógica do Dropdown de Usuário
        if (UI.DOM.userMenuBtn && UI.DOM.userDropdown) {
            const clickedUserBtn = UI.DOM.userMenuBtn.contains(e.target);
            const clickedInsideUserMenu = UI.DOM.userDropdown.contains(e.target);

            if (clickedUserBtn) {
                UI.DOM.userDropdown.classList.toggle('hidden');
            } else if (!clickedInsideUserMenu) {
                UI.DOM.userDropdown.classList.add('hidden');
            }
        }

        // B. Lógica do Botão Flutuante (FAB) - CORREÇÃO CSS & LIVE REFERENCE
        // Importante: Buscamos pelo ID no momento do clique para garantir a referência viva
        const fabBtn = document.getElementById('fabMainBtn');
        const fabMenu = document.getElementById('fabMenu');

        if (fabBtn && fabMenu) {
            const clickedFabBtn = fabBtn.contains(e.target);
            const clickedInsideFabMenu = fabMenu.contains(e.target);
            const icon = fabBtn.querySelector('svg');

            // Funções Auxiliares para lidar com as classes Tailwind (Transições)
            const openFab = () => {
                // Remove as classes que escondem
                fabMenu.classList.remove('invisible', 'opacity-0', 'translate-y-4');
                // Adiciona as classes que mostram
                fabMenu.classList.add('opacity-100', 'translate-y-0');
                
                // Visual do Botão (Vermelho/X)
                fabBtn.classList.remove('bg-blue-600');
                fabBtn.classList.add('bg-red-600');
                if (icon) icon.classList.add('rotate-45');
            };

            const closeFab = () => {
                // Remove as classes que mostram
                fabMenu.classList.remove('opacity-100', 'translate-y-0');
                // Adiciona as classes que escondem (retorna ao estado original do HTML)
                fabMenu.classList.add('invisible', 'opacity-0', 'translate-y-4');
                
                // Visual do Botão (Azul/+)
                fabBtn.classList.remove('bg-red-600');
                fabBtn.classList.add('bg-blue-600');
                if (icon) icon.classList.remove('rotate-45');
            };

            if (clickedFabBtn) {
                // Verifica o estado atual baseando-se na classe 'invisible'
                const isClosed = fabMenu.classList.contains('invisible');
                
                if (isClosed) {
                    openFab();
                } else {
                    closeFab();
                }
            } else if (!clickedInsideFabMenu) {
                // Se clicar fora, fecha (apenas se já não estiver fechado)
                if (!fabMenu.classList.contains('invisible')) {
                    closeFab();
                }
            }
            // Se clicou dentro do menu, não faz nada (deixa o botão funcionar)
        }
    });

    // --- 4. Outros Listeners ---

    // Toggle View (Pendentes/Entregues)
    if (UI.DOM.toggleViewBtn) {
        UI.DOM.toggleViewBtn.addEventListener('click', () => {
            let { currentOrdersView } = deps.getState();
            currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
            deps.setState({ currentOrdersView });
            UI.DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
            UI.renderOrders(deps.getOrders(), currentOrdersView);
        });
    }

    // Backup & Restore
    if (UI.DOM.backupBtn) UI.DOM.backupBtn.addEventListener('click', deps.handleBackup);
    if (UI.DOM.restoreFileInput) UI.DOM.restoreFileInput.addEventListener('change', deps.handleRestore);

    // Deletar Conta
    if (UI.DOM.requestDeletionBtn) {
        UI.DOM.requestDeletionBtn.addEventListener('click', async () => { 
            const confirmed = await UI.showConfirmModal("Isto registrará uma solicitação. Envie um e-mail ao administrador para formalizar. Continuar?", "Sim", "Cancelar");
            if (confirmed) {
                UI.showInfoModal(`Para concluir, envie um e-mail para paglucrobr@gmail.com solicitando a remoção da sua conta.`);
            }
        });
    }

    // Banners
    if (UI.DOM.cookieAcceptBtn) {
        UI.DOM.cookieAcceptBtn.addEventListener('click', () => { 
            localStorage.setItem('cookieConsent', 'true'); 
            if(UI.DOM.cookieBanner) UI.DOM.cookieBanner.classList.add('hidden'); 
        });
    }
    
    if (UI.DOM.backupNowBtn) {
        UI.DOM.backupNowBtn.addEventListener('click', () => { 
            deps.handleBackup(); 
            if(UI.DOM.backupReminderBanner) UI.DOM.backupReminderBanner.classList.add('hidden'); 
        });
    }
    
    if (UI.DOM.dismissBackupReminderBtn) {
        UI.DOM.dismissBackupReminderBtn.addEventListener('click', () => {
            if(UI.DOM.backupReminderBanner) UI.DOM.backupReminderBanner.classList.add('hidden');
        });
    }
}
