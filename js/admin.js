// js/admin.js
// ========================================================
// MÓDULO ADMINISTRATIVO (v1.0)
// Responsável por gerenciar usuários, bloqueios e mensagens
// ========================================================

import { db } from './firebaseConfig.js';
import { collection, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Cache local para não ficar lendo o banco toda hora
let usersCache = [];

export async function initializeAdminPanel() {
    console.log("👑 [ADMIN] Inicializando módulo administrativo...");

    const adminBtn = document.getElementById('adminPanelBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('closeAdminModalBtn');
    const refreshBtn = document.getElementById('adminRefreshBtn');
    const searchInput = document.getElementById('adminSearchInput');

    // 1. Revelar o Botão de Admin
    if (adminBtn) {
        adminBtn.classList.remove('hidden');
        adminBtn.addEventListener('click', () => {
            adminModal.classList.remove('hidden');
            loadUsers(); // Carrega a lista ao abrir
        });
    }

    // 2. Fechar Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            adminModal.classList.add('hidden');
        });
    }

    // 3. Botão Atualizar
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadUsers();
        });
    }

    // 4. Busca em Tempo Real
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterUsers(e.target.value);
        });
    }
}

// --- FUNÇÕES DE DADOS ---

async function loadUsers() {
    const listBody = document.getElementById('adminUsersList');
    listBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center"><div class="flex justify-center"><svg class="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div><p class="text-gray-500 mt-2">Buscando dados na nuvem...</p></td></tr>';

    try {
        // Busca todas as empresas (usuários) do Firestore
        const querySnapshot = await getDocs(collection(db, "companies"));
        
        usersCache = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            usersCache.push({
                id: doc.id,
                name: data.companyName || "Sem Nome",
                email: data.email || "N/A", // Se você salvar o email no doc da empresa
                isBlocked: data.isBlocked || false,
                adminMessage: data.adminMessage || "",
                createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Antigo"
            });
        });

        renderTable(usersCache);

    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        listBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500">Erro ao carregar dados: ${error.message}</td></tr>`;
    }
}

function renderTable(users) {
    const listBody = document.getElementById('adminUsersList');
    listBody.innerHTML = '';

    if (users.length === 0) {
        listBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 border-b last:border-0 transition";
        
        // Cor do status
        const statusColor = user.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
        const statusText = user.isBlocked ? "Bloqueado" : "Ativo";

        row.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-gray-900">${user.name}</div>
                <div class="text-xs text-gray-400">${user.id}</div>
            </td>
            <td class="p-4 text-gray-600">${user.createdAt}</td>
            <td class="p-4 text-center">
                <span id="badge-${user.id}" class="px-2 py-1 rounded-full text-xs font-bold ${statusColor}">${statusText}</span>
            </td>
            <td class="p-4 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer toggle-block-btn" data-id="${user.id}" ${user.isBlocked ? 'checked' : ''}>
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
            </td>
            <td class="p-4">
                <div class="flex gap-2">
                    <input type="text" id="msg-${user.id}" value="${user.adminMessage}" placeholder="Ex: Mensalidade vence hoje" class="text-sm border rounded px-2 py-1 w-full focus:ring-2 focus:ring-purple-500 outline-none">
                    <button class="save-msg-btn text-purple-600 hover:text-purple-800 p-1" data-id="${user.id}" title="Enviar Mensagem">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </div>
            </td>
            <td class="p-4 text-right">
                <button class="text-gray-400 hover:text-blue-600 transition" title="Ver Detalhes (Futuro)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
            </td>
        `;
        listBody.appendChild(row);
    });

    // --- REATIVAR LISTENERS DOS BOTÕES ---
    
    // 1. Toggle Bloqueio
    document.querySelectorAll('.toggle-block-btn').forEach(btn => {
        btn.addEventListener('change', async (e) => {
            const userId = e.target.dataset.id;
            const newStatus = e.target.checked;
            await toggleUserBlock(userId, newStatus);
        });
    });

    // 2. Salvar Mensagem
    document.querySelectorAll('.save-msg-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Pequeno hack para pegar o botão mesmo se clicar no ícone SVG dentro dele
            const button = e.target.closest('button'); 
            const userId = button.dataset.id;
            const input = document.getElementById(`msg-${userId}`);
            await saveUserMessage(userId, input.value);
        });
    });
}

function filterUsers(term) {
    if (!term) {
        renderTable(usersCache);
        return;
    }
    const lowerTerm = term.toLowerCase();
    const filtered = usersCache.filter(u => 
        u.name.toLowerCase().includes(lowerTerm) || 
        u.id.toLowerCase().includes(lowerTerm)
    );
    renderTable(filtered);
}

// --- AÇÕES NO FIRESTORE ---

async function toggleUserBlock(companyId, isBlocked) {
    const badge = document.getElementById(`badge-${companyId}`);
    try {
        badge.className = "px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 animate-pulse";
        badge.textContent = "...";

        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
            isBlocked: isBlocked
        });

        // Atualiza Cache Local
        const user = usersCache.find(u => u.id === companyId);
        if (user) user.isBlocked = isBlocked;

        // Atualiza Visual
        if (isBlocked) {
            badge.className = "px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800";
            badge.textContent = "Bloqueado";
        } else {
            badge.className = "px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800";
            badge.textContent = "Ativo";
        }

    } catch (error) {
        console.error("Erro ao bloquear:", error);
        alert("Erro ao atualizar status. Verifique o console.");
        badge.textContent = "Erro";
    }
}

async function saveUserMessage(companyId, message) {
    const input = document.getElementById(`msg-${companyId}`);
    try {
        const originalBg = input.style.backgroundColor;
        input.style.backgroundColor = "#d8b4fe"; // Roxo claro indicando salvamento

        const companyRef = doc(db, "companies", companyId);
        await updateDoc(companyRef, {
            adminMessage: message
        });

        // Atualiza Cache
        const user = usersCache.find(u => u.id === companyId);
        if (user) user.adminMessage = message;

        // Feedback visual de sucesso
        input.style.backgroundColor = "#bbf7d0"; // Verde claro
        setTimeout(() => {
            input.style.backgroundColor = originalBg;
        }, 1000);

    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        alert("Erro ao enviar mensagem.");
        input.style.backgroundColor = "#fecaca"; // Vermelho claro
    }
}
