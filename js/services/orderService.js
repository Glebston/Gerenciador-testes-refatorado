// Importa as funções necessárias do Firestore
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importa a instância 'db' do nosso arquivo de configuração
import { db } from '../firebaseConfig.js';

// --- Estado do Módulo ---
let dbCollection = null;      // Referência à coleção de pedidos no Firestore
let allOrders = [];           // Cache local de todos os pedidos para acesso rápido
let unsubscribeListener = null; // Função para desligar o listener do Firestore no logout

// --- Funções Privadas ---

/**
 * Configura o listener em tempo real para a coleção de pedidos.
 * @param {function} granularUpdateCallback - A função (do main.js) que será chamada para cada mudança granular.
 * @param {function} getViewCallback - Função que retorna a visualização atual ('pending' ou 'delivered').
 */
const setupFirestoreListener = (granularUpdateCallback, getViewCallback) => {
    if (unsubscribeListener) unsubscribeListener(); // Garante que não haja listeners duplicados

    const q = query(dbCollection);
    unsubscribeListener = onSnapshot(q, (snapshot) => {
        
        snapshot.docChanges().forEach((change) => {
            // --- CORREÇÃO v4.2: A verificação 'hasPendingWrites' foi REMOVIDA daqui ---
            // Isso garante que o listener processe *todas* as mudanças,
            // incluindo as iniciadas pelo próprio cliente (como "Quitar e Entregar").

            const data = { id: change.doc.id, ...change.doc.data() };
            const index = allOrders.findIndex(o => o.id === data.id);

            // Gerencia o cache local
            if (change.type === 'added') {
                if (index === -1) { // Garante que não exista
                    allOrders.push(data);
                }
            } else if (change.type === 'modified') {
                if (index > -1) {
                    allOrders[index] = data; // Atualiza o item no cache
                } else {
                    // Se não existia (raro, mas pode acontecer em 'modified'), adiciona
                    allOrders.push(data);
                }
            } else if (change.type === 'removed') {
                if (index > -1) {
                    allOrders.splice(index, 1); // Remove do cache
                }
            }
            
            // Invoca o callback granular para que a UI seja atualizada
            if (granularUpdateCallback) {
                granularUpdateCallback(change.type, data, getViewCallback());
            }
        });

    }, (error) => {
        console.error("Erro ao buscar pedidos em tempo real:", error);
    });
};


// --- API Pública do Módulo ---

/**
 * Inicializa o serviço de pedidos para uma empresa específica.
 * @param {string} companyId - O ID da empresa do usuário logado.
 * @param {function} granularUpdateCallback - A função de callback granular (em main.js).
 * @param {function} getViewCallback - Função que retorna a visualização atual.
 */
export const initializeOrderService = (companyId, granularUpdateCallback, getViewCallback) => {
    dbCollection = collection(db, `companies/${companyId}/orders`);
    setupFirestoreListener(granularUpdateCallback, getViewCallback);
};

/**
 * Salva um pedido (cria um novo ou atualiza um existente).
 * @param {object} orderData - O objeto com todos os dados do pedido.
 * @param {string|null} orderId - O ID do pedido a ser atualizado, ou null para criar um novo.
 * @returns {Promise<string>} O ID do documento salvo.
 */
export const saveOrder = async (orderData, orderId) => {
    if (orderId) {
        // Atualiza um pedido existente
        await updateDoc(doc(dbCollection, orderId), orderData);
        return orderId;
    } else {
        // Adiciona um novo pedido
        const docRef = await addDoc(dbCollection, orderData);
        return docRef.id;
    }
};

/**
 * Exclui um pedido do Firestore.
 * @param {string} id - O ID do pedido a ser excluído.
 */
export const deleteOrder = async (id) => {
    if (!id) return;
    await deleteDoc(doc(dbCollection, id));
};

/**
 * Busca um único pedido no cache local pelo seu ID.
 * @param {string} id - O ID do pedido.
 * @returns {object|undefined} O objeto do pedido ou undefined se não for encontrado.
 */
export const getOrderById = (id) => {
    return allOrders.find(o => o.id === id);
};

/**
 * Retorna a lista completa de todos os pedidos do cache local.
 * @returns {Array}
 */
export const getAllOrders = () => {
    return [...allOrders]; // Retorna cópia
};

/**
 * Calcula o valor total pendente (A Receber) de todos os pedidos ativos.
 * Usado para alimentar o KPI "A Receber (Pendentes)" no Dashboard Financeiro.
 * @returns {number} Soma dos valores restantes.
 */
export const calculateTotalPendingRevenue = () => {
    return allOrders.reduce((acc, order) => {
        // Ignora pedidos cancelados ou deletados logicamente
        if (order.status === 'Cancelado') return acc;

        const total = parseFloat(order.total) || 0;
        const paid = parseFloat(order.amountPaid) || 0;
        const remaining = total - paid;

        // Só soma se houver valor positivo restante
        return acc + (remaining > 0 ? remaining : 0);
    }, 0);
};

/**
 * Atualiza o desconto e o valor pago de um pedido baseado em ajuste financeiro.
 * Usado quando uma transação é editada no extrato (ex: taxa de cartão).
 * @param {string} orderId - ID do pedido.
 * @param {number} diffValue - Diferença de valor (Novo - Antigo). Se negativo, aumentou a taxa/desconto.
 */
export const updateOrderDiscountFromFinance = async (orderId, diffValue) => {
    if (!orderId || !dbCollection) return;

    const orderRef = doc(dbCollection, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) return;

    const orderData = orderSnap.data();
    const currentDiscount = parseFloat(orderData.discount) || 0;
    const currentPaid = parseFloat(orderData.amountPaid) || 0;

    // Lógica de Negócio:
    // Se o usuário REDUZIU o valor recebido na transação (diffValue negativo),
    // isso significa que houve uma taxa. O desconto do pedido deve AUMENTAR.
    // E o valor contabilizado como "Pago" no pedido deve DIMINUIR.
    
    // Exemplo: Pedido 100. Pago 100.
    // Usuário edita transação para 95 (diff = -5).
    // Novo Desconto = 0 + 5 = 5.
    // Novo Pago = 100 - 5 = 95.
    // Novo Saldo = 100 - 5(desc) - 95(pago) = 0. (Mantém balanceado)

    // Invertemos o diffValue para somar ao desconto (se diff for -5, taxa é 5)
    const adjustment = diffValue * -1; 

    await updateDoc(orderRef, {
        discount: currentDiscount + adjustment,
        amountPaid: currentPaid + diffValue
    });
};

/**
 * Limpa o estado do serviço e desliga o listener. Essencial para o logout.
 */
export const cleanupOrderService = () => {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
    allOrders = [];
    dbCollection = null;
};
