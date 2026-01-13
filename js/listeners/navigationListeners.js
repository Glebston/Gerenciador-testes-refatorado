// js/listeners/navigationListeners.js
// ==========================================================
// MÓDULO NAVIGATION LISTENERS (v5.41.0 - STYLE FORCE)
// Status: BLINDADO (Força Bruta de Visibilidade)
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

    // --- 3. CONTROLE MESTRE DE CLIQUES (FAB FIXED) ---
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

        // B. Lógica do Botão Flutuante (FAB) - COM FORÇA BRUTA VISUAL
        const fabBtn = document.getElementById('fabMainBtn');
        const fabMenu = document.getElementById('fabMenu');

        if (fabBtn && fabMenu) {
            const clickedFabBtn = fabBtn.contains(e.target);
            const clickedInsideFabMenu = fabMenu.contains(e.target);
            const icon = fabBtn.querySelector('svg');

            // --- FUNÇÕES DE ANIMAÇÃO (Direct Style Manipulation) ---
            const openFab = () => {
                // 1. Remove classes de ocultação do Tailwind
                fabMenu.classList.remove('invisible', 'opacity-0', 'translate-y-4');
                fabMenu.classList.add('translate-y-0'); // Mantém posição correta
                
                // 2. FORÇA BRUTA: Injeta CSS direto para garantir visibilidade
                fabMenu.style.visibility = 'visible';
                fabMenu.style.opacity = '1';
                fabMenu.style.pointerEvents = 'auto'; // Garante que os botões funcionem
                
                // 3. Visual do Botão (Vermelho)
                fabBtn.classList.remove('bg-blue-600');
                fabBtn.classList.add('bg-red-600');
                if (icon) icon.classList.add('rotate-45');
            };

            const closeFab = () => {
                // 1. Volta classes de ocultação
                fabMenu.classList.remove('translate-y-0');
                fabMenu.classList.add('invisible', 'opacity-0', 'translate-y-4');
                
                // 2. FORÇA BRUTA: Limpa o CSS injetado
                fabMenu.style.visibility = '';
                fabMenu.style.opacity = '';
                fabMenu.style.pointerEvents = '';
                
                // 3. Visual do Botão (Azul)
                fabBtn.classList.remove('bg-red-600');
                fabBtn.classList.add('bg-blue-600');
                if (icon) icon.classList.remove('rotate-45');
            };

            if (clickedFabBtn) {
                // Verifica estado atual pela opacidade computada
                const currentOpacity = window.getComputedStyle(fabMenu).opacity;
                const isClosed = currentOpacity === '0' || fabMenu.classList.contains('invisible');
                
                if (isClosed) {
                    openFab();
                } else {
                    closeFab();
                }
            } else if (!clickedInsideFabMenu) {
                // Clicou fora? Fecha.
                const currentOpacity = window.getComputedStyle(fabMenu).opacity;
                if (currentOpacity !== '0' && !fabMenu.classList.contains('invisible')) {
                    closeFab();
                }
            }
        }
    });

    // --- 4. Outros Listeners (Mantidos) ---
    if (UI.DOM.toggleViewBtn) {
        UI.DOM.toggleViewBtn.addEventListener('click', () => {
            let { currentOrdersView } = deps.getState();
            currentOrdersView = currentOrdersView === 'pending' ? 'delivered' : 'pending';
            deps.setState({ currentOrdersView });
            UI.DOM.toggleViewBtn.textContent = currentOrdersView === 'pending' ? 'Ver Entregues' : 'Ver Pendentes';
            UI.renderOrders(deps.getOrders(), currentOrdersView);
        });
    }
    if (UI.DOM.backupBtn) UI.DOM.backupBtn.addEventListener('click', deps.handleBackup);
    if (UI.DOM.restoreFileInput) UI.DOM.restoreFileInput.addEventListener('change', deps.handleRestore);
    if (UI.DOM.requestDeletionBtn) {
        UI.DOM.requestDeletionBtn.addEventListener('click', async () => { 
            const confirmed = await UI.showConfirmModal("Enviar solicitação?", "Sim", "Cancelar");
            if (confirmed) UI.showInfoModal(`Envie e-mail para paglucrobr@gmail.com`);
        });
    }
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
