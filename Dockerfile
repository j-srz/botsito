FROM node:18-alpine AS base

# Dependencias de sistema para Baileys (crypto, media, fuentes)
RUN apk add --no-cache \
    ffmpeg \
    bash \
    tzdata \
    openssl \
    ca-certificates \
    fontconfig \
    ttf-dejavu \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    python3 \
    make \
    g++

ENV TZ=America/Mexico_City
RUN cp /usr/share/zoneinfo/America/Mexico_City /etc/localtime && \
    echo "America/Mexico_City" > /etc/timezone

WORKDIR /app

RUN npm install pm2 -g --no-fund --no-audit

# Instalar dependencias primero (layer cacheado si package.json no cambia)
COPY package*.json ./
RUN npm ci --omit=dev --no-fund --no-audit

# Copiar código fuente
COPY src ./src
COPY media ./media

# Usuario no-root para seguridad
RUN addgroup -S rex && adduser -S rex -G rex && \
    chown -R rex:rex /app
USER rex

CMD ["pm2-runtime", "start", "src/index.js", "--name", "rexbot"]
