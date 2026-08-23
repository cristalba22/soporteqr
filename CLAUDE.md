# SoporteQR — instrucciones permanentes para Claude Code

## Objetivo

Construir un MVP profesional y demostrable para portfolio llamado **SoporteQR**: una aplicación web para gestionar activos informáticos e incidencias técnicas mediante códigos QR en clínicas, consultorios, colegios, oficinas y PyMEs.

El proyecto debe demostrar React, TypeScript, Node.js, Express, PostgreSQL, diseño de API, autenticación, permisos por rol, auditoría, pruebas y despliegue. No debe manejar datos clínicos ni información de pacientes.

## Contexto del desarrollador

El propietario es Cristian Eduardo Alba, Técnico en Desarrollo Web de Córdoba, Argentina. Busca oportunidades como Desarrollador Full Stack Jr, Backend Jr o DBA Jr. Tiene experiencia en soporte de sistemas y bases de datos en el área de Sistemas del Sanatorio Allende y conocimientos de React, JavaScript, Node.js, Express, SQL Server, PostgreSQL, MongoDB, HTML, CSS, Git y APIs REST.

Portfolio de referencia: https://portfolio-4eu.pages.dev/

El resultado debe diferenciarse de un tutorial, un e-commerce, un turnero o una lista de tareas.

## Forma de trabajo obligatoria

1. Inspeccionar el repositorio antes de modificarlo con una vista breve (`git status --short`, archivos relevantes y búsquedas dirigidas). No releer todo el repositorio.
2. Mantener un plan breve y actualizado, pero no detenerse después de planificar.
3. Implementar primero un flujo vertical completo.
4. Ejecutar lint, pruebas y build una sola vez al terminar cada etapa importante, nunca después de cada archivo o cambio pequeño.
5. Corregir los errores encontrados antes de continuar.
6. No dejar botones falsos, datos de producción escritos a mano ni pantallas que aparenten funcionar.
7. Priorizar un MVP terminado sobre muchas funciones incompletas.
8. No desplegar, publicar paquetes, crear cuentas externas, hacer push ni comprar servicios.
9. No leer archivos `.env`, credenciales o secretos. Usar únicamente `.env.example` con valores ficticios.
10. No usar información de personas reales en los datos de demostración.

## Control de contexto y ritmo de trabajo

Estas reglas son obligatorias porque las sesiones anteriores agotaron el contexto al releer archivos y repetir verificaciones:

1. Trabajar en una sola etapa concreta por vez. Una etapa normal comprende de una a tres pantallas relacionadas o un flujo vertical acotado; no intentar terminar todo el MVP en una sola sesión.
2. Antes de editar, leer como máximo tres archivos relevantes por lote. Si un archivo supera 400 líneas, buscar primero símbolos con `rg` y leer únicamente el fragmento necesario.
3. No leer `node_modules`, `dist`, `.git`, archivos generados ni el lockfile completo. No repetir la lectura de archivos que no cambiaron.
4. Mantener breves las salidas de terminal: mostrar sólo errores relevantes o las últimas 80 líneas. Nunca imprimir árboles recursivos, dependencias completas, archivos grandes enteros ni diffs completos.
5. No ejecutar `npm install` si las dependencias ya están instaladas y no cambió `package.json`. Ejecutarlo solamente cuando falte una dependencia concreta o cambien las dependencias declaradas.
6. Durante una etapa usar verificaciones dirigidas. Al finalizar ejecutar, como máximo, una pasada de TypeScript, una de lint y una de pruebas/build pertinente. No repetir un comando exitoso.
7. Si una verificación falla, corregir usando el error actual y repetirla como máximo dos veces. Si continúa fallando, guardar un checkpoint y documentar el bloqueo sin iniciar ciclos de lectura/compilación.
8. Después de completar una etapa o acumular aproximadamente 800 líneas modificadas, ejecutar `git status --short`, revisar un resumen con `git diff --stat` y crear un commit local. No esperar permiso para `git add` o `git commit`.
9. No usar la conversación para narrar cada archivo leído. Comunicar solamente el objetivo actual, un bloqueo real o el resultado de la etapa.
10. Si la aplicación informa que el contexto supera aproximadamente la mitad o comienza a compactar repetidamente, terminar el cambio en curso, verificarlo una vez, crear un commit y finalizar con un resumen breve. No seguir leyendo archivos ni iniciar otra etapa.

## Alcance del MVP

### Roles

- **Empleado:** identifica un activo por QR, crea tickets, adjunta una imagen, consulta estados, comenta y recibe notificaciones internas.
- **Técnico:** filtra tickets, se asigna incidencias, cambia estados, registra diagnóstico y solución, consulta el historial del activo y comenta.
- **Administrador:** administra usuarios, ubicaciones, categorías y activos; genera QR; asigna técnicos; consulta métricas y auditoría.

### Entidades

- Organization
- User
- Location
- Asset
- Category
- Ticket
- TicketComment
- TicketAttachment
- TicketHistory
- Notification
- AuditLog

Todas las entidades comerciales deben quedar preparadas para multiempresa mediante `organizationId`, aunque el seed utilice una sola organización.

### Activos

Cada activo incluye código interno único, código público para QR, tipo, marca, modelo, número de serie, ubicación, estado, fecha de adquisición opcional, notas, último mantenimiento e historial de tickets.

El QR debe apuntar a `/reportar/:publicAssetCode`. Nunca debe exponer el identificador interno de la base de datos.

### Tickets

Cada ticket incluye número legible (`SOP-2026-0001`), título, descripción, activo, reportante, técnico, categoría, prioridad, estado, ubicación, adjuntos, diagnóstico, solución y fechas operativas.

Estados: `NUEVO`, `ASIGNADO`, `EN_PROGRESO`, `ESPERANDO_USUARIO`, `RESUELTO`, `CERRADO`.

Prioridades: `BAJA`, `MEDIA`, `ALTA`, `CRITICA`.

### Flujo que debe funcionar

1. El empleado inicia sesión.
2. Abre el QR de una impresora.
3. Crea un ticket y adjunta una imagen.
4. El técnico recibe y se asigna el ticket.
5. Cambia el estado a `EN_PROGRESO`.
6. Registra diagnóstico y solución.
7. Marca el ticket como resuelto.
8. El empleado recibe una notificación.
9. El administrador observa la actualización en métricas y auditoría.

### Dashboard

Mostrar datos reales de PostgreSQL: tickets abiertos y resueltos, tiempo promedio de resolución, distribución por prioridad y categoría, activos con más incidencias, carga por técnico y evolución temporal.

### Auditoría y seguridad

Registrar inicios de sesión exitosos y fallidos, cambios de activos, tickets, estados, asignaciones, roles y acciones administrativas.

Nunca registrar contraseñas, tokens, cookies, datos médicos ni información sensible innecesaria.

Implementar hashing con Argon2 o bcrypt, rate limiting, Helmet, CORS configurable, validación en ambos extremos, RBAC aplicado en backend, refresh token mediante cookie HttpOnly, manejo centralizado de errores y variables de entorno.

## Stack

Monorepo con npm workspaces:

- `apps/web`: React, TypeScript strict, Vite, Tailwind, React Router, TanStack Query, React Hook Form, Zod y Recharts.
- `apps/api`: Node.js, Express, TypeScript strict, PostgreSQL, Prisma, Zod y Swagger/OpenAPI.
- `packages/shared`: tipos, esquemas y constantes compartidas cuando resulte útil.

Calidad: ESLint, Prettier, Vitest, React Testing Library, Supertest, Playwright, Docker Compose para PostgreSQL y GitHub Actions para lint, pruebas y build.

## Diseño

Interfaz completamente en español, profesional, empresarial, accesible y responsive. Usar azul oscuro, blanco, gris y detalles turquesa. Evitar estética de plantilla académica y animaciones innecesarias. Los estados, prioridades y acciones deben distinguirse claramente.

## Datos de demostración

Crear una organización ficticia llamada `Clínica Demo Córdoba`, tres ubicaciones, doce activos, quince tickets variados, comentarios, notificaciones y auditoría.

Usuarios de desarrollo:

- `admin@soporteqr.demo`
- `tecnico@soporteqr.demo`
- `empleado@soporteqr.demo`

Documentar una contraseña ficticia únicamente para desarrollo.

## IA opcional

Solamente después de completar el MVP. Preparar una interfaz desacoplada que sugiera categoría, prioridad y posible solución. Sin API key debe existir un fallback local por palabras clave. La sugerencia nunca modifica automáticamente un ticket.

## Comandos esperados

El repositorio debe tender a soportar:

```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Definición de terminado

No declarar el trabajo terminado hasta que frontend y API compilen, las migraciones y el seed funcionen, los tres roles puedan iniciar sesión, el flujo principal sea demostrable, RBAC esté protegido en backend, el QR funcione, el dashboard lea PostgreSQL, la auditoría registre acciones reales, las pruebas principales pasen y el README permita ejecutar el proyecto desde cero.

## Entregables

- Código fuente completo.
- README en español.
- `.env.example` sin secretos.
- Diagrama sencillo de arquitectura y modelo de datos.
- Swagger/OpenAPI.
- Credenciales de demostración.
- Instrucciones de instalación, migración, seed y ejecución.
- Guía de despliegue sin ejecutar el despliegue.
- Lista de capturas recomendadas para el portfolio.
