# 🏛️ HERMES AI AGENT

> *"Não há problema sem solução. Apresente o seu."*


🔗 **[hermes.olloapp.com.br](https://hermes.olloapp.com.br)**

---

## ⚡ O que é o Hermes?

O **Hermes AI Agent** é um assistente de inteligência artificial pessoal **100% self-hosted**, desenvolvido do zero por Thiago Fernando. Roda integralmente no **Oracle Cloud Free Tier** — sem custo de infraestrutura — e integra múltiplos modelos de IA de ponta via API, com streaming de respostas em tempo real.

**Diferencial:** privacidade total, sem limites artificiais, com 5 modelos de IA intercambiáveis em tempo real.

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
└──────┬──────────────┬─────────────────┬─────────────────┘
       │              │                 │
       ▼              ▼                 ▼
  Groq API      Anthropic API     Firebase Admin
  (5 modelos)   (Claude)          (Auth JWT)
       │
       ▼
  SQLite Local
  (histórico, memória, base de conhecimento)
```

---

## 🛠️ Stack Tecnológica Completa

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| Frontend | React + Vite | 19 / 8 | PWA — Interface responsiva dark/light |
| Hosting | Firebase Hosting | Spark | CDN global, deploy automático |
| DNS | GoDaddy CNAME | — | hermes.olloapp.com.br |
| Runtime | Node.js | v20.20.2 | Backend ESM (type: module) |
| Framework | Express | 5 | API REST + SSE Streaming |
| Processo | PM2 | — | Gerenciador 24/7 com auto-restart |
| Proxy | Nginx | — | HTTPS, SSL, proxy reverso |
| Servidor | Oracle Cloud ARM A1 | Free Tier | 4 OCPUs / 24GB RAM |
| IA Texto | Groq llama-3.3-70b | — | Thiago Sênior — respostas rápidas |
| IA Fallback | Groq llama-3.1-8b | — | Thiago Jr — fallback automático 429/503/413 |
| IA Visão | Groq llama-4-scout-17b | — | Análise de imagens (autodetecção) |
| IA Premium | Claude Haiku 4.5 | — | Thiago Doutor — padrão do sistema |
| IA Premium | Claude Sonnet 4.6 | — | Thiago Especialista |
| IA Premium | Claude Opus 4.7 | — | Thiago Supremo — protegido por senha |
| Áudio | Groq Whisper large-v3-turbo | — | Transcrição de áudio WAV |
| Banco | SQLite (better-sqlite3) | — | Local — 5 tabelas persistentes |
| Auth | Firebase Auth + Admin SDK | — | Google + Email/Password — JWT verificado |

---

## 🚀 Funcionalidades

### 🤖 Inteligência Artificial
- **5 modelos intercambiáveis** em tempo real via seletor no rodapé
- **Streaming SSE** — respostas token a token, sem espera
- **Fallback automático** — troca de modelo ao atingir limite (429/503/413)
- **Análise de imagens** — detecção automática usa modelo multimodal
- **Transcrição de áudio** — gravação WAV → Groq Whisper → texto

### 🧠 Memória e Contexto
- **Memória automática** — extrai fatos da conversa em background
- **Comando `/lembrar`** — salva informações manualmente (`/lembrar nome: Thiago`)
- **Base de Conhecimento** — PDFs, TXTs e textos digitados persistentes por usuário
- **RAG (Retrieval Augmented Generation)** — busca chunks relevantes antes de responder
- **Edição de textos** — itens de texto na base podem ser editados ou excluídos
- **Histórico de conversas** — salvo por usuário com navegação

### 📷 Entrada Multimodal
- **Câmera integrada** — viewfinder com grade, zoom 1-3x, lanterna, câmera frontal/traseira
- **Ctrl+V** — cola imagens diretamente do clipboard
- **Drag & Drop** — arrasta arquivos para o chat
- **Upload de arquivos** — PDF, TXT, imagens, código (até 50MB)

### 🔐 Segurança
- **Firebase Auth** — token JWT verificado em cada requisição
- **CORS blindado** — GET, POST, PUT, DELETE apenas para origens autorizadas
- **Sanitização de inputs** — `express-validator` valida todos os campos
- **Rate limiting** — 100 req/15min global, 20 req/15min no chat
- **Helmet.js** — headers de segurança HTTP
- **Isolamento por usuário** — cada conta tem dados 100% separados
- **Senha para modelo Supremo** — Claude Opus protegido por senha

### 🎨 Interface
- **Dark/Light mode** — com persistência de preferência
- **Markdown completo** — negrito, listas, tabelas, código, blockquote
- **LaTeX/KaTeX** — equações matemáticas renderizadas
- **Monitor cardíaco animado** — indicador visual durante processamento
- **Indicador de modelo** — tag mostra qual IA respondeu cada mensagem
- **Controle de voz** — seletor de voz, velocidade 0.7x-2.0x, TTS
- **Zoom de texto** — P / M / G / GG
- **Wake Lock** — mantém tela ativa no celular

---

## 📂 Estrutura de Arquivos

```
hermes-ai-agent/
├── backend/
│   ├── index.js                      # Ponto de entrada
│   ├── hermes.sqlite                 # Banco de dados local
│   ├── firebase-adminsdk.json        # ⚠️ NÃO commitar
│   ├── .env                          # ⚠️ NÃO commitar
│   └── src/
│       ├── app.js                    # Express, middlewares, rotas
│       ├── routes/
│       │   ├── chat.js               # SSE, /lembrar, RAG, memória
│       │   └── auth.js               # JWT legado
│       ├── middleware/
│       │   ├── auth.js               # Verifica Firebase token
│       │   ├── cors.js               # Origens permitidas
│       │   └── sanitize.js           # Validação de inputs
│       └── services/
│           ├── ollama.js             # Groq + Anthropic, 5 modelos, fallback
│           ├── whisper.js            # Transcrição de áudio
│           ├── database.js           # SQLite — 5 tabelas, CRUD completo
│           └── pdfService.js         # pdf-parse, chunking, RAG
│
└── frontend/
    └── src/
        ├── App.jsx                   # Raiz — tema, auth, layout
        ├── hooks/
        │   ├── useChat.js            # Estado da conversa, streaming
        │   └── useConversation.js    # Histórico, sessões
        ├── services/
        │   ├── api.js                # HTTP, SSE, knowledge CRUD
        │   └── firebase.js           # Auth config
        └── components/
            ├── ChatInput.jsx         # Input, câmera, áudio, Ctrl+V
            ├── ChatMessage.jsx       # Markdown, KaTeX, TTS, modelo
            ├── Header.jsx            # Menu, voz, fonte, wake lock
            ├── ModelSelector.jsx     # Seletor 5 modelos + senha Supremo
            ├── KnowledgePanel.jsx    # Base de conhecimento + edição
            ├── Login.jsx             # Auth Firebase
            └── ConversationList.jsx  # Histórico de conversas
```

---

## 🗄️ Banco de Dados (SQLite)

| Tabela | Função |
|--------|--------|
| `conversations` | Histórico de mensagens por usuário |
| `sessions` | Controle de sessões ativas |
| `pdf_context` | Contexto legado (compatibilidade) |
| `user_memory` | Fatos extraídos automaticamente das conversas |
| `knowledge_base` | Base de conhecimento — PDFs, TXTs e textos por usuário |

---

## ⚙️ Variáveis de Ambiente (.env)

```env
PORT=3001
NODE_ENV=production
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...
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

### Backend (servidor)
```bash
pm2 status                          # Ver processos
pm2 restart hermes                  # Reiniciar
pm2 logs --lines 20 --nostream      # Ver logs
pm2 logs --lines 20 --nostream | grep -i error   # Filtrar erros
pm2 save                            # Salvar configuração
curl -s http://localhost:3001/api/health          # Testar API
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

### Git
```bash
cd C:\hermes-ai-agent
git add . && git commit -m "mensagem"
```

---

## 📊 Limites das APIs Gratuitas

| Modelo | Tokens/dia | Reset |
|--------|-----------|-------|
| Groq llama-3.3-70b (Sênior) | 100.000 | 21h Brasília |
| Groq llama-3.1-8b (Jr — fallback) | 500.000 | 21h Brasília |
| Groq llama-4-scout (Visão) | 100.000 | 21h Brasília |
| Whisper large-v3-turbo | 28.800 seg/dia | 21h Brasília |
| Claude Haiku/Sonnet/Opus | Sem limite diário | Pago por uso |

> ⚠️ PDF de 50 páginas consome ~20.000-50.000 tokens. Fallback automático ativo para erros 429/503/413.

---

## 🔐 Segurança — Boas Práticas

- ✅ `.env` e `firebase-adminsdk.json` no `.gitignore` — nunca commitados
- ✅ Repositório **privado** no GitHub
- ✅ JWT verificado em toda requisição via Firebase Admin SDK
- ✅ Sanitização de inputs com `express-validator`
- ✅ Rate limiting: 100 req/15min global, 20 req/15min no chat
- ✅ CORS restrito às origens autorizadas
- ✅ Helmet.js — headers HTTP de segurança
- ✅ Isolamento total por usuário (userId em todas as queries)
- ✅ Modelo Supremo protegido por senha

> ⚠️ **NUNCA** compartilhe o IP do servidor, chaves de API ou o `firebase-adminsdk.json` publicamente.

---

## 👨‍💻 Autor

**Thiago Fernando**
Engenheiro da Computação & Desenvolvedor Front-End
Especialista em PWAs, Firebase, React e infraestrutura cloud


---

*Hermes AI Agent — Desenvolvido com dedicação. Infraestrutura privada, dados sob seu controle.*