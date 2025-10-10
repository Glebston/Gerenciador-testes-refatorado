import { DOM } from './ui.js';
import { handleLogout } from './auth.js';

// --- Lógica do Timer de Inatividade ---

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
const COUNTDOWN_SECONDS = 60;
let idleTimeout, countdownInterval;

const startCountdown = () => {
    DOM.idleModal.classList.remove('hidden');
    let secondsLeft = COUNTDOWN_SECONDS;
    DOM.countdownTimer.textContent = secondsLeft;

    countdownInterval = setInterval(() => {
        secondsLeft--;
        DOM.countdownTimer.textContent = secondsLeft;
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            handleLogout();
        }
    }, 1000);
};

export const resetIdleTimer = () => {
    clearTimeout(idleTimeout);
    clearInterval(countdownInterval);
    DOM.idleModal.classList.add('hidden');
    idleTimeout = setTimeout(startCountdown, IDLE_TIMEOUT_MS);
};


// --- Utilitários de Lógica de Pedidos ---

const SIZES_ORDER = [
    'PP', 'P', 'M', 'G', 'GG', 'XG',
    '2 anos', '4 anos', '6 anos', '8 anos', '10 anos', '12 anos'
];

export const getDeliveryCountdown = (deliveryDate) => {
    if (!deliveryDate) return { text: 'Sem data', color: 'gray' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate + 'T00:00:00');
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Atrasado há ${Math.abs(diffDays)} dia(s)`, color: 'red' };
    if (diffDays === 0) return { text: 'Entrega hoje', color: 'red' };
    if (diffDays === 1) return { text: 'Resta 1 dia', color: 'yellow' };
    if (diffDays <= 3) return { text: `Restam ${diffDays} dias`, color: 'yellow' };
    return { text: `Restam ${diffDays} dias`, color: 'green' };
};

export const sortSizes = (sizesObject) => {
    return Object.entries(sizesObject).sort((a, b) => {
        const indexA = SIZES_ORDER.indexOf(a[0]);
        const indexB = SIZES_ORDER.indexOf(b[0]);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
};


// --- Utilitários de Upload de Imagem ---

const IMGBB_API_KEY = "f012978df48f3596b193c06e05589442";

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

export const uploadToImgBB = async (file) => {
    const base64Image = await fileToBase64(file);
    const formData = new FormData();
    formData.append('image', base64Image);
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            return data.data.url;
        }
        throw new Error(data.error.message);
    } catch (error) {
        console.error('Erro no upload para ImgBB:', error);
        return null;
    }
};