// ==========================================================
// MÓDULO UI "GERENTE" / "ARQUIVO-BARRIL" (v4.3.5)
// Responsabilidade: Importar e reexportar funções de 
// todos os especialistas da UI.
// ESTE ARQUIVO NÃO CONTÉM LÓGICA.
// ==========================================================

// 1. IMPORTA OS ESPECIALISTAS

// Importa seletores do DOM e constantes
import { DOM, SIZES_ORDER, CHECK_ICON_SVG } from './ui/dom.js';

// Importa funções de modais (showInfoModal, etc.)
import * as Modals from './ui/modalHandler.js';

// Importa renderizadores do financeiro (renderFinanceDashboard, etc.)
import * as FinanceUI from './ui/financeRenderer.js';

// Importa renderizadores de pedidos (renderOrders, addOrderCard, etc.)
import * as OrderUI from './ui/orderRenderer.js';

// Importa manipuladores de formulário (addPart, updateFinancials, etc.)
import * as FormHandler from './ui/formHandler.js';

// Importa renderizadores da tabela de preços (renderPriceTable, etc.)
import * as PriceTableUI from './ui/priceTableRenderer.js';

// Importa funções ajudantes (formatPhoneNumber, updateSourceSelectionUI, etc.)
import * as Helpers from './ui/helpers.js';


// 2. REEXPORTA TUDO PARA O RESTANTE DA APLICAÇÃO (ex: main.js)

export {
    // Constantes e DOM
    DOM,
    SIZES_ORDER,
    CHECK_ICON_SVG,
    
    // Módulos
    ...Modals,
    ...OrderUI,
    ...FinanceUI,
    ...FormHandler,
    ...PriceTableUI,
    ...Helpers
};
