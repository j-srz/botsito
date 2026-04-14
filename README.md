# 🦖 Rex Bot (Enterprise SaaS Edition)

Un bot de WhatsApp avanzado, construido con `@whiskeysockets/baileys` bajo patrón de **Arquitectura Limpia (Clean Architecture)**. Diseñado para alta disponibilidad, gestión multisesión con aislamiento de estado (`Mutex`) y escalabilidad en Cloud/VSP a través de contenedores Docker.

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
