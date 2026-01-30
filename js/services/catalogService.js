// js/services/catalogService.js
// ========================================================
// SERVIÇO DE CATÁLOGO (PREMIUM)
// Responsabilidade: CRUD do Firestore + Upload ImgBB + Regras de Limite (30/20)
// ========================================================

import { db, auth } from "../firebaseConfig.js";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    getCountFromServer,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Mesma chave utilizada no settingsLogic.js para consistência
const IMGBB_API_KEY = "f012978df48f3596b193c06e05589442";

// --- 1. UPLOAD DE IMAGEM (ImgBB) ---
export async function uploadCatalogImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result.data.url; // Retorna a URL direta
        } else {
            throw new Error(result.error?.message || "Falha no upload da imagem");
        }
    } catch (error) {
        console.error("Erro no serviço de imagem:", error);
        throw error;
    }
}

// --- 2. ADICIONAR PRODUTO (Regra dos 30) ---
export async function addCatalogItem(itemData) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    
    // Pega o ID da empresa (assumindo mapeamento padrão ou o próprio UID)
    // Nota: O controller deve passar o companyId correto, aqui usamos user.uid como fallback seguro
    const companyId = itemData.companyId || user.uid;
    const itemsRef = collection(db, "companies", companyId, "catalog_items");

    // A. VERIFICAÇÃO DE SEGURANÇA (Custo: 1 leitura leve)
    const snapshot = await getCountFromServer(itemsRef);
    const currentCount = snapshot.data().count;

    if (currentCount >= 30) {
        throw new Error("LIMITE ATINGIDO: Seu armazenamento está cheio (30/30). Exclua um item antigo para adicionar novos.");
    }

    // B. SALVA NO BANCO
    // Forçamos isActive: false ao criar para o usuário revisar antes de publicar
    const docRef = await addDoc(itemsRef, {
        title: itemData.title,
        description: itemData.description || "",
        price: itemData.price || "", // Opcional, salvo como string para flexibilidade ("10,00" ou "A partir de...")
        category: itemData.category || "Geral",
        imageUrl: itemData.imageUrl,
        isActive: false, // Nasce como Rascunho
        createdAt: serverTimestamp()
    });

    return docRef.id;
}

// --- 3. ALTERAR STATUS / VITRINE (Regra dos 20) ---
export async function toggleItemStatus(itemId, newStatus, companyId) {
    if (!companyId) throw new Error("ID da empresa necessário");

    const itemRef = doc(db, "companies", companyId, "catalog_items", itemId);

    // Se estiver tentando ATIVAR (newStatus === true), precisamos contar quantos já estão ativos
    if (newStatus === true) {
        const itemsRef = collection(db, "companies", companyId, "catalog_items");
        const q = query(itemsRef, where("isActive", "==", true));
        
        const snapshot = await getCountFromServer(q);
        const activeCount = snapshot.data().count;

        if (activeCount >= 20) {
            throw new Error("VITRINE CHEIA: Você já tem 20 itens ativos. Desative um para destacar este.");
        }
    }

    // Atualiza
    await updateDoc(itemRef, {
        isActive: newStatus
    });
}

// --- 4. LISTAR PRODUTOS (Para o Painel Admin) ---
export async function getCatalogItems(companyId) {
    const itemsRef = collection(db, "companies", companyId, "catalog_items");
    const q = query(itemsRef, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    const items = [];
    
    let activeCount = 0;
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive) activeCount++;
        items.push({ id: doc.id, ...data });
    });

    return {
        items: items,
        totalCount: items.length,
        activeCount: activeCount
    };
}

// --- 5. EDITAR PRODUTO ---
export async function updateCatalogItem(itemId, updateData, companyId) {
    const itemRef = doc(db, "companies", companyId, "catalog_items", itemId);
    await updateDoc(itemRef, updateData);
}

// --- 6. EXCLUIR PRODUTO ---
export async function deleteCatalogItem(itemId, companyId) {
    const itemRef = doc(db, "companies", companyId, "catalog_items", itemId);
    await deleteDoc(itemRef);
}
