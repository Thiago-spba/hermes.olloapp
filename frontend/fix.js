const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// ATENÇÃO: Substitua pelos dados do seu Firebase Console
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "hermes-ai-agent-44a54.firebaseapp.com",
    projectId: "hermes-ai-agent-44a54",
    storageBucket: "hermes-ai-agent-44a54.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
    console.log("🚀 Iniciando correção de documento...");
    const chatRef = doc(db, 'conversations', 'tLLg1T7CUUfvagKMJgqvHn0K48I2', 'chats', 'n6tLSUcFz8qFwjvxryMR');
    
    try {
        await setDoc(chatRef, { 
            lastMessage: "Sessão recuperada pelo Agente Hermes", 
            updatedAt: new Date() 
        }, { merge: true }, { merge: true });
        console.log("✅ Documento criado/atualizado com sucesso no Firestore!");
    } catch (error) {
        console.error("❌ Erro ao salvar:", error);
    }
    process.exit();
}
fix();

