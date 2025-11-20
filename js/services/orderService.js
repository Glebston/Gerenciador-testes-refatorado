// Importa as funções necessárias do Firestore
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';

let dbCollection = null;
let allOrders = [];
let unsubscribeListener = null;

// --- Função Auxiliar de Conversão ---
const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    if (typeof value === 'string') {
        const cleanString = value.replace(/[R$\s.]/g, '').replace(',', '.');
        const number = parseFloat(cleanString);
        return isNaN(number) ? 0 : number;
    }
    return 0;
};

const setupFirestoreListener = (granularUpdateCallback, getViewCallback) => {
    if (unsubscribeListener) unsubscribeListener();

    const q = query(dbCollection);
    unsubscribeListener = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = { id: change.doc.id, ...change.doc.data() };
            const index = allOrders.findIndex(o => o.id === data.id);

            if (change.type === 'added') {
                if (index === -1) allOrders.push(data);
            } else if (change.type === 'modified') {
                if (index > -1) allOrders[index] = data;
                else allOrders.push(data);
            } else if (change.type === 'removed') {
                if (index > -1) allOrders.splice(index, 1);
            }
            
            if (granularUpdateCallback) {
                granularUpdateCallback(change.type, data, getViewCallback());
            }
        });
        console.log(`[DEBUG OrderService] Cache atualizado. Total de pedidos: ${allOrders.length}`);

    }, (error) => {
        console.error("Erro ao buscar pedidos em tempo real:", error);
    });
};

export const initializeOrderService = (companyId, granularUpdateCallback, getViewCallback) => {
    dbCollection = collection(db, `companies/${companyId}/orders`);
    setupFirestoreListener(granularUpdateCallback, getViewCallback);
};

export const saveOrder = async (orderData, orderId) => {
    if (orderId) {
        await updateDoc(doc(dbCollection, orderId), orderData);
        return orderId;
    } else {
        const docRef = await addDoc(dbCollection, orderData);
        return docRef.id;
    }
};

export const deleteOrder = async (id) => {
    if (!id) return;
    await deleteDoc(doc(dbCollection, id));
};

export const getOrderById = (id) => {
    return allOrders.find(o => o.id === id);
};

export const getAllOrders = () => {
    return [...allOrders];
};

/**
 * Calcula o valor total pendente (COM RAIO-X DE ESTRUTURA)
 */
export const calculateTotalPendingRevenue = () => {
    let debuggedOnce = false;

    const totalRevenue = allOrders.reduce((acc, order) => {
        if (order.status === 'Cancelado') return acc;

        // --- SUPER ESPIÃO (RAIO-X) ---
        // Executa apenas no primeiro pedido válido encontrado para não travar seu navegador
        if (!debuggedOnce && allOrders.length > 0) {
            console.group("%c[DEBUG RAIO-X] ESTRUTURA DO PEDIDO", "color: red; font-size: 14px; font-weight: bold;");
            console.log("1. Quais chaves existem neste pedido?", Object.keys(order));
            console.log("2. Conteúdo completo (JSON):", JSON.stringify(order, null, 2));
            console.groupEnd();
            debuggedOnce = true;
        }
        // -----------------------------

        // Tenta ler com os nomes padrão (vai falhar se os nomes forem outros, mas o Raio-X vai nos contar)
        const total = parseCurrency(order.total); 
        const paid = parseCurrency(order.amountPaid);
        
        const remaining = total - paid;
        return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    return totalRevenue;
};

/**
 * Atualiza desconto (Com parser seguro)
 */
export const updateOrderDiscountFromFinance = async (orderId, diffValue) => {
    if (!orderId || !dbCollection) return;

    const orderRef = doc(dbCollection, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) return;

    const orderData = orderSnap.data();
    const currentDiscount = parseCurrency(orderData.discount);
    const currentPaid = parseCurrency(orderData.amountPaid);
    
    const adjustment = diffValue * -1; 

    console.log(`[DEBUG OrderService] Atualizando Desconto. Ajuste: ${adjustment}`);

    await updateDoc(orderRef, {
        discount: currentDiscount + adjustment,
        amountPaid: currentPaid + diffValue
    });
};

export const cleanupOrderService = () => {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
    allOrders = [];
    dbCollection = null;
};
