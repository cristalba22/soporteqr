# Operación, almacenamiento, backups y monitoreo

## Estado actual

- La demo usa PostgreSQL 18 administrado y Cloudflare R2 privado para adjuntos.
- La API soporta `STORAGE_DRIVER=local` y `STORAGE_DRIVER=r2` sin cambiar rutas ni la base.
- Los adjuntos nunca son públicos: toda descarga vuelve a comprobar organización, usuario y rol.
- `/api/health` comprueba que el proceso vive; `/api/health/ready` comprueba PostgreSQL y almacenamiento.
- GitHub Actions verifica web y API cada 15 minutos y abre un issue si detecta una caída.

## Activar Cloudflare R2

R2 debe estar habilitado primero desde el panel de Cloudflare. Crear dos buckets privados:

1. `soporteqr-attachments`, clase Standard, para adjuntos.
2. `soporteqr-backups`, clase Standard, para copias cifradas.

No habilitar `r2.dev`, dominio público ni CORS: los archivos pasan por servicios autenticados.

Crear credenciales diferentes y con alcance mínimo:

- API Railway: Object Read & Write solamente sobre `soporteqr-attachments`.
- GitHub Actions: Object Read & Write solamente sobre `soporteqr-backups`.

Configurar en Railway:

```text
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<credencial limitada a adjuntos>
R2_SECRET_ACCESS_KEY=<secreto limitado a adjuntos>
R2_ATTACHMENTS_BUCKET=soporteqr-attachments
```

En producción, `/api/health/ready` responde `storage: "r2"`. Los adjuntos nuevos se guardan en R2 y los archivos históricos del volumen continúan disponibles durante la transición.

## Backups automáticos y restauración

El workflow `backup.yml` se ejecuta diariamente, cifra el dump con AES-256/PBKDF2, lo restaura en un PostgreSQL aislado y sólo entonces lo sube al bucket privado.

Secretos del repositorio:

```text
PROD_DATABASE_URL
BACKUP_PASSPHRASE
R2_ACCOUNT_ID
R2_BACKUP_ACCESS_KEY_ID
R2_BACKUP_SECRET_ACCESS_KEY
```

Variables del repositorio:

```text
R2_BACKUPS_BUCKET=soporteqr-backups
BACKUPS_ENABLED=true
```

Usar una frase de backup aleatoria y larga, diferente de las contraseñas de la aplicación. Guardarla también fuera de GitHub: sin ella los backups no pueden recuperarse.

Configurar en R2 una regla de ciclo de vida para `postgres/daily/` con la retención elegida (recomendado para piloto: 30 a 90 días). La restauración manual es destructiva y debe probarse primero sobre una base vacía:

```bash
export BACKUP_PASSPHRASE='<secreto>'
export RESTORE_DATABASE_URL='postgresql://.../base_vacia'
bash scripts/verify-backup.sh soporteqr-fecha.dump.enc
bash scripts/restore-database.sh soporteqr-fecha.dump.enc
```

## Monitoreo y alertas

`uptime.yml` comprueba cada 15 minutos:

- que Vercel entregue la aplicación;
- que Railway responda;
- que PostgreSQL y el almacenamiento estén disponibles.

Ante una caída abre o actualiza el issue `[Monitor] SoporteQR no responde correctamente`; al recuperarse, lo documenta y lo cierra.

Para errores 500, configurar opcionalmente en Railway un webhook privado de Slack o Discord:

```text
ERROR_ALERT_WEBHOOK_URL=<webhook privado>
```

La alerta contiene sólo entorno, ruta, tipo de error y fecha. No transmite cuerpos, correos, tokens ni datos potencialmente clínicos. Los eventos idénticos se agrupan durante cinco minutos para evitar tormentas de alertas.

## CI y evidencia

`ci.yml` ejecuta lint, Vitest/Supertest/RTL, Playwright con PostgreSQL 16 y build. Si Playwright falla, conserva traza y capturas durante siete días para diagnóstico.
