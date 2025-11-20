// Importa as funções necessárias do Firestore
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';

let dbCollection = null;
let allOrders = [];
let unsubscribeListener = null;

// --- Função Auxiliar de Conversão (TENTATIVA DE CORREÇÃO ROBUSTA) ---
const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    if (typeof value === 'string') {
        // Remove R$, espaços e pontos de milhar, e troca vírgula por ponto
        // Ex: "R$ 1.200,50" -> "1200.50" -> 1200.50
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
 * Calcula o valor total pendente (Com Parser Robusto e Espião)
 */
export const calculateTotalPendingRevenue = () => {
    // console.log("[DEBUG OrderService] Calculando Receita Pendente..."); // Comentado para limpar o console
    
    let debuggedOnce = false; // Flag para não poluir o console com 39 logs

    const totalRevenue = allOrders.reduce((acc, order) => {
        if (order.status === 'Cancelado') return acc;

        // --- ESPIÃO DE DADOS (Executa apenas no primeiro item) ---
        if (!debuggedOnce && allOrders.length > 0) {
            console.log("%c[DEBUG ESPIÃO] Analisando estrutura do pedido:", "color: orange; font-weight: bold;");
            console.log("Objeto Pedido Completo:", order);
            console.log(`Campo 'total': Valor="${order.total}" | Tipo=${typeof order.total}`);
            console.log(`Campo 'amountPaid': Valor="${order.amountPaid}" | Tipo=${typeof order.amountPaid}`);
            debuggedOnce = true;
        }
        // ---------------------------------------------------------

        // Usa a função robusta em vez de parseFloat direto
        const total = parseCurrency(order.total);
        const paid = parseCurrency(order.amountPaid);
        
        const remaining = total - paid;
        return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    // Só mostra o log se o valor mudou ou na carga inicial, para não spammar
    // console.log(`[DEBUG OrderService] Total calculado: R$ ${totalRevenue}`);
    return totalRevenue;
};

/**
 * Atualiza desconto (Com Parser Robusto)
 */
export const updateOrderDiscountFromFinance = async (orderId, diffValue) => {
    if (!orderId || !dbCollection) return;

    const orderRef = doc(dbCollection, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) return;

    const orderData = orderSnap.data();
    
    // Usa o parser robusto para ler os valores atuais do banco
    const currentDiscount = parseCurrency(orderData.discount);
    const currentPaid = parseCurrency(orderData.amountPaid);
    
    const adjustment = diffValue * -1; 

    console.log(`[DEBUG OrderService] Atualizando Desconto. Atual: ${currentDiscount} + Ajuste: ${adjustment}`);

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
