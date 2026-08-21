# Prompt inicial para Claude Code

Lee completamente `CLAUDE.md` y úsalo como especificación autoritativa del proyecto.

Comienza inspeccionando la carpeta y verificando las herramientas disponibles. Presenta un plan técnico breve de etapas y luego empieza inmediatamente la implementación; no te detengas esperando aprobación después del plan.

Prioriza este primer flujo vertical:

1. Estructura del monorepo.
2. PostgreSQL y modelo Prisma.
3. Seed con organización, usuarios, ubicaciones y activos ficticios.
4. Autenticación y permisos por rol protegidos en backend.
5. Activos con código público y generación de QR.
6. Creación, asignación y cambio de estado de tickets.
7. Auditoría de las acciones anteriores.
8. Interfaz responsive para empleado, técnico y administrador.
9. Pruebas del flujo principal.
10. README reproducible.

No avances todavía con IA, WebSockets ni servicios externos. Si Docker no está disponible, deja Docker Compose correctamente configurado, continúa con todo lo que pueda validarse sin el servicio y documenta con precisión la verificación pendiente. No sustituyas PostgreSQL por una base diferente sin solicitar autorización.

Trabaja hasta alcanzar el máximo estado funcional verificable en esta sesión. Al terminar, informa qué funciona, qué comandos ejecutaste, qué pruebas pasaron y qué queda pendiente.

