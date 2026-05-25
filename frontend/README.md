# 🏛️ Hermes AI — Agente de Inteligência Artificial

> **"Não há problema sem solução. Apresente o seu."**

![Deploy Firebase](https://img.shields.io/badge/Deploy-Firebase_Hosting-orange?style=for-the-badge&logo=firebase)
![Oracle Cloud](https://img.shields.io/badge/Backend-Oracle_Cloud_ARM-red?style=for-the-badge&logo=oracle)
![Ollama Local](https://img.shields.io/badge/IA-Ollama_Local-blueviolet?style=for-the-badge&logo=ollama)
![Status Online](https://img.shields.io/badge/Status-Online-green?style=for-the-badge)

---

## ⚡ Visão Geral

O **Hermes AI** é um ecossistema de inteligência artificial soberano. Diferente de soluções comerciais, o Hermes roda 100% em infraestrutura privada, garantindo que seus dados nunca saiam do seu controle. Ele utiliza modelos de última geração para processar texto, visão computacional e documentos complexos — sem custos por mensagem e sem dependência de APIs externas.

🔗 **Acesse agora:** [hermes.olloapp.com.br](https://hermes.olloapp.com.br)

---

## 🏗️ Arquitetura do Sistema

```
PWA Frontend (React 19)
        │
        ├──── Firebase (Auth + Hosting)
        │
        └──── Backend Node.js (Oracle Cloud)
                    │
                    ├──── Firebase Admin SDK (Verificação JWT)
                    │
                    └──── Ollama Engine (Inferência Local)
                                │
                                ├──── dolphin-llama3:8b  (Texto)
                                └──── llama3.2-vision:11b (Visão)
```

---

## 🛠️ Stack Tecnológica

| Camada         | Tecnologia          | Propósito                                      |
| -------------- | ------------------- | ---------------------------------------------- |
| Frontend       | React 19 + Vite 8   | Interface ultra-veloz e PWA instalável         |
| Infraestrutura | Oracle Cloud ARM    | VPS Ampere A1 — 4 OCPUs / 24GB RAM (Free)      |
| Backend        | Node.js + Express 5 | API robusta com gestão de processos via PM2    |
| Segurança      | Firebase Admin SDK  | Validação de identidade via tokens JWT         |
| IA (Texto)     | dolphin-llama3:8b   | Respostas técnicas, sem censura, alta precisão |
| IA (Visão)     | llama3.2-vision:11b | Análise de imagens, prints e diagramas         |
| Banco de Dados | Firestore + SQLite  | Histórico na nuvem + logs locais               |

---

## 🚀 Funcionalidades de Elite

### 🧠 Inteligência Multimodal

- **Texto:** Respostas técnicas e precisas com `dolphin-llama3:8b`
- **Visão:** Envie prints, fotos ou diagramas para análise com `llama3.2-vision:11b`
- **Documentos:** Leitura nativa de PDF, TXT e código-fonte

### 🛡️ Segurança e Privacidade

- **Autenticação Firebase:** Tokens JWT validados em tempo real a cada requisição
- **Isolamento de Dados:** Cada usuário possui silo exclusivo no Firestore
- **CORS Blindado:** Backend configurado para rejeitar qualquer acesso não autorizado

### 📱 Experiência do Usuário

- **Dark/Light Mode:** Transição suave com persistência de preferência
- **Máquina de Escrever:** Respostas com efeito de digitação fluida
- **Histórico Inteligente:** Descarta conversas vazias e organiza por data
- **Offline Ready:** PWA instalável com Service Worker

---

## 📂 Estrutura do Projeto

```
hermes-ai-agent/
├── 🌐 frontend/
│   ├── src/
│   │   ├── components/      # UI: Header, Login, Chat, History
│   │   ├── hooks/           # Lógica: useChat, useConversation
│   │   └── services/        # Integração: Firebase, API Axios
│   └── public/              # PWA Manifest & Service Workers
│
└── ⚙️ backend/
    ├── index.js             # Servidor Principal (Express 5 + CORS)
    ├── firebase-adminsdk.json
    └── hermes.sqlite        # Logs locais de estabilidade
```

---

## 🔧 Deploy

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Backend (Oracle Cloud via SSH)

```bash
# Envio do arquivo atualizado
scp ./index.js ubuntu@147.15.84.45:/home/ubuntu/hermes/backend/

# Reinício seguro
pm2 restart hermes && pm2 save
```

### Verificar saúde da API

```bash
curl https://api.hermes.olloapp.com.br/api/health
# Esperado: {"status":"ok","engine":"Hermes Prime"}
```

---

## 📈 Próximos Passos

- [ ] **Whisper V3** — Transcrição de áudio com precisão humana (PT-BR)
- [ ] **Piper TTS** — Respostas por voz sintetizada localmente
- [ ] **Rate Limiting** — Proteção contra sobrecarga de requisições no backend

---

## 👨‍💻 Autor

**Thiago Fernando**
Engenheiro de Computação & Desenvolvedor Front-End
[github.com/Thiago-spba](https://github.com/Thiago-spba) · [portfolio-thiagosp.vercel.app](https://portfolio-thiagosp.vercel.app)
