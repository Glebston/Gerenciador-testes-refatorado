// js/listeners/settingsLogic.js
// ========================================================
// LÓGICA DE CONFIGURAÇÕES & UPLOAD (v1.0)
// Responsabilidade: Gerenciar o modal de settings e Uploads
// ========================================================

import { getCompanySettings, saveCompanySettings } from "../services/settingsService.js";
import { auth } from "../firebaseConfig.js"; // Ou onde estiver sua auth

// CONFIGURAÇÃO IMGBB (Você precisa de uma chave API gratuita em api.imgbb.com)
// Para testes rápidos, essa é uma chave pública temporária, mas crie a sua para produção!
const IMGBB_API_KEY = "c87e4945b056158022d4f2913e61c33c"; 

const DOM = {
    modal: document.getElementById('settingsModal'), // Certifique-se que o modal tem esse ID ou ajuste aqui
    form: document.getElementById('settingsForm'), // Se houver tag form, senão ignore
    logoInput: document.getElementById('logoInput'),
    logoPreview: document.getElementById('logoPreview'),
    logoPlaceholder: document.getElementById('logoPlaceholder'),
    uploadLoader: document.getElementById('uploadLoader'),
    uploadStatus: document.getElementById('uploadStatus'),
    logoUrlHidden: document.getElementById('logoUrl'), // O input hidden
    
    // Campos de Texto
    pixKey: document.getElementById('pixKey'),
    pixBeneficiary: document.getElementById('pixBeneficiary'),
    entryPercent: document.getElementById('entryPercent'),
    whatsapp: document.getElementById('whatsapp'),
    
    // Botões
    saveBtn: document.getElementById('saveSettingsBtn'),
    closeBtn: document.getElementById('closeSettingsBtn')
};

// --- 1. CARREGAR DADOS AO ABRIR ---
export async function openSettingsModal() {
    // Lógica para mostrar o modal (ex: remover classe hidden)
    // DOM.modal.classList.remove('hidden'); 

    const user = auth.currentUser;
    if (!user) return;

    DOM.saveBtn.textContent = "Carregando...";
    DOM.saveBtn.disabled = true;

    try {
        // Busca dados do Service
        const data = await getCompanySettings(DOM.modal.dataset.companyId || user.uid); // Ajuste conforme sua lógica de ID
        
        if (data) {
            DOM.pixKey.value = data.pixKey || "";
            DOM.pixBeneficiary.value = data.pixBeneficiary || "";
            DOM.entryPercent.value = data.entryPercent || "50";
            DOM.whatsapp.value = data.whatsapp || "";
            
            // Se já tiver logo salvo, mostra
            if (data.logoUrl) {
                DOM.logoUrlHidden.value = data.logoUrl;
                DOM.logoPreview.src = data.logoUrl;
                DOM.logoPreview.classList.remove('hidden');
                DOM.logoPlaceholder.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error("Erro ao carregar configs:", error);
    } finally {
        DOM.saveBtn.innerHTML = `Salvar Alterações`;
        DOM.saveBtn.disabled = false;
    }
}

// --- 2. PREVIEW E UPLOAD DE IMAGEM ---
if (DOM.logoInput) {
    DOM.logoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 2.1 Mostra Preview Local Imediato
        const reader = new FileReader();
        reader.onload = (ev) => {
            DOM.logoPreview.src = ev.target.result;
            DOM.logoPreview.classList.remove('hidden');
            DOM.logoPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        // 2.2 Upload para ImgBB
        try {
            DOM.uploadLoader.classList.remove('hidden');
            DOM.uploadStatus.textContent = "Enviando imagem...";
            DOM.saveBtn.disabled = true;

            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const imageUrl = result.data.url;
                DOM.logoUrlHidden.value = imageUrl; // Salva a URL no input oculto
                DOM.uploadStatus.textContent = "Imagem carregada com sucesso!";
                DOM.uploadStatus.className = "text-[10px] font-bold mt-1 h-3 text-green-600";
            } else {
                throw new Error("Falha no upload");
            }

        } catch (error) {
            console.error(error);
            DOM.uploadStatus.textContent = "Erro no upload da imagem.";
            DOM.uploadStatus.className = "text-[10px] font-bold mt-1 h-3 text-red-600";
        } finally {
            DOM.uploadLoader.classList.add('hidden');
            DOM.saveBtn.disabled = false;
        }
    });
}

// --- 3. SALVAR TUDO ---
if (DOM.saveBtn) {
    DOM.saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) return;

        const originalText = DOM.saveBtn.textContent;
        DOM.saveBtn.textContent = "Salvando...";
        DOM.saveBtn.disabled = true;

        const settingsData = {
            pixKey: DOM.pixKey.value,
            pixBeneficiary: DOM.pixBeneficiary.value,
            entryPercent: DOM.entryPercent.value,
            whatsapp: DOM.whatsapp.value,
            logoUrl: DOM.logoUrlHidden.value // Pega a URL que veio do ImgBB
        };

        try {
            await saveCompanySettings(DOM.modal.dataset.companyId || user.uid, settingsData);
            alert("Configurações salvas com sucesso!");
            // Opcional: Fechar modal aqui
        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            DOM.saveBtn.textContent = originalText;
            DOM.saveBtn.disabled = false;
        }
    });
}
