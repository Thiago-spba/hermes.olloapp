# 🏛️ HERMES AI AGENT

> _"Não há problema sem solução. Apresente o seu."_

🔗 **[hermes.olloapp.com.br](https://hermes.olloapp.com.br)**

---

## ⚡ O que é o Hermes?

O **Hermes AI Agent** é um assistente de inteligência artificial pessoal **100% self-hosted**, desenvolvido do zero por Thiago Fernando. Roda integralmente no **Oracle Cloud Free Tier** — sem custo de infraestrutura — e integra múltiplos modelos de IA de ponta via API, com streaming de respostas em tempo real.

**Diferencial:** privacidade total, sem limites artificiais, com 6 modelos de IA intercambiáveis em tempo real.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO (Browser/PWA)                │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│              Firebase Hosting (Frontend)                │
│              hermes.olloapp.com.br                      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / SSE Streaming
┌───────────────────────▼─────────────────────────────────┐
│         Nginx (Proxy Reverso + SSL)                     │
│         Oracle Cloud ARM A1 — 147.15.84.45              │
└───────────────────────┬─────────────────────────────────┘
                        │ :3001
┌───────────────────────▼─────────────────────────────────┐
│         Node.js + Express 5 (Backend API)               │
│         PM2 — Gerenciamento de Processos 24/7           │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  Groq API   Anthropic   Mistral AI  Cohere AI
  (Sênior)   (3 modelos) (Jr)        (Analiza)
       │
       ▼
  SQLite Local + Firestore
  (histórico, memória, base de conhecimento)
```

---

## 🛠️ Stack Tecnológica Completa

| Camada          | Tecnologia                   | Versão    | Função                                       |
| --------------- | ---------------------------- | --------- | -------------------------------------------- |
| Frontend        | React + Vite                 | 19 / 8    | PWA — Interface responsiva dark/light        |
| Hosting         | Firebase Hosting             | Spark     | CDN global, deploy automático                |
| DNS             | GoDaddy CNAME                | —         | hermes.olloapp.com.br                        |
| Runtime         | Node.js                      | v20.20.2  | Backend ESM (type: module)                   |
| Framework       | Express                      | 5         | API REST + SSE Streaming                     |
| Processo        | PM2                          | —         | Gerenciador 24/7 com auto-restart            |
| Proxy           | Nginx                        | —         | HTTPS, SSL, proxy reverso                    |
| Servidor        | Oracle Cloud ARM A1          | Free Tier | 4 OCPUs / 24GB RAM                           |
| IA Analiza      | Cohere command-a-03-2025     | —         | 🔎 Thiago Analiza — análise profunda         |
| IA Jr           | Mistral mistral-small-latest | —         | ⚙️ Thiago Jr — respostas rápidas e gratuitas |
| IA Sênior       | Groq llama-3.3-70b           | —         | 🧠 Thiago Sênior — raciocínio avançado       |
| IA Doutor       | Claude Haiku 4.5             | —         | 🎓 Thiago Doutor — padrão do sistema         |
| IA Especialista | Claude Sonnet 4.6            | —         | 🔬 Thiago Especialista                       |
| IA Supremo      | Claude Opus 4.7              | —         | 👑 Thiago Supremo — protegido por senha      |
| Áudio           | Groq Whisper large-v3-turbo  | —         | Transcrição de áudio WAV                     |
| Banco Local     | SQLite (better-sqlite3)      | —         | Histórico, memória, base de conhecimento     |
| Banco Cloud     | Firestore                    | —         | Histórico de conversas por usuário           |
| Auth            | Firebase Auth + Admin SDK    | —         | Google + Email/Password — JWT verificado     |

---

## 🚀 Funcionalidades

### 🤖 Inteligência Artificial

- **6 modelos intercambiáveis** em tempo real via seletor no rodapé
- **Streaming SSE** — respostas token a token, sem espera
- **Fallback automático** — Claude falha → Mistral automaticamente
- **Análise de imagens** — detecção automática usa modelo multimodal
- **Transcrição de áudio** — gravação WAV → Groq Whisper → texto

### 📖 Modo Estudo

- Ativado via botão 💡 no menu com card de confirmação
- Toda resposta segue formato obrigatório:
  - **CONCEITO** — explicação clara e direta
  - **EXEMPLO** — caso prático do mundo real
  - **EXERCICIO** — questão para fixar o conteúdo
- Badge visual na tela quando ativo com botão de desativar rápido

### 🧠 Memória e Contexto

- **Memória automática** — extrai fatos da conversa em background
- **Comando `/lembrar`** — salva informações manualmente
- **Base de Conhecimento** — PDFs, TXTs e textos digitados persistentes
- **RAG** — busca chunks relevantes antes de responder
- **Histórico de conversas** — salvo no Firestore por usuário
- **Retomada automática** — ao recarregar a página, retoma a conversa atual

### 📷 Entrada Multimodal

- **Câmera integrada** — viewfinder com grade, zoom 1-3x, lanterna
- **Ctrl+V** — cola imagens diretamente do clipboard
- **Drag & Drop** — arrasta arquivos para o chat
- **Upload de arquivos** — PDF, TXT, imagens, código (até 50MB)

### 🔐 Segurança

- **Firebase Auth** — token JWT verificado em cada requisição
- **CORS blindado** — apenas origens autorizadas
- **Rate limiting** — 100 req/15min global, 20 req/15min no chat
- **Helmet.js** — headers de segurança HTTP
- **Isolamento por usuário** — cada conta tem dados 100% separados
- **Senha para modelo Supremo** — Claude Opus protegido por senha

### 🎨 Interface

- **Dark/Light mode** — com persistência de preferência
- **Markdown completo** — negrito, listas, tabelas, código
- **LaTeX/KaTeX** — equações matemáticas renderizadas
- **Monitor cardíaco animado** — indicador visual durante processamento
- **Indicador de modelo** — tag mostra qual IA respondeu
- **Controle de voz** — seletor de voz, velocidade 0.7x-2.0x, TTS
- **Zoom de texto** — P / M / G / GG
- **Wake Lock** — mantém tela ativa no celular

---

## 📂 Estrutura de Arquivos

```
hermes-ai-agent/
├── backend/
│   ├── index.js
│   ├── hermes.sqlite
│   ├── firebase-adminsdk.json        # ⚠️ NÃO commitar
│   ├── .env                          # ⚠️ NÃO commitar
│   └── src/
│       ├── app.js
│       ├── routes/
│       │   ├── chat.js               # SSE, studyMode, RAG, memória
│       │   └── auth.js
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── cors.js
│       │   └── sanitize.js
│       └── services/
│           ├── ollama.js             # 6 modelos, fallback, Modo Estudo
│           ├── whisper.js
│           ├── database.js
│           └── pdfService.js
│
└── frontend/
    └── src/
        ├── App.jsx                   # Tema, auth, studyMode, retomada
        ├── hooks/
        │   ├── useChat.js            # Estado da conversa, streaming
        │   └── useConversation.js    # Histórico, sessões, localStorage
        ├── services/
        │   ├── api.js                # HTTP, SSE, studyMode
        │   ├── firebase.js
        │   └── firestoreService.js   # Conversas no Firestore
        └── components/
            ├── ChatInput.jsx
            ├── ChatMessage.jsx
            ├── Header.jsx            # Menu, Modo Estudo, voz, fonte
            ├── ModelSelector.jsx     # Seletor 6 modelos
            ├── KnowledgePanel.jsx
            ├── Login.jsx
            └── ConversationList.jsx
```

---

## ⚙️ Variáveis de Ambiente (.env)

```env
PORT=3001
NODE_ENV=production
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
COHERE_API_KEY=...
JWT_SECRET=...
CORS_ORIGIN=https://hermes.olloapp.com.br
DB_PATH=./hermes.sqlite
UPLOADS_PATH=./uploads
```

---

## 🔧 Comandos Essenciais

### SSH

```bash
ssh -i C:\Users\Home\Downloads\ssh-key-2026-04-23.key ubuntu@147.15.84.45
```

### Backend

```bash
pm2 status
pm2 restart hermes
pm2 logs --lines 20 --nostream
curl -s http://localhost:3001/api/health
```

### Enviar arquivo para servidor

```bash
scp -i C:\Users\Home\Downloads\ssh-key-2026-04-23.key \
  C:\hermes-ai-agent\backend\src\services\ollama.js \
  ubuntu@147.15.84.45:~/hermes/backend/src/services/ollama.js
```

### Deploy frontend

```bash
cd C:\hermes-ai-agent\frontend
npm run build && firebase deploy
```

---

## 📊 Limites das APIs

| Modelo                      | Limite                    | Reset        |
| --------------------------- | ------------------------- | ------------ |
| 🔎 Cohere Analiza (Trial)   | Rate limit moderado       | —            |
| ⚙️ Mistral Jr (Free)        | Rate limit por capacidade | —            |
| 🧠 Groq Sênior              | 100.000 tokens/dia        | 21h Brasília |
| 🎓 Claude Haiku/Sonnet/Opus | Sem limite diário         | Pago por uso |

> ⚠️ Fallback automático ativo: Claude falha → Mistral Jr

---

## 🔐 Segurança — Boas Práticas

- ✅ `.env` e `firebase-adminsdk.json` no `.gitignore`
- ✅ Repositório **privado** no GitHub
- ✅ JWT verificado em toda requisição
- ✅ Rate limiting ativo
- ✅ CORS restrito às origens autorizadas
- ✅ Isolamento total por usuário
- ✅ Modelo Supremo protegido por senha

---

## 👨‍💻 Autor

**Thiago Fernando**  
Engenheiro da Computação & Desenvolvedor Front-End  
São Paulo, Brasil

---

_Hermes AI Agent — Infraestrutura privada, dados sob seu controle._
