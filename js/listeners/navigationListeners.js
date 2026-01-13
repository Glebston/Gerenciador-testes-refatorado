// js/listeners/navigationListeners.js
// ==========================================================
// MÓDULO NAVIGATION LISTENERS (v5.38.0 - Centralized Event Fix)
// Status: BLINDADO (Lógica de Clique Centralizada)
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

    // --- 3. CONTROLE MESTRE DE CLIQUES (A Solução Sênior) ---
    // Em vez de espalhar listeners, centralizamos a lógica de decisão.
    document.addEventListener('click', (e) => {
        
        // A. Lógica do Dropdown de Usuário
        if (UI.DOM.userMenuBtn && UI.DOM.userDropdown) {
            const clickedUserBtn = UI.DOM.userMenuBtn.contains(e.target);
            const clickedInsideUserMenu = UI.DOM.userDropdown.contains(e.target);

            if (clickedUserBtn) {
                // Toggle
                UI.DOM.userDropdown.classList.toggle('hidden');
            } else if (!clickedInsideUserMenu) {
                // Fecha se clicou fora
                UI.DOM.userDropdown.classList.add('hidden');
            }
        }

        // B. Lógica do Botão Flutuante (FAB) - CORREÇÃO DEFINITIVA
        if (UI.DOM.fabBtn && UI.DOM.fabMenu) {
            // Verifica se o clique foi no botão ou em algum elemento dentro dele (ícone, path, svg)
            const clickedFabBtn = UI.DOM.fabBtn.contains(e.target);
            const clickedInsideFabMenu = UI.DOM.fabMenu.contains(e.target);

            // Elementos visuais para animação
            const icon = UI.DOM.fabBtn.querySelector('i, svg');

            if (clickedFabBtn) {
                // --- CENÁRIO 1: Clicou no Botão FAB ---
                // Verifica o estado ATUAL antes de decidir
                const isCurrentlyClosed = UI.DOM.fabMenu.classList.contains('hidden');

                if (isCurrentlyClosed) {
                    // ABRIR
                    UI.DOM.fabMenu.classList.remove('hidden');
                    // Animação de X e Cor Vermelha
                    UI.DOM.fabBtn.classList.remove('bg-blue-600');
                    UI.DOM.fabBtn.classList.add('bg-red-600');
                    if (icon) icon.classList.add('rotate-45');
                } else {
                    // FECHAR
                    UI.DOM.fabMenu.classList.add('hidden');
                    // Resetar Animação e Cor Azul
                    UI.DOM.fabBtn.classList.remove('bg-red-600');
                    UI.DOM.fabBtn.classList.add('bg-blue-600');
                    if (icon) icon.classList.remove('rotate-45');
                }

            } else if (!clickedInsideFabMenu) {
                // --- CENÁRIO 2: Clicou Fora (Reset Geral) ---
                // Só executa se o menu estiver aberto, para evitar reflow desnecessário
                if (!UI.DOM.fabMenu.classList.contains('hidden')) {
                    UI.DOM.fabMenu.classList.add('hidden');
                    
                    // Garante que o botão volte ao estado original (Azul/+)
                    UI.DOM.fabBtn.classList.remove('bg-red-600');
                    UI.DOM.fabBtn.classList.add('bg-blue-600');
                    if (icon) icon.classList.remove('rotate-45');
                }
            }
            // Cenário 3 (Clicou DENTRO do menu): Não faz nada, deixa a ação do link acontecer.
        }
    });

    // --- 4. Outros Listeners (Sem conflito de clique) ---

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
