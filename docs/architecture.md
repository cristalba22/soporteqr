# Arquitectura de SoporteQR

## Componentes

```mermaid
flowchart TB
  subgraph Cliente
    WEB[React + TypeScript]
    QR[Escaneo de QR]
  end

  subgraph Backend
    API[Express REST API]
    AUTH[JWT + refresh HttpOnly]
    RBAC[RBAC por organización]
    AUDIT[Auditoría]
    FILES[Adjuntos]
  end

  DB[(PostgreSQL)]

  QR -->|publicAssetCode| WEB
  WEB -->|HTTPS / JSON| API
  API --> AUTH
  API --> RBAC
  API --> AUDIT
  API --> FILES
  API -->|Prisma| DB
```

## Modelo de dominio

```mermaid
erDiagram
  ORGANIZATION ||--o{ USER : contiene
  ORGANIZATION ||--o{ LOCATION : contiene
  ORGANIZATION ||--o{ ASSET : contiene
  ORGANIZATION ||--o{ TICKET : contiene
  LOCATION ||--o{ ASSET : ubica
  LOCATION ||--o{ USER : asigna
  ASSET ||--o{ TICKET : recibe
  CATEGORY ||--o{ TICKET : clasifica
  USER ||--o{ TICKET : reporta
  USER ||--o{ TICKET : atiende
  TICKET ||--o{ TICKET_COMMENT : conversa
  TICKET ||--o{ TICKET_ATTACHMENT : adjunta
  TICKET ||--o{ TICKET_HISTORY : registra
  TICKET ||--o{ NOTIFICATION : notifica
  ORGANIZATION ||--o{ AUDIT_LOG : audita
```

## Límites de autorización

| Rol | Capacidades principales |
| --- | --- |
| Empleado | Reportar, consultar tickets propios, comentar y recibir notificaciones |
| Técnico | Consultar tickets de la organización, asignarse, diagnosticar y resolver |
| Administrador | Todo lo anterior, configuración, usuarios, métricas y auditoría |

El backend filtra siempre por `organizationId`. Las restricciones visuales del frontend no se consideran controles de seguridad.

## Flujo vertical validado

```mermaid
sequenceDiagram
  actor E as Empleado
  participant API
  participant DB as PostgreSQL
  actor T as Técnico
  actor A as Administrador

  E->>API: Login y POST /tickets
  API->>DB: Ticket + historial + auditoría
  T->>API: Asignar ticket
  API->>DB: Asignación + notificación + auditoría
  T->>API: EN_PROGRESO y RESUELTO
  API->>DB: Estado + diagnóstico + solución
  API->>DB: Notificación al empleado
  E->>API: GET /notifications
  A->>API: GET /dashboard y /audit
```
