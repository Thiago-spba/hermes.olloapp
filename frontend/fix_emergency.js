const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "", // O Node não lê o .env assim, mas vamos forçar a criação do arquivo
    authDomain: "hermes-ai-agent-44a54.firebaseapp.com",
    projectId: "hermes-ai-agent-44a54",
    storageBucket: "hermes-ai-agent-44a54.appspot.com",
    messagingSenderId: "913988691512",
    appId: "1:913988691512:web:7f6f5087799516c9053805"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
    const chatRef = doc(db, 'conversations', 'tLLg1T7CUUfvagKMJgqvHn0K48I2', 'chats', 'n6tLSUcFz8qFwjvxryMR');
    try {
        await setDoc(chatRef, { lastMessage: "Recuperado pelo Hermes", updatedAt: new Date() }, { merge: true });
        console.log("✅ DOCUMENTO CRIADO COM SUCESSO!");
    } catch (e) { console.log("❌ ERRO:", e.message); }
    process.exit();
}
fix();
