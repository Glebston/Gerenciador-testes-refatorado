import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebaseConfig.js';
import { DOM, showInfoModal, showForgotPasswordModal, showConfirmModal } from './ui.js';

/**
 * Lida com a tentativa de login do usuário.
 * @param {Event} e - O evento de submit do formulário.
 */
export const handleLogin = async (e) => {
    e.preventDefault();
    const email = DOM.loginEmail.value;
    const password = DOM.loginPassword.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showInfoModal("E-mail ou senha incorretos.");
        console.error("Falha no login:", error.code);
    }
};

/**
 * Desloga o usuário atual.
 */
export const handleLogout = () => {
    signOut(auth).catch(error => console.error("Erro ao fazer logout:", error));
};

/**
 * Inicia o fluxo de recuperação de senha.
 */
export const handleForgotPassword = async () => {
    const email = await showForgotPasswordModal();
    
    if (!email) {
        return; // Usuário cancelou
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showInfoModal("Se uma conta existir para este e-mail, um link para redefinição de senha foi enviado.");
    } catch (error) {
        // Silencia o erro para o usuário para não revelar quais e-mails existem no sistema.
        console.error("Erro na tentativa de redefinição de senha (silenciado para o usuário):", error.code);
        showInfoModal("Se uma conta existir para este e-mail, um link para redefinição de senha foi enviado.");
    }
};

/**
 * Inicia o fluxo de solicitação de exclusão de conta.
 */
export const handleRequestDeletion = async () => {
    const confirmed = await showConfirmModal(
        "Isto registrará uma solicitação de exclusão de conta. Para formalizar o pedido, você precisará enviar um e-mail ao administrador. Deseja continuar?",
        "Sim, continuar",
        "Cancelar"
    );

    if (confirmed) {
        const adminEmail = "paglucrobr@gmail.com";
        const userEmail = auth.currentUser ? auth.currentUser.email : "[seu e-mail]";
        showInfoModal(`Para concluir, por favor, envie um e-mail de ${userEmail} para ${adminEmail} solicitando a remoção da sua conta. O administrador processará seu pedido.`);
    }

};
