// js/listeners/navigationListeners.js
// ==========================================================
// MÓDULO NAVIGATION LISTENERS (v5.40.0 - DEBUG MODE)
// Status: DEBUG ATIVO (Verifique o Console do Navegador F12)
// ==========================================================

import { resetIdleTimer } from '../utils.js'; 

export function initializeNavigationListeners(UI, deps) {
    console.log("🚀 [DEBUG] Listener de Navegação Iniciado!");

    // --- 1. Eventos Globais de Sistema ---
    window.addEventListener('load', () => {
        if (localStorage.getItem('cookieConsent') !== 'true') {
            if(UI.DOM.cookieBanner) UI.DOM.cookieBanner.classList.remove('hidden');
        }
    });
    
    // Timer de inatividade
    ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => window.addEventListener(event, resetIdleTimer));

    // --- 2. Navegação Principal ---
    if (UI.DOM.financeDashboardBtn) {
        UI.DOM.financeDashboardBtn.addEventListener('click', () => {
            // ... (lógica do dashboard mantida)
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

    // --- 3. CONTROLE MESTRE DE CLIQUES (DEBUG) ---
    document.addEventListener('click', (e) => {
        // console.log("🖱️ [DEBUG] Clique detectado em:", e.target); // Descomente se precisar ver tudo

        // A. Dropdown Usuário
        if (UI.DOM.userMenuBtn && UI.DOM.userDropdown) {
            if (UI.DOM.userMenuBtn.contains(e.target)) {
                UI.DOM.userDropdown.classList.toggle('hidden');
            } else if (!UI.DOM.userDropdown.contains(e.target)) {
                UI.DOM.userDropdown.classList.add('hidden');
            }
        }

        // B. Lógica do FAB (Botão Flutuante)
        const fabBtn = document.getElementById('fabMainBtn');
        const fabMenu = document.getElementById('fabMenu');

        if (!fabBtn || !fabMenu) {
            // Se isso aparecer no console ao clicar, é porque o ID no HTML ainda está errado ou cache velho
            console.error("❌ [DEBUG] ERRO CRÍTICO: Elementos FAB não encontrados no DOM!", { fabBtn, fabMenu });
            return;
        }

        const clickedFabBtn = fabBtn.contains(e.target);
        const clickedInsideFabMenu = fabMenu.contains(e.target);
        const icon = fabBtn.querySelector('svg');

        // Funções Visuais
        const openFab = () => {
            console.log("🟢 [DEBUG] Abrindo Menu FAB");
            fabMenu.classList.remove('invisible', 'opacity-0', 'translate-y-4');
            fabMenu.classList.add('opacity-100', 'translate-y-0');
            fabBtn.classList.remove('bg-blue-600');
            fabBtn.classList.add('bg-red-600');
            if (icon) icon.classList.add('rotate-45');
        };

        const closeFab = () => {
            console.log("🔴 [DEBUG] Fechando Menu FAB");
            fabMenu.classList.remove('opacity-100', 'translate-y-0');
            fabMenu.classList.add('invisible', 'opacity-0', 'translate-y-4');
            fabBtn.classList.remove('bg-red-600');
            fabBtn.classList.add('bg-blue-600');
            if (icon) icon.classList.remove('rotate-45');
        };

        if (clickedFabBtn) {
            console.log("🎯 [DEBUG] Clique confirmado no Botão Principal!");
            const isClosed = fabMenu.classList.contains('invisible');
            console.log("❓ [DEBUG] O menu está invisível?", isClosed);
            
            if (isClosed) {
                openFab();
            } else {
                closeFab();
            }
        } else if (!clickedInsideFabMenu) {
            // Se clicar fora e estiver aberto, fecha
            if (!fabMenu.classList.contains('invisible')) {
                console.log("👋 [DEBUG] Clicou fora, fechando.");
                closeFab();
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
