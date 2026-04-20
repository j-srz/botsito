# CLAUDE_CONTEXT — Bot REX

## Proyecto
Bot de WhatsApp comercial llamado **REX**. Objetivo: producción en DigitalOcean con Docker. Sistema de licencias para vender el bot a grupos.

## Stack
- **Runtime**: Node.js 18 (Alpine)
- **WhatsApp**: `@whiskeysockets/baileys` (multi-file auth state)
- **Persistencia**: JSON files via repositorios custom
- **Proceso**: PM2 dentro de Docker
- **Orquestación**: docker-compose con volúmenes named persistentes

## Estructura clave
```
src/
├── core/bot.js                           # Conexión + backoff exponencial (máx 10 intentos)
├── core/mutex/group.mutex.js             # Mutex con limpieza automática
├── core/queue.manager.js                 # Cola serializada, _nextTimer controlado
├── handlers/message.handler.js           # Pipeline: whitelist → commercial → antilink → cmd
├── middlewares/
│   ├── whitelist.middleware.js           # Filtro por ALLOWED_GROUPS (env)
│   ├── commercial.middleware.js          # Verificación de licencia + auto-salida
│   ├── antilink.middleware.js
│   └── remote.middleware.js             # .remote bind/unbind + security logging
├── services/
│   ├── commercial.service.js            # Owner/Admin + Licencias (NUEVO)
│   ├── group.service.js                 # isAdmin/isBotAdmin con caché 30s TTL
│   ├── group.registry.js                # Directorio de grupos + aliases + operators
│   └── command-control.service.js       # Disable/enable comandos por grupo
├── commands/
│   ├── base.command.js                  # Guards: requireOwner, requireCommercialAdmin (async), requirePrivate
│   ├── admin/
│   │   ├── cm-admin.command.js          # .cm-admin — menú de gestión (DM only)
│   │   ├── add-admin.command.js         # /add-admin <número> (Owner only)
│   │   ├── remove-admin.command.js      # /remove-admin <número> (Owner only)
│   │   ├── list-groups.command.js       # /list-groups (Admin+)
│   │   ├── alias.command.js             # /alias <grupo> <nombre> (Admin+)
│   │   ├── activate.command.js          # /activate <grupo> <tipo> [cant] (Admin+)
│   │   └── anuncio.command.js           # /anuncio <msg> → broadcast activos (Admin+)
│   └── ... (38 comandos originales)
├── data/
│   ├── db.js                            # + commercial.json
│   └── repositories/json.repository.js # Write queue + rename atómico
└── config/env.config.js                 # + OWNER_JID
```

## Sistema Comercial

### Jerarquía
- **Owner** (`OWNER_JID` en .env): único, hardcoded. Puede agregar/eliminar admins.
- **Admin comercial**: puede activar licencias, ver grupos, enviar anuncios.
- Verificación via `commercial.service.js` + `requireCommercialAdmin(ctx)` async guard.

### Licencias
- Tipos: `days N`, `weeks N`, `months N`, `unlimited`
- Campo `license` en `groupsDirectory.json` por JID
- Si licencia inactiva/vencida: bot envía mensaje de contacto y ejecuta `sock.groupLeave()`
- Comandos de gestión bypass la verificación de licencia (BYPASS_COMMANDS en commercial.middleware)

### Comandos de gestión (solo DM con bot)
| Comando | Quién | Acción |
|---------|-------|--------|
| `.cm-admin` | Admin+ | Menú completo |
| `/list-groups` | Admin+ | Lista grupos con estado |
| `/alias <g> <nombre>` | Admin+ | Asignar alias |
| `/activate <g> <tipo> [N]` | Admin+ | Activar licencia |
| `/anuncio <msg>` | Admin+ | Broadcast a grupos activos |
| `/add-admin <num>` | Owner | Dar acceso admin |
| `/remove-admin <num>` | Owner | Revocar acceso |

### Security Logging
- `[SECURITY]` tag en todos los intentos no autorizados de comandos Owner/Admin
- `[SECURITY]` en `.remote bind` no autorizado y sesiones revocadas

## Todos los Issues — ✅ RESUELTOS

### Tier 1
- ✅ Memory Leak Mutex | ✅ Reconexión recursiva | ✅ Race conditions JSON

### Tier 2
- ✅ Caché groupMetadata (30s TTL) | ✅ Timer accumulation | ✅ Errores silenciados

### Tier 3
- ✅ Dockerfile optimizado (node:18-alpine, npm ci, usuario no-root)
- ✅ docker-compose (volúmenes named, healthcheck, log rotation)
- ✅ Graceful Shutdown (SIGTERM/SIGINT → logout + end)
- ✅ .env.example documentado

### Tier 4 (Comercial)
- ✅ Sistema Owner/Admin global
- ✅ Licencias temporales (days/weeks/months/unlimited)
- ✅ Auto-salida en licencia vencida
- ✅ 7 comandos de gestión comercial
- ✅ Security logging en accesos no autorizados

## Estado de producción
- **Score**: ~92/100
- **Gap restante**: health check HTTP real, validación de JIDs al arrancar, tests

## Instrucción de trabajo
No explorar todo el proyecto. El usuario indica qué archivo abrir.
