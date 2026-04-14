FROM node:20-alpine

# Instalar dependencias necesarias para FFmpeg y Canvas/Media processing
RUN apk add --no-cache \
    ffmpeg \
    bash \
    tzdata \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

# Establecer huso horario
ENV TZ=America/Mexico_City
RUN cp /usr/share/zoneinfo/America/Mexico_City /etc/localtime && echo "America/Mexico_City" > /etc/timezone

WORKDIR /app

# Instalar pm2 globalmente
RUN npm install pm2 -g

# Copiar configuración de dependencias
COPY package*.json ./

# Instalar dependencias de producción y build
# (Ajusta a npm ci si cuentas con package-lock.json estable)
RUN npm install --production

# Copiar el código fuente
COPY src ./src
COPY media ./media

# Punto de entrada por PM2-runtime (Para contenedores)
CMD ["pm2-runtime", "start", "src/index.js", "--name", "rexbot"]
