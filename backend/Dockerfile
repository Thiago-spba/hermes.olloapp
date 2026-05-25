# ============================================
# ESTÁGIO 1: Construção (Build)
# Aqui instalamos as ferramentas para compilar o SQLite no processador ARM
# ============================================
FROM node:20-slim AS builder

# Instala ferramentas essenciais para compilar módulos C++ (necessário para o better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (otimiza o cache do Docker)
COPY package*.json ./

# Instala e compila as dependências nativas
RUN npm install

# ============================================
# ESTÁGIO 2: Execução (Runtime)
# Imagem final limpa, segura e leve para rodar na VPS
# ============================================
FROM node:20-slim

# Define que o Node deve rodar em modo de produção
ENV NODE_ENV=production

WORKDIR /app

# Copia apenas os node_modules já compilados do estágio anterior
COPY --from=builder /app/node_modules ./node_modules

# Copia o restante do código da sua API
COPY . .

# Expõe a porta definida no seu arquivo .env
EXPOSE 3001

# Comando para iniciar o Hermes
CMD ["npm", "start"]