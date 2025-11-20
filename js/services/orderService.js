// Importa as funções necessárias do Firestore
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';

let dbCollection = null;
let allOrders = [];
let unsubscribeListener = null;

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
        // DEBUG: Confirma quantos pedidos estão em cache após a atualização
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
 * Calcula o valor total pendente com logs de depuração
 */
export const calculateTotalPendingRevenue = () => {
    console.log("[DEBUG OrderService] Calculando Receita Pendente...");
    const total = allOrders.reduce((acc, order) => {
        if (order.status === 'Cancelado') return acc;
        const t = parseFloat(order.total) || 0;
        const p = parseFloat(order.amountPaid) || 0;
        const remaining = t - p;
        return acc + (remaining > 0 ? remaining : 0);
    }, 0);
    console.log(`[DEBUG OrderService] Total calculado: R$ ${total} (Baseado em ${allOrders.length} pedidos)`);
    return total;
};

/**
 * Atualiza desconto com logs de depuração
 */
export const updateOrderDiscountFromFinance = async (orderId, diffValue) => {
    console.log(`[DEBUG OrderService] Tentando atualizar desconto. OrderID: ${orderId}, Diff: ${diffValue}`);
    if (!orderId || !dbCollection) return;

    const orderRef = doc(dbCollection, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        console.error("[DEBUG OrderService] Pedido não encontrado no Firestore!");
        return;
    }

    const orderData = orderSnap.data();
    const currentDiscount = parseFloat(orderData.discount) || 0;
    const currentPaid = parseFloat(orderData.amountPaid) || 0;
    const adjustment = diffValue * -1; 

    console.log(`[DEBUG OrderService] Atualizando... Desc Antigo: ${currentDiscount}, Novo: ${currentDiscount + adjustment}`);

    await updateDoc(orderRef, {
        discount: currentDiscount + adjustment,
        amountPaid: currentPaid + diffValue
    });
    console.log("[DEBUG OrderService] Pedido atualizado com sucesso.");
};

export const cleanupOrderService = () => {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
    allOrders = [];
    dbCollection = null;
};
