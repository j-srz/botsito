
<div align="center">

```
██████╗ ███████╗██╗  ██╗    ██████╗  ██████╗ ████████╗
██╔══██╗██╔════╝╚██╗██╔╝    ██╔══██╗██╔═══██╗╚══██╔══╝
██████╔╝█████╗   ╚███╔╝     ██████╔╝██║   ██║   ██║
██╔══██╗██╔══╝   ██╔██╗     ██╔══██╗██║   ██║   ██║
██║  ██║███████╗██╔╝ ██╗    ██████╔╝╚██████╔╝   ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝
```

# 🤖 REX BOT V2 — Professional Group Management

**Sistema Comercial de Administración para WhatsApp**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![PM2](https://img.shields.io/badge/PM2-Process_Manager-2B037A?style=for-the-badge&logo=pm2&logoColor=white)](https://pm2.keymetrics.io)
[![License](https://img.shields.io/badge/License-Commercial-red?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Production_92%2F100-brightgreen?style=for-the-badge)](#)

> ⚡ **Motor de administración de grupos WhatsApp con sistema de licencias, control remoto de comandos y arquitectura de microservicios en Docker.**

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Sistema Comercial y Licencias](#-sistema-comercial-y-licencias)
- [Jerarquía de Seguridad y Permisos](#-jerarquía-de-seguridad-y-permisos)
- [Comandos Disponibles](#-comandos-disponibles)
- [Stack Tecnológico](#-stack-tecnológico)
- [Variables de Entorno](#-variables-de-entorno)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Guía de Despliegue](#-guía-de-despliegue)
- [Base de Datos](#-base-de-datos)
- [Sistema de Control Remoto](#-sistema-de-control-remoto)

---

## 🌐 Descripción General

REX BOT V2 es un sistema de administración comercial para grupos de WhatsApp construido sobre una arquitectura modular orientada a comandos. Su núcleo permite a operadores de comunidades gestionar grupos de forma centralizada, con protección de licencias que garantiza que el bot opere **únicamente en grupos autorizados**.

| Característica | Descripción |
|---|---|
| 🔐 Control de Licencias | Grupos sin licencia activa son abandonados automáticamente |
| 🎮 Control Remoto | Ejecución de comandos en cualquier grupo desde DM |
| 🛡️ Anti-Link | Detección y sanción automática de enlaces no permitidos |
| 📊 Analítica de Grupo | Ranking de mensajes, detección de inactivos, historial de subastas |
| ⚙️ Comandos por Grupo | Activar/desactivar comandos individualmente por grupo |
| 📢 Broadcast Masivo | Anuncios simultáneos a todos los grupos con licencia activa |
| 🎰 Sistema de Subastas | Motor de sorteos, ruletas y registro de ganadores |

---

## 💼 Sistema Comercial y Licencias

El corazón comercial de REX BOT es su motor de licencias. Cada grupo que desee usar el bot debe tener una licencia activa. Sin ella, el bot **abandona el grupo automáticamente** con un mensaje de aviso.

### Tipos de Licencia

```
/activate <grupo> <tipo> [cantidad]
```

| Tipo | Descripción | Ejemplo |
|---|---|---|
| `days` | Acceso por N días | `/activate MiGrupo days 30` |
| `weeks` | Acceso por N semanas | `/activate MiGrupo weeks 4` |
| `months` | Acceso por N meses | `/activate MiGrupo months 3` |
| `unlimited` | Acceso permanente sin fecha de expiración | `/activate MiGrupo unlimited` |

### Flujo de Protección Comercial

```
Mensaje entrante
      │
      ▼
┌─────────────────────────┐
│  commercial.middleware  │  ◄── Valida licencia del grupo
└────────────┬────────────┘
             │ Sin licencia activa
             ▼
   ┌─────────────────────┐
   │  ¿Bypass Command?   │  ◄── /activate, /list-groups, .cm-admin…
   └──────────┬──────────┘
              │ No es bypass
              ▼
   ┌─────────────────────┐
   │  BOT LEAVES GROUP   │  ◄── Envía aviso + abandona
   └─────────────────────┘
              │ Licencia válida
              ▼
   ┌─────────────────────┐
   │  Pipeline continúa  │
   └─────────────────────┘
```

### Comandos que Bypass la Licencia

`/activate` · `/list-groups` · `/add-admin` · `/remove-admin` · `/anuncio` · `/alias` · `.cm-admin` · `.remote`

---

## 🔐 Jerarquía de Seguridad y Permisos

> ⚠️ **Privilegios de Administrador Obligatorios** — REX BOT opera bajo un modelo donde **todas sus funciones requieren privilegios de administrador**. No existen comandos públicos para usuarios sin rango. El bot ejecuta acciones únicamente cuando el solicitante tiene el nivel de permisos adecuado dentro de la jerarquía.

```
╔══════════════════════════════════════════════════════╗
║                  🔴 SUPER OWNER (LID)                ║
║           Control total de la infraestructura        ║
║     /add-admin · /remove-admin · acceso absoluto     ║
╠══════════════════════════════════════════════════════╣
║               🟠 COMMERCIAL ADMINS                   ║
║        Gestión de licencias y grupos globales        ║
║  /activate · /list-groups · /alias · /anuncio        ║
╠══════════════════════════════════════════════════════╣
║               🟡 GROUP ADMINS (WhatsApp)             ║
║        Administración dentro de cada grupo           ║
║  .kick · .promote · .demote · .close · .notify       ║
╚══════════════════════════════════════════════════════╝
```

### Super Owner (LID)

Definido por `OWNER_JID` en el `.env`. Único con capacidad de:
- Añadir o revocar administradores comerciales
- Acceder a toda la infraestructura sin restricciones

### Commercial Admins

Gestionados con `/add-admin` y `/remove-admin`. Pueden:
- Activar y gestionar licencias de grupos
- Ver el directorio completo de grupos
- Enviar anuncios masivos a todos los grupos activos
- Asignar alias y tags a grupos

### Sistema de Operadores

Usuarios sin rango de admin de WhatsApp que reciben permisos de gestión dentro del bot:

```bash
.operators set @usuario      # Establece operador principal
.operators add @usuario      # Añade operador adicional
.operators remove @usuario   # Revoca permisos
.operators get               # Lista operadores activos
.operators reset             # Limpia todos los operadores
```

### Comandos Protegidos (No Desactivables)

`disable` · `enable` · `disabled` · `cm` · `cm-sc` · `id`

---

## 📟 Comandos Disponibles

### 🔑 Owner — Solo Super Owner

| Comando | Descripción |
|---|---|
| `/add-admin <número>` | Otorga permisos de administrador comercial |
| `/remove-admin <número>` | Revoca permisos de administrador comercial |

---

### 🏢 Comerciales — Commercial Admins

| Comando | Descripción |
|---|---|
| `/activate <grupo> <tipo> [cantidad]` | Activa licencia (days/weeks/months/unlimited) |
| `/list-groups` | Lista todos los grupos con estado de licencia |
| `/alias <jid_o_alias> <nuevo_alias>` | Asigna alias a un grupo |
| `/anuncio <mensaje>` | Broadcast a todos los grupos con licencia activa |

---

### ⚙️ Administración de Grupo — Group Admins

| Comando | Descripción | Bot Admin |
|---|---|---|
| `.kick` | Elimina al usuario del mensaje citado | ✅ |
| `.promote` | Otorga rango de admin al usuario citado | ✅ |
| `.demote` | Retira rango de admin al usuario citado | ✅ |
| `.close [tiempo]` | Cierra el grupo (solo admins escriben) | ✅ |
| `.open` | Abre el grupo para todos | ✅ |
| `.link` | Obtiene el link de invitación | ✅ |
| `.damelink` | Envía solo el link de invitación | ✅ |
| `.restablecerlink` | Revoca link actual y genera uno nuevo | ✅ |
| `.del` | Elimina el mensaje citado | ✅ |
| `.notify <mensaje>` | Aviso mencionando a todos los participantes | ❌ |
| `.hidetag <mensaje>` | Menciona a todos sin mostrar las @ | ❌ |
| `.antilink on/off` | Activa/desactiva filtro anti-links | ❌ |
| `.antilink logs` | Historial de infracciones de antilink | ❌ |
| `.fantasmas` | Detecta usuarios con 7+ días inactivos | ❌ |
| `.disable <comando>` | Desactiva un comando en este grupo | ❌ |
| `.enable <comando>` | Reactiva un comando desactivado | ❌ |
| `.disabled` | Lista comandos desactivados del grupo | ❌ |
| `.operators set/add/remove/get/reset` | Gestión de operadores del grupo | ❌ |
| `.group setalias/addtag/name/list` | Gestión PRO de identificación del grupo | ❌ |
| `.cm-admin` | Menú de gestión comercial del bot | ❌ |
| `.gg @usuario <monto>` | Registra ganador de subasta | ❌ |

---

### 📊 Información — Todos los usuarios

| Comando | Descripción |
|---|---|
| `.cm` | Menú principal de comandos REX |
| `.cm-sc` | Menú de comandos secretos |
| `.ping` | Comprueba latencia y estado del bot |
| `.runtime` | Uptime del bot |
| `.id` | ID del chat actual |
| `.user` | Tu información y rango |
| `.groupinfo` / `.ginfo` | Información detallada del grupo |
| `.totalchat` | Ranking de mensajes del grupo |
| `.listonline` | Usuarios con actividad reciente |
| `.resumen` | Ranking de subastas del grupo |
| `.verpin` | Mensaje fijado del grupo |

---

### 🎮 Juegos y Sorteos — Todos los usuarios

| Comando | Descripción |
|---|---|
| `.ruleta all` | Sorteo entre todos los participantes |
| `.ruleta admin` | Sorteo entre los administradores |
| `.ruleta cs` | Sorteo personalizado |
| `.ruletaban` | Expulsa a un participante al azar |

---

### 🎉 Entretenimiento — Todos los usuarios

| Comando | Descripción |
|---|---|
| `.kiss @usuario` | Besa a alguien — contador global de besos |
| `.mylastkiss` | Última persona que te besó |
| `.todos` | Menciona a todos los miembros del grupo |
| `.vtalv @usuario` | Manda un saludo a alguien |
| `.shh` | Manda a callar al usuario del mensaje citado |
| `.1500` | Milquinientos 💋 |
| `.joto` | Comando de entretenimiento |
| `.papoi` | Comando de entretenimiento |
| `.smoke` | Comando de entretenimiento 🚬 |
| `.wassaa` | Comando de entretenimiento |

---

### 🖼️ Media — Todos los usuarios

| Comando | Descripción |
|---|---|
| `.s` | Convierte imagen/video a sticker |
| `.img` | Convierte sticker a imagen o video |
| `.n <texto>` | Reenvía o edita el texto de un multimedia |
| `.cancel` | Vacía la cola de media y detiene el motor |

---

## 🛠️ Stack Tecnológico

```
┌──────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                    │
│                                                          │
│   Node.js 18+  ──►  @whiskeysockets/baileys             │
│   Arquitectura de comandos modular con BaseCommand       │
│   Registro automático de comandos (command.registry.js)  │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                    CAPA DE SERVICIOS                     │
│                                                          │
│   commercial.service      ──► Licencias y admins         │
│   command-control.service ──► Enable/disable por grupo   │
│   group.registry          ──► Aliases, tags, operadores  │
│   moderation.service      ──► Logs y detección inactivos │
│   auction.service         ──► Motor de subastas          │
│   antilink.service        ──► Detección de enlaces       │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                 CAPA DE INFRAESTRUCTURA                  │
│                                                          │
│   🐳 Docker Compose  ──► Contenedor rexbot_prod          │
│      Memory: 512M max / 256M reservado                   │
│      Restart: unless-stopped                             │
│      Health check: cada 30s                              │
│      Logging: JSON-file, 10MB max, 3 archivos rotados    │
│                                                          │
│   📊 PM2  ──► Monitoreo de procesos en tiempo real       │
│      Auto-restart en caídas                              │
│      Métricas de CPU/RAM con pm2 monit                   │
│                                                          │
│   💾 JSON Database  ──► Persistencia en /data/           │
│      11 repositorios JSON especializados                 │
│      Escritura atómica: .tmp → rename (crash-safe)       │
│      Volúmenes Docker para persistencia entre reinicios  │
└──────────────────────────────────────────────────────────┘
```

| Paquete | Versión | Uso |
|---|---|---|
| `@whiskeysockets/baileys` | Latest | Motor de conexión WhatsApp |
| `qrcode-terminal` | ^0.12.0 | Autenticación QR en terminal |
| `Node.js` | 18+ | Runtime principal |
| `Docker + Compose` | v3.8+ | Contenedorización y orquestación |
| `PM2` | Latest | Process manager y monitoreo |
| `ffmpeg` | Alpine | Conversión de media (stickers) |

---

## 🌍 Variables de Entorno

```env
# ─────────────────────────────────────────────────────────
#  REX BOT V2 — Environment Configuration
# ─────────────────────────────────────────────────────────

# JID del propietario del bot (Super Owner)
# Formato: número@s.whatsapp.net
OWNER_JID=524492842300@s.whatsapp.net

# Entorno de ejecución
NODE_ENV=production

# Zona horaria (afecta timestamps de licencias y logs)
TZ=America/Mexico_City

# (Opcional) Grupos pre-autorizados, separados por coma
ALLOWED_GROUPS=120363409112798858@g.us,120363426098126547@g.us
```

| Variable | Requerida | Descripción |
|---|---|---|
| `OWNER_JID` | ✅ | JID del Super Owner — control total |
| `NODE_ENV` | ✅ | `development` o `production` |
| `TZ` | ✅ | Zona horaria para expiración correcta de licencias |
| `ALLOWED_GROUPS` | ❌ | Pre-autorización sin usar `/activate` |

> ⚠️ **Importante:** Si `OWNER_JID` es incorrecto, el bot arranca sin Super Owner funcional. El formato es `número_sin_+@s.whatsapp.net`.

---

## 🏗️ Arquitectura del Proyecto

```
botsito/
├── docker-compose.yml
├── Dockerfile
├── .env
├── package.json
│
└── src/
    ├── index.js                    # Entry point — graceful shutdown, error handling
    ├── core/
    │   ├── bot.js                  # Baileys socket, QR, reconexión exponencial
    │   ├── logger.js               # Logger con niveles y colores
    │   ├── mutex/                  # Bloqueo por JID — previene race conditions
    │   └── session/                # Estado RAM por grupo con TTL de 1h
    ├── commands/
    │   ├── base.command.js         # Clase base con guards y helpers
    │   ├── command.registry.js     # Auto-discovery de *.command.js
    │   ├── admin/                  # 26 comandos de administración
    │   ├── fun/                    # 10 comandos de entretenimiento
    │   ├── games/                  # 3 comandos de juegos y sorteos
    │   ├── info/                   # 10 comandos de información
    │   └── media/                  # 4 comandos de conversión de media
    ├── handlers/
    │   ├── message.handler.js      # Pipeline principal de middlewares
    │   └── reaction.handler.js     # Manejo de reacciones
    ├── middlewares/
    │   ├── commercial.middleware.js # Licencias — auto-leave si vencida
    │   ├── remote.middleware.js     # Control remoto con verificación de privilegios
    │   ├── whitelist.middleware.js  # Filtrado por ALLOWED_GROUPS
    │   └── antilink.middleware.js   # Detección y sanción de links
    ├── services/
    │   ├── commercial.service.js    # Motor de licencias y gestión de admins
    │   ├── command-control.service.js
    │   ├── group.registry.js
    │   ├── moderation.service.js
    │   ├── antilink.service.js
    │   ├── media.service.js
    │   ├── auction.service.js
    │   ├── raffle.service.js
    │   └── group.service.js
    ├── config/
    │   └── env.config.js
    └── data/
        ├── db.js                   # Exporta todos los repositorios JSON
        └── repositories/
            └── json.repository.js  # Escritura atómica + cola serializada
```

---

## 🚀 Guía de Despliegue

### Prerrequisitos

- Docker Engine 20.10+ y Docker Compose v3.8+
- Git

### 1. Clonar o actualizar

```bash
git clone <repo-url> botsito && cd botsito
# o en actualizaciones posteriores:
git pull origin main
```

### 2. Configurar entorno

```bash
cp .env.example .env
# Editar OWNER_JID, NODE_ENV=production, TZ
```

### 3. Levantar en producción

```bash
docker-compose up -d --build
```

### 4. Escanear QR (primer arranque)

```bash
docker-compose logs -f rexbot_prod
# El QR aparece en terminal — escanearlo desde WhatsApp > Dispositivos vinculados
```

La sesión queda en el volumen `auth_data` y **no requiere re-escaneo** en reinicios.

### 5. Monitoreo con PM2 (bare metal, sin Docker)

```bash
npm install -g pm2
pm2 start src/index.js --name "rexbot"
pm2 save && pm2 startup   # auto-inicio en reboot
pm2 monit                  # CPU, RAM, logs en tiempo real
```

### Mantenimiento

```bash
docker-compose restart rexbot_prod             # Reiniciar
docker stats rexbot_prod                       # Uso de recursos
git pull && docker-compose up -d --build       # Actualización completa
docker volume inspect botsito_auth_data        # Inspeccionar sesión
docker volume inspect botsito_db_data          # Inspeccionar DB
```

---

## 💾 Base de Datos

Persistencia en ficheros JSON montados como volumen Docker. Escritura atómica mediante `.tmp → rename()` para prevenir corrupción.

| Archivo | Contenido |
|---|---|
| `commercial.json` | Lista de JIDs con permisos de admin comercial |
| `groups_directory.json` | Licencias, alias, tags y operadores por grupo |
| `group_settings.json` | Configuración individual por grupo |
| `disabled_commands.json` | Comandos desactivados por grupo |
| `remote_sessions.json` | Sesiones de control remoto persistentes |
| `message_logs.json` | Actividad de usuarios (`.totalchat`, `.fantasmas`) |
| `subastas_registro.json` | Registro histórico de ganadores de subastas |
| `antilink_logs.json` | Historial de infracciones de antilink |
| `antilink_warnings.json` | Contador de advertencias por usuario/grupo |
| `kissData.json` | Contador global de besos y último beso por usuario |
| `pinned_messages.json` | Registro de mensajes fijados |

---

## 🎮 Sistema de Control Remoto

Permite a operadores autorizados gestionar cualquier grupo desde un DM privado con el bot.

### Sesiones Sticky (Persistentes)

```bash
.remote bind MiGrupo     # Anclar sesión a un grupo
.kick                    # Se ejecuta en el grupo anclado
.close 1h                # Cierra el grupo remotamente
.remote unbind           # Desvincular sesión
```

### Ejecución One-Shot

```bash
.remote MiGrupo .notify ¡Atención a todos!
```

### Seguridad

- Solo **operadores** y **owners** del grupo pueden usar `.remote`
- Cada ejecución verifica privilegios en tiempo real
- Las sesiones persisten en `remote_sessions.json` entre reinicios
- Proxy de socket para compatibilidad con mensajes citados

---

## 🛡️ Pipeline de Middlewares

```
Mensaje WhatsApp
      │
      ▼
┌─────────────────────┐
│  remote.middleware  │  Intercepta .remote y genera ctx spoofed
└──────────┬──────────┘
           ▼
┌──────────────────────┐
│ whitelist.middleware │  Filtra por ALLOWED_GROUPS
└──────────┬───────────┘
           ▼
┌──────────────────────────┐
│ commercial.middleware    │  Valida licencia — auto-leave si expirada
└──────────┬───────────────┘
           ▼
┌──────────────────────┐
│ moderation.service   │  Registra actividad del usuario
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ antilink.middleware  │  Detecta y sanciona links no permitidos
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Command Handler     │  Ejecuta el comando
└──────────────────────┘
```

---

<div align="center">

---

**REX BOT V2** · Construido con Node.js

*Sistema comercial de administración para WhatsApp — Versión de producción*

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Powered by Baileys](https://img.shields.io/badge/Powered%20by-Baileys-25D366?style=flat-square&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![Containerized with Docker](https://img.shields.io/badge/Containerized%20with-Docker-2496ED?style=flat-square&logo=docker)](https://docker.com)

</div>

## 🌟 Características Principales

* **Soporte Multi-Grupo**: Sistema de `Locks` que evita colisiones (Race Conditions). Si dos grupos activan `.ruleta` en el mismo milisegundo, la memoria no se corrompe. Cada grupo (JID) tiene su propio mapa RAM.
* **Sistema de Comandos OCP**: Comandos Auto-Descubiertos por un `CommandRegistry`. Separación 1-1 en ficheros (Técnica SaaS).
* **Middlewares Asíncronos**: Filtros perimetrales (Whitelist & Antilinks) bloquean requests antes de consumir CPU local.
* **Persistencia Diferida con Caché**: Base de datos en JSON con proxy RAM (`JsonRepository`) que recorta el 99% de lecturas/escrituras al SSD del SO.
* **Multimedia Manager**: Cola robusta y asíncrona de compresión MP4/Sticker limitando threads concurrentes usando `ffmpeg`.

---

## 🏗️ Explicación de la Arquitectura (Clean Code)

El proyecto erradicó el diseño "Script" y dividió la responsabilidad en capas formales en ``src/``:

1. **`core/`**: El corazón del sistema. Establece la conexión de Baileys (`bot.js`), inicializa el `Logger` genérico y monta la máquina de **Session/Mutex**, enlazando estados atómicos para proteger colas masivas.
2. **`handlers/`**: Receptores crudos de los Socket Events (`messages.upsert`, etc.). Extraen el dato, construyen el `Contexto Seguro` (`ctx`) y pasan la bola.
3. **`middlewares/`**: Aduana de seguridad. El `whitelist.middleware.js` descarta chats ajenos y el `antilink.middleware.js` borra, advierte y banea links a velocidad supersónica limitando peticiones nulas.
4. **`services/`**: Códice comercial (Rifas, Antilink strikes, FFMPEG rendering). No acceden jamás de manera cruzada entre IDs y NO disparan mensajes brutos.
5. **`commands/`**: Ejecutores finales aislados. Heredan de la clase base `BaseCommand`.
6. **`data/`**: Puente de persistencia.

---

## 🚀 Uso del Sistema Multi-Grupo (Context y State)

Todo comando recibe un objeto `ctx` vitaminado. A diferencia del diseño viejo, **nunca uses variables globales** u overrides directos de array en comandos. 

Si necesitas alterar los participantes del grupo actual en una rifa, accederás a la variable mágica extraída individualmente para ESE Gupo:

```js
// Comando ficticio
async execute(sock, m, ctx) {
    const listadoRifa = ctx.groupState.raffle.participants;
    
    listadoRifa.push(ctx.sender); // Mutación SEGURA por lock Mutex.
    
    // Y en lugar de construir todo un sock.sendMessage largo:
    await ctx.reply("¡Agregado exitosamente a la tanda de este grupo!");
}
```
*El `TTL` del `GroupSessionManager` auto-limpiará este contexto de la memoria si el Grupo deja de interactuar por más de una hora.*

---

## ⚙️ Configuración e Instalación Paso a Paso

### Prerrequisitos
- Node.js (v18 o v20 LTS)
- NPM
- Instalar localmente `ffmpeg` en tu máquina si no usas Docker.

### 1. Variables de Entorno (`.env`)
Renombra el archivo (o crea) `.env` y define los parámetros. *Si `ALLOWED_GROUPS` queda vacío, el bot funciona de manera pública.*

```env
NODE_ENV=production
ALLOWED_GROUPS='' 
```

### 2. Ejecutar Local 💻 
*(Uso sugerido PM2).*
```bash
npm install
npm run start
```
Abre tu celular, ve a **Dispositivos Vinculados** y escanea el código QR que va a aparecer en grande en tu terminal.

### 3. Agregar / Crear Modulos Nuevos 🧩
Si quieres hacer un nuevo comando (Ej: `.abrazar`), ve a `/src/commands/fun/` y crea el archivo `abrazar.command.js`:
```js
const BaseCommand = require('../base.command');

class AbrazarCommand extends BaseCommand {
    constructor() { super('.abrazar', [], 'Da un abrazo'); }

    async execute(sock, m, ctx) {
        await ctx.react('🫂');
        await ctx.reply(`¡Un abrazo gigante a todos!`);
    }
}
module.exports = AbrazarCommand;
```
Al correr el bot de nuevo, ¡listo! Será listado automáticamente.

---

## 🐳 Despliegue Avanzado: Producción / VPS (Docker)

El proyecto viene integrado con un ecosistema de Docker preparado para escalado horizontal aislando dependencias crudas de Linux (`canvas`, `ffmpeg`).

### Desplegar
```bash
# Carga, levanta y envía a background unifica volumenes persistent
docker-compose up -d --build
```
Loggear el código QR en el primer inicio para escanearlo:
```bash
docker logs -f rexbot_prod
```
*Note: La política está configurada a `restart: unless-stopped`, si hay un crash eventual por V8 del host, regresará velozmente.*

---

## 🏘️ Módulo de Gestión de Comunidad

Permite personalizar la experiencia de entrada/salida de miembros y establecer identidad de grupo.

### Comandos

| Comando | Descripción | Permiso |
|---|---|---|
| `.community set <nombre>` | Define el nombre de la comunidad (ej: `Rexitos`) | Admin |
| `.community view` | Muestra el nombre de comunidad configurado | Admin |
| `.bienvenida on/off` | Activa o desactiva el mensaje de bienvenida | Admin |
| `.bienvenida set <msg>` | Configura el mensaje de bienvenida | Admin |
| `.bienvenida ver` | Muestra la bienvenida y su estado | Admin |
| `.bye on/off` | Activa o desactiva el mensaje de despedida | Admin |
| `.bye set <msg>` | Configura el mensaje de despedida | Admin |
| `.bye ver` | Muestra la despedida y su estado | Admin |
| `.rules` | Muestra el reglamento del grupo | Todos |
| `.rules set <texto>` | Guarda el reglamento del grupo | Admin |

### Placeholders soportados

| Placeholder | Descripción |
|---|---|
| `{{user}}` | Mención del miembro (@número) |
| `{{group}}` | Nombre del grupo en WhatsApp |
| `{{desc}}` | Descripción del grupo en WhatsApp |
| `{{community}}` | Nombre configurado con `.community set` |

### Captura de multimedia

Si el admin envía `.bienvenida set` o `.bye set` **como descripción de una imagen, GIF o video**, el bot descarga el archivo y lo guarda en `media/assets/`. El archivo se envía automáticamente junto al texto en cada bienvenida/despedida.

```
.bienvenida set ¡Bienvenido/a {{user}} a *{{community}}*! 🦖
(enviado como caption de una imagen)
```

El bot guarda la imagen y la enviará en cada nuevo ingreso al grupo.

### Arquitectura

- **`src/services/community.service.js`** — Lógica de negocio (CRUD settings + descarga de assets)
- **`src/handlers/group-events.handler.js`** — Escucha `group-participants.update` y dispara welcome/bye
- **`data/community_settings.json`** — Persistencia por JID de grupo
- **`media/assets/`** — Archivos multimedia de bienvenida/despedida (volumen Docker persistente)
