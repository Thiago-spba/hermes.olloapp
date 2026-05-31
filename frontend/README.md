# 🏛️ HERMES AI AGENT

> *"Não há problema sem solução. Apresente o seu."*

**🔗 [hermes.olloapp.com.br](https://hermes.olloapp.com.br)**

---

## ⚡ O que é o Hermes?

O **Hermes AI Agent** é um assistente de inteligência artificial pessoal **100% self-hosted**, desenvolvido do zero por Thiago Fernando. Roda integralmente no **Oracle Cloud Free Tier** — sem custo de infraestrutura — e integra **6 modelos de IA de ponta** via API, com streaming de respostas em tempo real.

**Diferenciais:**
- 🔒 Privacidade total — dados no seu servidor
- 🤖 6 modelos de IA intercambiáveis em tempo real
- 🧠 Memória persistente e base de conhecimento por usuário
- 📖 Modo Estudo com formato pedagógico estruturado
- 🔄 Retomada automática de conversa ao recarregar
- 🛡️ Segurança enterprise com isolamento total por usuário

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
│         Nginx (Proxy Reverso + SSL Let's Encrypt)       │
│         Oracle Cloud ARM A1 — 147.15.84.45              │
└───────────────────────┬─────────────────────────────────┘
                        │ :3001
┌───────────────────────▼─────────────────────────────────┐
│         Node.js v20 + Express 5 (Backend API)           │
│         PM2 — Gerenciamento de Processos 24/7           │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  Groq API   Anthropic   Mistral AI  Cohere AI
  (Sênior)   (3 modelos) (Jr)        (Analiza)
                        │
              ┌──────────┴──────────┐
              ▼                     ▼
        SQLite Local            Firestore
     (memória, RAG,         (histórico de
      knowledge base)        conversas)
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| Frontend | React + Vite | 19 / 8 | PWA — Interface responsiva dark/light |
| Hosting | Firebase Hosting | Spark | CDN global, deploy automático |
| DNS | GoDaddy CNAME | — | hermes.olloapp.com.br |
| Runtime | Node.js | v20.20.2 | Backend ESM (type: module) |
| Framework | Express | 5 | API REST + SSE Streaming |
| Processo | PM2 | — | Gerenciador 24/7 com auto-restart |
| Proxy | Nginx + Certbot | — | HTTPS, SSL Let's Encrypt, proxy reverso |
| Servidor | Oracle Cloud ARM A1 | Free Tier | 4 OCPUs / 24GB RAM |
| 🔎 IA Analiza | Cohere command-a-03-2025 | — | Análise profunda e estruturada |
| ⚙️ IA Jr | Mistral mistral-small-latest | — | Respostas rápidas, plano gratuito |
| 🧠 IA Sênior | Groq llama-3.3-70b | — | Raciocínio avançado, alta velocidade |
| 🎓 IA Doutor | Claude Haiku 4.5 | — | Padrão do sistema, balanceado |
| 🔬 IA Especialista | Claude Sonnet 4.6 | — | Tarefas complexas e técnicas |
| 👑 IA Supremo | Claude Opus 4.7 | — | Máxima capacidade, protegido por senha |
| Áudio | Groq Whisper large-v3-turbo | — | Transcrição de áudio WAV |
| Banco Local | SQLite (better-sqlite3) | — | Memória, RAG, base de conhecimento |
| Banco Cloud | Firestore | — | Histórico de conversas por usuário |
| Auth | Firebase Auth + Admin SDK | — | Google + Email/Password — JWT verificado |

---

## 🚀 Funcionalidades

### 🤖 Inteligência Artificial
- **6 modelos intercambiáveis** em tempo real via seletor no rodapé
- **Streaming SSE** — respostas token a token, sem espera
- **Fallback automático** — Claude falha → Mistral Jr automaticamente
- **Análise de imagens** — detecção automática usa modelo multimodal
- **Transcrição de áudio** — gravação WAV → Groq Whisper → texto

### 📖 Modo Estudo
Ativado via botão 💡 no menu com card de confirmação. Toda resposta segue formato pedagógico obrigatório:

| Seção | Descrição |
|-------|-----------|
| 📖 CONCEITO | Explicação clara, direta e tecnicamente precisa |
| 💡 EXEMPLO | Caso prático e real que ilustra o conceito |
| ✏️ EXERCICIO | Questão ou desafio para fixar o conteúdo |

Badge visual permanente quando ativo, com botão de desativar rápido.

### 🧠 Memória e Contexto
- **Memória automática** — extrai fatos da conversa em background via Mistral
- **Comando `/lembrar`** — salva informações manualmente (`/lembrar nome: Thiago`)
- **Base de Conhecimento** — PDFs, TXTs e textos digitados persistentes por usuário
- **RAG** — busca chunks relevantes antes de responder
- **Histórico de conversas** — salvo no Firestore com título gerado automaticamente
- **Retomada automática** — ao recarregar a página, retoma a conversa atual via localStorage

### 🎨 Tela Inicial Animada
- Símbolo `</>` com animação suave
- Saudação automática por horário (Bom dia / Boa tarde / Boa noite / Boa madrugada)
- Efeito máquina de escrever com frases rotativas
- Grid de sugestões de mensagens clicáveis
- Dicas de atalhos do teclado

### 📷 Entrada Multimodal
- **Câmera integrada** — viewfinder com grade, zoom 1-3x, lanterna, câmera frontal/traseira
- **Ctrl+V** — cola imagens diretamente do clipboard
- **Drag & Drop** — arrasta arquivos para o chat
- **Upload** — PDF, TXT, imagens, código (até 50MB)

### 🔐 Segurança
- **Firebase Auth** — token JWT verificado em cada requisição
- **CORS blindado** — apenas origens autorizadas
- **Sanitização XSS** — remove tags HTML/script e eventos JavaScript de todos os inputs
- **Rate limiting** — 100 req/15min global, 20 req/15min no chat
- **Helmet.js** — headers de segurança HTTP
- **Isolamento por usuário** — cada conta tem dados 100% separados
- **Firestore Security Rules** — limites por usuário com admin privilegiado
- **Senha para modelo Supremo** — Claude Opus protegido por senha

### 🔒 Limites de Segurança (Firestore Rules)

| Recurso | Usuários Comuns | Admin (Thiago) |
|---------|----------------|----------------|
| Tamanho da mensagem | 10.000 caracteres | Ilimitado |
| Mensagens por conversa | 100 | Ilimitado |
| Tamanho do título | 100 caracteres | Ilimitado |
| Requisições por 15min | 20 mensagens | Ilimitado |
| Upload de imagem/áudio | 5MB | Ilimitado |

### 🎨 Interface
- **Dark/Light mode** — com persistência de preferência
- **Tela inicial animada** — WelcomeScreen com sugestões interativas
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
│       │   ├── chat.js               # SSE, studyMode, /lembrar, RAG
│       │   └── auth.js               # JWT legado
│       ├── middleware/
│       │   ├── auth.js               # Verifica Firebase token
│       │   ├── cors.js               # Origens permitidas
│       │   └── sanitize.js           # Sanitização XSS + validação
│       └── services/
│           ├── ollama.js             # 6 modelos, fallback, Modo Estudo
│           ├── whisper.js            # Transcrição de áudio
│           ├── database.js           # SQLite — 5 tabelas, CRUD
│           └── pdfService.js         # pdf-parse, chunking, RAG
│
└── frontend/
    └── src/
        ├── App.jsx                   # Auth, studyMode, WelcomeScreen, retomada
        ├── hooks/
        │   ├── useChat.js            # Estado, streaming, studyMode
        │   └── useConversation.js    # Histórico, localStorage, Firestore
        ├── services/
        │   ├── api.js                # HTTP, SSE, studyMode, knowledge
        │   ├── firebase.js           # Auth config
        │   └── firestoreService.js   # Conversas no Firestore
        └── components/
            ├── ChatInput.jsx         # Input, câmera, áudio, Ctrl+V
            ├── ChatMessage.jsx       # Markdown, KaTeX, TTS, modelo
            ├── Header.jsx            # Menu, Modo Estudo, voz, fonte
            ├── ModelSelector.jsx     # Seletor 6 modelos + senha Supremo
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

### Backend (servidor)
```bash
pm2 status
pm2 restart hermes
pm2 logs hermes --lines 20 --nostream
pm2 logs hermes --lines 20 --nostream | grep -i error
curl -s http://localhost:3001/api/health
curl -s https://api.hermes.olloapp.com.br/api/health
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
git add . && git commit -m "mensagem" && git push origin master
```

---

## 📊 Limites das APIs Gratuitas

| Modelo | Limite | Reset |
|--------|--------|-------|
| 🔎 Cohere Analiza (Trial) | Rate limit moderado | — |
| ⚙️ Mistral Jr (Free) | Rate limit por capacidade | — |
| 🧠 Groq Sênior (llama-3.3-70b) | 100.000 tokens/dia | 21h Brasília |
| 🎓 Claude Haiku / Sonnet / Opus | Sem limite diário | Pago por uso |

> ⚠️ **Fallback automático ativo:** Claude falha → Mistral Jr assume automaticamente

---

## 🔐 Segurança — Boas Práticas

- ✅ `.env` e `firebase-adminsdk.json` no `.gitignore` — nunca commitados
- ✅ Repositório **privado** no GitHub
- ✅ JWT verificado em toda requisição via Firebase Admin SDK
- ✅ Sanitização XSS em todos os inputs
- ✅ Rate limiting: 100 req/15min global, 20 req/15min no chat
- ✅ CORS restrito às origens autorizadas
- ✅ Helmet.js — headers HTTP de segurança
- ✅ Firestore Rules — limites por usuário com admin privilegiado
- ✅ Isolamento total por usuário (userId em todas as queries)
- ✅ Modelo Supremo protegido por senha

> ⚠️ **NUNCA** compartilhe o IP do servidor, chaves de API ou o `firebase-adminsdk.json` publicamente.

---

## 👨‍💻 Autor

**Thiago Fernando**
Engenheiro da Computação & Desenvolvedor Front-End
São Paulo, Brasil

GitHub: [Thiago-spba](https://github.com/Thiago-spba)
Portfolio: [portfolio-thiagosp.vercel.app](https://portfolio-thiagosp.vercel.app)

---

*Hermes AI Agent — Infraestrutura privada, dados sob seu controle.*

*Desenvolvido com dedicação por Thiago Fernando.*