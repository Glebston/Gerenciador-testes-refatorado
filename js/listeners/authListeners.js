// js/listeners/authListeners.js

// Importações necessárias
import { handleLogin, handleLogout, handleForgotPassword } from '../auth.js'; 

/**
 * Função utilitária para adicionar listeners com segurança (Cópia local para isolamento)
 */
function safeListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    }
}

/**
 * Inicializa todos os event listeners relacionados à autenticação.
 */
export function initializeAuthListeners(UI) {
    
    // Listener do formulário de login
    // CORREÇÃO: Usando safeListener e os nomes corretos do DOM (Suffix Input)
    safeListener(UI.DOM.loginForm, 'submit', (e) => { 
        e.preventDefault(); 
        
        // CORREÇÃO CRÍTICA: loginEmail -> loginEmailInput
        const email = UI.DOM.loginEmailInput ? UI.DOM.loginEmailInput.value : '';
        const password = UI.DOM.loginPasswordInput ? UI.DOM.loginPasswordInput.value : '';
        
        handleLogin(email, password); 
    });

    // Listener do botão "Esqueci minha senha"
    safeListener(UI.DOM.forgotPasswordBtn, 'click', handleForgotPassword);

    // Listener do botão de logout
    safeListener(UI.DOM.logoutBtn, 'click', handleLogout);
}
