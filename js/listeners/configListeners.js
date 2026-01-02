// js/listeners/configListeners.js
// ==========================================================
// LISTENER DE CONFIGURAÇÕES (v1.0.0)
// Responsabilidade: Gerenciar a UI de Configurações da Empresa.
// Conecta o HTML (View) ao Service (Model).
// ==========================================================

import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getCompanySettings, saveCompanySettings } from "../services/settingsService.js";

// Referências aos Elementos do DOM (Cacheadas para performance)
const DOM = {
    openBtn: document.getElementById('companySettingsBtn'),
    modal: document.getElementById('settingsModal'),
    closeBtn: document.getElementById('closeSettingsModalBtn'),
    cancelBtn: document.getElementById('cancelSettingsBtn'),
    form: document.getElementById('settingsForm'),
    saveBtn: document.getElementById('saveSettingsBtn'),
    saveText: document.getElementById('saveSettingsText'),
    
    // Inputs
    pixKey: document.getElementById('settingPixKey'),
    pixBeneficiary: document.getElementById('settingPixBeneficiary'),
    entryPercent: document.getElementById('settingEntryPercent'),
    whatsapp: document.getElementById('settingWhatsapp')
};

/**
 * Função principal que inicializa todos os ouvintes.
 * Deve ser chamada no main.js uma única vez.
 */
export const initConfigListeners = () => {
    // 1. Segurança: Se não achou os elementos, aborta silenciosamente
    if (!DOM.openBtn || !DOM.modal) {
        console.warn('Elementos de configuração não encontrados no DOM.');
        return;
    }

    // 2. Evento: Abrir Modal
    DOM.openBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await openSettingsModal();
    });

    // 3. Evento: Fechar Modal (X ou Cancelar)
    DOM.closeBtn?.addEventListener('click', closeSettingsModal);
    DOM.cancelBtn?.addEventListener('click', closeSettingsModal);

    // 4. Evento: Salvar Formulário
    DOM.form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveSettings();
    });
};

/**
 * Abre o modal e carrega os dados atuais do banco.
 */
const openSettingsModal = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        alert("Erro: Usuário não autenticado.");
        return;
    }

    // Mostra o modal
    DOM.modal.classList.remove('hidden');

    // Estado de "Carregando" nos inputs
    setFormLoading(true);

    try {
        // Busca dados no Banco (Service)
        const settings = await getCompanySettings(user.uid);

        // Se existirem dados, preenche. Se não, deixa em branco.
        if (settings) {
            DOM.pixKey.value = settings.pixKey || '';
            DOM.pixBeneficiary.value = settings.pixBeneficiary || '';
            DOM.entryPercent.value = settings.entryPercentage || ''; // Atenção ao nome da chave
            DOM.whatsapp.value = settings.whatsappNumber || '';
        } else {
            // Limpa o formulário para um novo cadastro
            DOM.form.reset();
        }
    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar as configurações. Verifique sua conexão.");
        closeSettingsModal();
    } finally {
        setFormLoading(false);
    }
};

/**
 * Coleta os dados e envia para o serviço salvar.
 */
const handleSaveSettings = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    // 1. UI de Carregamento
    const originalText = DOM.saveText.innerText;
    DOM.saveText.innerText = "Salvando...";
    DOM.saveBtn.disabled = true;
    DOM.saveBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // 2. Coleta e Tratamento de Dados
    const settingsData = {
        pixKey: DOM.pixKey.value.trim(),
        pixBeneficiary: DOM.pixBeneficiary.value.trim(),
        entryPercentage: parseFloat(DOM.entryPercent.value) / 100 || 0, // Converte 50 para 0.50
        whatsappNumber: DOM.whatsapp.value.replace(/\D/g, '') // Remove tudo que não for número
    };

    // 3. Envio ao Banco
    try {
        await saveCompanySettings(user.uid, settingsData);
        
        // Sucesso
        alert("Configurações salvas com sucesso!");
        closeSettingsModal();

    } catch (error) {
        console.error(error);
        alert("Erro ao salvar. Tente novamente.");
    } finally {
        // Restaura botão
        DOM.saveText.innerText = originalText;
        DOM.saveBtn.disabled = false;
        DOM.saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

const closeSettingsModal = () => {
    DOM.modal.classList.add('hidden');
};

/**
 * Habilita ou desabilita os inputs enquanto carrega.
 */
const setFormLoading = (isLoading) => {
    const inputs = DOM.form.querySelectorAll('input');
    inputs.forEach(input => input.disabled = isLoading);
    
    if (isLoading) {
        DOM.pixKey.placeholder = "Carregando...";
    } else {
        DOM.pixKey.placeholder = "CPF, CNPJ, Email ou Aleatória";
    }
};
