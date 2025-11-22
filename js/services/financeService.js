// js/services/financeService.js
// ==========================================================
// MÓDULO FINANCE SERVICE (v5.12.0 - BATCHED UPDATES)
// ==========================================================

import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, writeBatch, getDocs, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';

// --- Estado do Módulo ---
let transactionsCollection = null; 
let companyRef = null;             
let allTransactions = [];          
let unsubscribeListener = null;    

// --- Funções Privadas ---

const setupTransactionsListener = (granularUpdateCallback, getBankBalanceConfig) => {
    if (unsubscribeListener) unsubscribeListener();

    const q = query(transactionsCollection);
    
    unsubscribeListener = onSnapshot(q, (snapshot) => {
        let hasChanges = false;
        let lastChangeType = 'modified'; // Default fallback
        let lastChangedData = null;

        // 1. Processa todas as mudanças no Cache Local PRIMEIRO
        snapshot.docChanges().forEach((change) => {
            hasChanges = true;
            const data = { id: change.doc.id, ...change.doc.data() };
            const index = allTransactions.findIndex(t => t.id === data.id);

            if (change.type === 'added') {
                if (index === -1) allTransactions.push(data);
            } else if (change.type === 'modified') {
                if (index > -1) allTransactions[index] = data;
                else allTransactions.push(data);
            } else if (change.type === 'removed') {
                if (index > -1) allTransactions.splice(index, 1);
            }
            
            // Guarda referência da última mudança para passar ao callback (simbólico em lote)
            lastChangeType = change.type;
            lastChangedData = data;
        });
        
        // 2. Só avisa o Main.js SE houve mudanças e DEPOIS de processar tudo
        if (hasChanges) {
            // Ordena o cache antes de notificar
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (granularUpdateCallback) {
                // Envia apenas UMA notificação consolidada. 
                // Isso evita "martelar" o main.js com 50 chamadas na inicialização.
                granularUpdateCallback(lastChangeType, lastChangedData, getBankBalanceConfig());
            }
        } else if (snapshot.size === 0 && allTransactions.length === 0) {
             // Caso especial: Primeira carga e banco vazio
             if (granularUpdateCallback) {
                granularUpdateCallback('loaded_empty', null, getBankBalanceConfig());
             }
        }

    }, (error) => {
        console.error("Erro ao carregar transações:", error);
    });
};


// --- API Pública do Módulo ---

export const initializeFinanceService = (companyId, granularUpdateCallback, getBankBalanceConfig) => {
    transactionsCollection = collection(db, `companies/${companyId}/transactions`);
    companyRef = doc(db, "companies", companyId);
    setupTransactionsListener(granularUpdateCallback, getBankBalanceConfig);
};

export const saveTransaction = async (transactionData, transactionId) => {
    if (!transactionsCollection) return;
    if (transactionId) {
        await updateDoc(doc(transactionsCollection, transactionId), transactionData);
    } else {
        await addDoc(transactionsCollection, transactionData);
    }
};

export const deleteTransaction = async (id) => {
    if (!id || !transactionsCollection) return;
    await deleteDoc(doc(transactionsCollection, id));
};

export const markTransactionAsPaid = async (id) => {
    if (!id || !transactionsCollection) return;
    const transactionRef = doc(transactionsCollection, id);
    await updateDoc(transactionRef, {
        status: 'pago',
        date: new Date().toISOString().split('T')[0]
    });
};

export const saveInitialBalance = async (newBalance) => {
    if (!companyRef) return;
    await updateDoc(companyRef, {
        bankBalanceConfig: {
            initialBalance: newBalance
        }
    });
};

export const getTransactionByOrderId = async (orderId) => {
    if (!transactionsCollection) return null;
    const q = query(
        transactionsCollection, 
        where("orderId", "==", orderId),
        where("category", "==", "Adiantamento de Pedido")
    );
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar transação por orderId:", error);
        return null;
    }
};

export const deleteAllTransactionsByOrderId = async (orderId) => {
    if (!transactionsCollection || !orderId) return;
    const q = query(
        transactionsCollection, 
        where("orderId", "==", orderId)
    );
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return;

        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Erro ao excluir transações por orderId:", error);
        throw new Error("Falha ao excluir finanças vinculadas.");
    }
};

export const getTransactionById = (id) => {
    return allTransactions.find(t => t.id === id);
};

export const getAllTransactions = () => {
    return [...allTransactions]; 
};

export const cleanupFinanceService = () => {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
    allTransactions = [];
    transactionsCollection = null;
    companyRef = null;
};
