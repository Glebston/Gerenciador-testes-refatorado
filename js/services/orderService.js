// Importa as funções necessárias do Firestore
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importa a instância 'db' do nosso arquivo de configuração
import { db } from '../firebaseConfig.js';

// --- Estado do Módulo ---
let dbCollection = null;      
let allOrders = [];           
let unsubscribeListener = null; 

// --- Funções Auxiliares de Cálculo ---

/**
 * Conta a quantidade total de itens dentro da estrutura complexa de tamanhos.
 */
const countPartItems = (part) => {
    let totalQty = 0;
    if (part.sizes && typeof part.sizes === 'object') {
        Object.values(part.sizes).forEach(sizesObj => {
            if (sizesObj && typeof sizesObj === 'object') {
                Object.values(sizesObj).forEach(qty => {
                    totalQty += (parseInt(qty) || 0);
                });
            }
        });
    }
    return totalQty;
};

/**
 * Calcula o valor total de um pedido baseado nas peças e no desconto.
 */
const calculateOrderTotalValue = (order) => {
    let grossTotal = 0;

    if (order.parts && Array.isArray(order.parts)) {
        order.parts.forEach(part => {
            const price = parseFloat(part.unitPriceSpecific) || parseFloat(part.unitPriceStandard) || 0;
            const qty = countPartItems(part);
            grossTotal += (price * qty);
        });
    }

    const discount = parseFloat(order.discount) || 0;
    return grossTotal - discount;
};


// --- Funções Privadas do Firestore ---

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

    }, (error) => {
        console.error("Erro ao buscar pedidos em tempo real:", error);
    });
};


// --- API Pública do Módulo ---

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
 * Calcula o valor total pendente (A Receber).
 * Lógica Ajustada: Ignora pedidos Cancelados E pedidos Entregues.
 */
export const calculateTotalPendingRevenue = () => {
    return allOrders.reduce((acc, order) => {
        // Verifica o status usando a propriedade correta 'orderStatus'
        const status = order.orderStatus || '';
        
        // Se estiver Cancelado ou Entregue, não conta como receita pendente
        if (status === 'Cancelado' || status === 'Entregue') return acc;

        // 1. Calcula o Total Real
        const total = calculateOrderTotalValue(order);

        // 2. Lê o valor pago
        const paid = parseFloat(order.downPayment) || 0;

        // 3. Saldo Devedor
        const remaining = total - paid;

        // Só soma se houver valor positivo restante
        return acc + (remaining > 0 ? remaining : 0);
    }, 0);
};

/**
 * Atualiza o desconto e o valor pago no pedido.
 */
export const updateOrderDiscountFromFinance = async (orderId, diffValue) => {
    if (!orderId || !dbCollection) return;

    const orderRef = doc(dbCollection, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) return;

    const orderData = orderSnap.data();
    
    const currentDiscount = parseFloat(orderData.discount) || 0;
    const currentPaid = parseFloat(orderData.downPayment) || 0;

    const adjustment = diffValue * -1; 

    await updateDoc(orderRef, {
        discount: currentDiscount + adjustment,
        downPayment: currentPaid + diffValue 
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
