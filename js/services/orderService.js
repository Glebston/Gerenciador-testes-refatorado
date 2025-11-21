// js/services/orderService.js
// ==========================================================
// MÓDULO ORDER SERVICE (v5.7.14 - Audit & Detailed Logic)
// ==========================================================

import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';

// --- Estado do Módulo ---
let dbCollection = null;      
let allOrders = [];           
let unsubscribeListener = null; 

// --- Funções Auxiliares de Cálculo ---

/**
 * Conta a quantidade total de itens, suportando Grade Comum e Detalhada.
 */
const countPartItems = (part) => {
    let totalQty = 0;

    // 1. Contagem para Grade Comum (Sizes Object)
    if (part.sizes && typeof part.sizes === 'object') {
        Object.values(part.sizes).forEach(sizesObj => {
            if (sizesObj && typeof sizesObj === 'object') {
                Object.values(sizesObj).forEach(qty => {
                    totalQty += (parseInt(qty) || 0);
                });
            }
        });
    }

    // 2. Contagem para Grade Detalhada (Array de Detalhes)
    // Se for do tipo detalhado, a quantidade é o número de linhas no array details
    if (part.details && Array.isArray(part.details)) {
        totalQty += part.details.length;
    }

    return totalQty;
};

const calculateOrderTotalValue = (order) => {
    let grossTotal = 0;
    if (order.parts && Array.isArray(order.parts)) {
        order.parts.forEach(part => {
            // Tenta pegar o preço específico, depois o padrão, ou assume 0
            // Para peças detalhadas, geralmente usa-se unitPrice direto no objeto da peça ou standard
            const price = parseFloat(part.unitPriceSpecific) || parseFloat(part.unitPriceStandard) || parseFloat(part.unitPrice) || 0;
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
 * Calcula o valor total pendente (A Receber) com filtro ESTRITO de datas.
 * v5.7.14: Inclui Logs de Auditoria e Correção de Status Case-Insensitive.
 */
export const calculateTotalPendingRevenue = (startDate = null, endDate = null) => {
    // [DEBUG] Inicia grupo de log para auditoria (apenas se houver datas definidas para não poluir demais)
    const isAuditing = startDate || endDate;
    if (isAuditing) console.groupCollapsed("💰 Auditoria de Cálculo A Receber");

    const total = allOrders.reduce((acc, order) => {
        // 1. Verifica Status (Ignora Cancelados e Entregues)
        // Correção: Normaliza para minúsculas para evitar erros de digitação (ex: "Entregue" vs "entregue")
        const rawStatus = order.orderStatus ? order.orderStatus.trim() : '';
        const status = rawStatus.toLowerCase();
        
        if (status === 'cancelado' || status === 'entregue') return acc;

        // 2. Verifica Filtro de Data
        if (startDate || endDate) {
            const orderDateStr = order.orderDate || order.date || (order.createdAt ? order.createdAt.split('T')[0] : null);
            
            if (!orderDateStr) return acc; // Sem data, ignora

            const orderDate = new Date(orderDateStr + 'T00:00:00');

            if (isNaN(orderDate.getTime())) return acc; // Data inválida, ignora
            
            if (startDate && orderDate < startDate) return acc;
            if (endDate && orderDate > endDate) return acc;
        }

        // 3. Calcula Valores
        const totalOrder = calculateOrderTotalValue(order);
        const paid = parseFloat(order.downPayment) || 0;
        const remaining = totalOrder - paid;

        // Só soma se houver valor positivo restante
        if (remaining > 0.01) {
            if (isAuditing) {
                console.log(`Pedido ID: ${order.id} | Cliente: ${order.clientName} | Data: ${order.orderDate} | Resta: R$ ${remaining.toFixed(2)}`);
            }
            return acc + remaining;
        }
        return acc;
    }, 0);

    if (isAuditing) {
        console.log(`%cTOTAL CALCULADO: R$ ${total.toFixed(2)}`, "color: green; font-weight: bold; font-size: 14px;");
        console.groupEnd();
    }

    return total;
};

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
