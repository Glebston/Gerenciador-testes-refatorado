import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- ATENÇÃO: CONFIGURAÇÃO PARA AMBIENTE DE TESTES ---
const firebaseConfig = {
  apiKey: "AIzaSyDZrgh2y3d0fiv5uF_d73Syuo54_39L__8",
  authDomain: "saas-teste-c8d7a.firebaseapp.com",
  projectId: "saas-teste-c8d7a",
  storageBucket: "saas-teste-c8d7a.appspot.com",
  messagingSenderId: "281601947474",
  appId: "1:281601947474:web:1e580dbb06b685bf5d2c8b"
};

// Inicializa os serviços do Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exporta as instâncias para serem usadas em outros módulos da aplicação
export { db, auth };