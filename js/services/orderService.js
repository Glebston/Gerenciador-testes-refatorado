// js/services/orderService.js
// ==========================================================
// MÓDULO ORDER SERVICE (v5.22.1 - DIAGNOSTIC MODE)
// ==========================================================

import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebaseConfig.js';

// --- Estado do Módulo ---
let dbCollection = null;      
let allOrders = [];           
let unsubscribeListener = null; 

// --- Funções Auxiliares de Cálculo ---

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
    if (part.details && Array.isArray(part.details)) {
        totalQty += part.details.length;
    }
    return totalQty;
};

const calculateOrderTotalValue = (order) => {
    let grossTotal = 0;
    if (order.parts && Array.isArray(order.parts)) {
        order.parts.forEach(part => {
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

// --- O RASTREADOR ESTÁ AQUI ---
export const calculateTotalPendingRevenue = (startDate = null, endDate = null) => {
    if (allOrders.length === 0) {
        console.log("🕵️ [DIAGNÓSTICO] Lista de pedidos vazia.");
        return 0;
    }

    console.groupCollapsed("🕵️ [DIAGNÓSTICO] Calculando A Receber (Acumulativo)");
    console.log(`Total de Pedidos no Banco: ${allOrders.length}`);

    const total = allOrders.reduce((acc, order) => {
        const rawStatus = order.orderStatus ? order.orderStatus.trim() : '';
        const status = rawStatus.toLowerCase();
        const client = order.clientName || 'Sem Nome';
        
        // Log individual para ver quem está sendo ignorado
        if (status === 'cancelado' || status === 'entregue') {
            console.log(`❌ Ignorado (Status): ${client} - Status: ${status}`);
            return acc;
        }

        const totalOrder = calculateOrderTotalValue(order);
        const paid = parseFloat(order.downPayment) || 0; 
        const remaining = totalOrder - paid;

        console.log(`✅ Processando: ${client} | Total: ${totalOrder} | Pago: ${paid} | Resta: ${remaining}`);

        if (remaining > 0.01) {
            return acc + remaining;
        } else {
            console.log(`⚠️ Ignorado (Sem Saldo): ${client} | Resta: ${remaining}`);
        }
        return acc;
    }, 0);

    console.log(`💰 TOTAL FINAL CALCULADO: R$ ${total.toFixed(2)}`);
    console.groupEnd();

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

    let updates = {
        downPayment: currentPaid + diffValue
    };

    if (diffValue < 0) {
        const adjustment = Math.abs(diffValue);
        updates.discount = currentDiscount + adjustment;
    } else if (diffValue > 0) {
        let newDiscount = currentDiscount - diffValue;
        if (newDiscount < 0) newDiscount = 0;
        updates.discount = newDiscount;
    }

    await updateDoc(orderRef, updates);
};

export const cleanupOrderService = () => {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
    allOrders = [];
    dbCollection = null;
};
