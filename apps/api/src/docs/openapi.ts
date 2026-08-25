import swaggerJsdoc from 'swagger-jsdoc';

const bearerSecurity = [{ bearerAuth: [] }];
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
} as const;

const jsonBody = (schema: Record<string, unknown>) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const response = (description: string, schema?: Record<string, unknown>) => ({
  description,
  ...(schema ? { content: { 'application/json': { schema } } } : {}),
});

const entityResponse = (name: string, schema: string) =>
  response('Operacion exitosa', {
    type: 'object',
    properties: { [name]: { $ref: `#/components/schemas/${schema}` } },
  });

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SoporteQR API',
      version: '0.1.0',
      description:
        'API REST para gestionar activos informaticos, tickets de soporte, notificaciones y auditoria mediante codigos QR.',
    },
    servers: [{ url: 'http://localhost:4000', description: 'Desarrollo local' }],
    tags: [
      { name: 'Sistema' },
      { name: 'Autenticacion' },
      { name: 'Activos' },
      { name: 'Tickets' },
      { name: 'Ubicaciones' },
      { name: 'Categorias' },
      { name: 'Usuarios' },
      { name: 'Notificaciones' },
      { name: 'Auditoria' },
      { name: 'Dashboard' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        refreshCookie: { type: 'apiKey', in: 'cookie', name: 'soporteqr_refresh' },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: { error: { type: 'string' }, details: { nullable: true } },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['EMPLEADO', 'TECNICO', 'ADMINISTRADOR'] },
            activo: { type: 'boolean' },
            locationId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            direccion: { type: 'string', nullable: true },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            codigoInterno: { type: 'string' },
            publicAssetCode: { type: 'string' },
            tipo: { type: 'string' },
            marca: { type: 'string', nullable: true },
            modelo: { type: 'string', nullable: true },
            numeroSerie: { type: 'string', nullable: true },
            estado: { type: 'string', enum: ['ACTIVO', 'EN_REPARACION', 'DE_BAJA', 'EN_DEPOSITO'] },
            locationId: { type: 'string', format: 'uuid' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            numero: { type: 'string', example: 'SOP-2026-0001' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            estado: {
              type: 'string',
              enum: ['NUEVO', 'ASIGNADO', 'EN_PROGRESO', 'ESPERANDO_USUARIO', 'RESUELTO', 'CERRADO'],
            },
            prioridad: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] },
            prioridadCalculada: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] },
            prioridadMotivo: { type: 'string', nullable: true },
            assetId: { type: 'string', format: 'uuid' },
            reporterId: { type: 'string', format: 'uuid' },
            technicianId: { type: 'string', format: 'uuid', nullable: true },
            diagnostico: { type: 'string', nullable: true },
            solucion: { type: 'string', nullable: true },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 8 },
          },
        },
        AssetInput: {
          type: 'object',
          required: ['codigoInterno', 'tipo', 'locationId'],
          properties: {
            codigoInterno: { type: 'string' },
            tipo: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            numeroSerie: { type: 'string' },
            locationId: { type: 'string', format: 'uuid' },
            estado: { type: 'string', enum: ['ACTIVO', 'EN_REPARACION', 'DE_BAJA', 'EN_DEPOSITO'] },
            fechaAdquisicion: { type: 'string', format: 'date-time', nullable: true },
            notas: { type: 'string' },
          },
        },
        TicketInput: {
          type: 'object',
          required: ['titulo', 'descripcion', 'assetPublicCode'],
          properties: {
            titulo: { type: 'string', minLength: 4, maxLength: 150 },
            descripcion: { type: 'string', minLength: 10, maxLength: 3000 },
            assetPublicCode: { type: 'string', description: 'Codigo QR publico o codigo interno del activo' },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            impacto: { type: 'string', enum: ['PERSONA', 'SECTOR', 'ORGANIZACION'], default: 'PERSONA' },
            servicioInterrumpido: { type: 'boolean', default: false },
            tieneAlternativa: { type: 'boolean', default: true },
            riesgoSeguridad: { type: 'boolean', default: false },
          },
        },
      },
      responses: {
        BadRequest: response('Datos invalidos', { $ref: '#/components/schemas/Error' }),
        Unauthorized: response('Autenticacion requerida', { $ref: '#/components/schemas/Error' }),
        Forbidden: response('Permisos insuficientes', { $ref: '#/components/schemas/Error' }),
        NotFound: response('Recurso no encontrado', { $ref: '#/components/schemas/Error' }),
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Sistema'],
          summary: 'Comprobar disponibilidad de la API',
          responses: { '200': response('API disponible', { type: 'object', properties: { status: { type: 'string' } } }) },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Autenticacion'],
          summary: 'Iniciar sesion',
          requestBody: jsonBody({ $ref: '#/components/schemas/LoginInput' }),
          responses: {
            '200': response('Sesion iniciada'),
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Autenticacion'],
          summary: 'Renovar token de acceso',
          security: [{ refreshCookie: [] }],
          responses: { '200': response('Token renovado'), '401': { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Autenticacion'],
          summary: 'Cerrar sesion',
          security: bearerSecurity,
          responses: { '204': response('Sesion cerrada'), '401': { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Autenticacion'],
          summary: 'Obtener usuario autenticado',
          security: bearerSecurity,
          responses: { '200': entityResponse('user', 'User'), '401': { $ref: '#/components/responses/Unauthorized' } },
        },
      },
      '/api/assets/publico/{publicAssetCode}': {
        get: {
          tags: ['Activos'],
          summary: 'Consultar activo mediante codigo publico',
          parameters: [{ name: 'publicAssetCode', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': entityResponse('asset', 'Asset'), '404': { $ref: '#/components/responses/NotFound' } },
        },
      },
      '/api/assets/publico/{publicAssetCode}/qr': {
        get: {
          tags: ['Activos'],
          summary: 'Generar etiqueta QR del activo',
          parameters: [{ name: 'publicAssetCode', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Imagen PNG del codigo QR', content: { 'image/png': { schema: { type: 'string', format: 'binary' } } } } },
        },
      },
      '/api/assets': {
        get: {
          tags: ['Activos'], summary: 'Listar activos', security: bearerSecurity,
          responses: { '200': response('Listado de activos'), '401': { $ref: '#/components/responses/Unauthorized' } },
        },
        post: {
          tags: ['Activos'], summary: 'Crear activo (administrador)', security: bearerSecurity,
          requestBody: jsonBody({ $ref: '#/components/schemas/AssetInput' }),
          responses: { '201': entityResponse('asset', 'Asset'), '403': { $ref: '#/components/responses/Forbidden' } },
        },
      },
      '/api/assets/resolver/{code}': {
        get: {
          tags: ['Activos'], summary: 'Resolver un codigo QR o interno dentro de la organizacion', security: bearerSecurity,
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': entityResponse('asset', 'Asset'), '404': { $ref: '#/components/responses/NotFound' } },
        },
      },
      '/api/assets/{id}': {
        get: {
          tags: ['Activos'], summary: 'Consultar activo', security: bearerSecurity, parameters: [idParameter],
          responses: { '200': entityResponse('asset', 'Asset'), '404': { $ref: '#/components/responses/NotFound' } },
        },
        patch: {
          tags: ['Activos'], summary: 'Actualizar activo (administrador)', security: bearerSecurity, parameters: [idParameter],
          requestBody: jsonBody({ $ref: '#/components/schemas/AssetInput' }),
          responses: { '200': entityResponse('asset', 'Asset'), '403': { $ref: '#/components/responses/Forbidden' } },
        },
      },
      '/api/tickets': {
        get: {
          tags: ['Tickets'], summary: 'Listar tickets visibles para el usuario', security: bearerSecurity,
          parameters: [
            { name: 'estado', in: 'query', schema: { type: 'string' } },
            { name: 'prioridad', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          ],
          responses: { '200': response('Listado paginado de tickets') },
        },
        post: {
          tags: ['Tickets'], summary: 'Crear ticket', security: bearerSecurity,
          requestBody: jsonBody({ $ref: '#/components/schemas/TicketInput' }),
          responses: { '201': entityResponse('ticket', 'Ticket'), '400': { $ref: '#/components/responses/BadRequest' } },
        },
      },
      '/api/tickets/{id}': {
        get: {
          tags: ['Tickets'], summary: 'Consultar detalle de ticket', security: bearerSecurity, parameters: [idParameter],
          responses: { '200': entityResponse('ticket', 'Ticket'), '404': { $ref: '#/components/responses/NotFound' } },
        },
      },
      '/api/tickets/{id}/asignar': {
        post: {
          tags: ['Tickets'], summary: 'Asignar tecnico', security: bearerSecurity, parameters: [idParameter],
          requestBody: jsonBody({ type: 'object', required: ['technicianId'], properties: { technicianId: { type: 'string', format: 'uuid' } } }),
          responses: { '200': entityResponse('ticket', 'Ticket'), '403': { $ref: '#/components/responses/Forbidden' } },
        },
      },
      '/api/tickets/{id}/estado': {
        post: {
          tags: ['Tickets'], summary: 'Cambiar estado, diagnostico o solucion', security: bearerSecurity, parameters: [idParameter],
          requestBody: jsonBody({
            type: 'object', required: ['estado'],
            properties: { estado: { type: 'string' }, diagnostico: { type: 'string' }, solucion: { type: 'string' } },
          }),
          responses: { '200': entityResponse('ticket', 'Ticket'), '403': { $ref: '#/components/responses/Forbidden' } },
        },
      },
      '/api/tickets/{id}/prioridad': {
        post: {
          tags: ['Tickets'], summary: 'Ajustar prioridad con justificacion (tecnico o administrador)', security: bearerSecurity, parameters: [idParameter],
          requestBody: jsonBody({
            type: 'object', required: ['prioridad', 'motivo'],
            properties: {
              prioridad: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] },
              motivo: { type: 'string', minLength: 10, maxLength: 500 },
            },
          }),
          responses: { '200': entityResponse('ticket', 'Ticket'), '403': { $ref: '#/components/responses/Forbidden' } },
        },
      },
      '/api/tickets/{id}/comentarios': {
        post: {
          tags: ['Tickets'], summary: 'Agregar comentario', security: bearerSecurity, parameters: [idParameter],
          requestBody: jsonBody({ type: 'object', required: ['contenido'], properties: { contenido: { type: 'string' }, interno: { type: 'boolean', default: false } } }),
          responses: { '201': response('Comentario creado') },
        },
      },
      '/api/tickets/{id}/adjuntos': {
        post: {
          tags: ['Tickets'], summary: 'Adjuntar una imagen al ticket', security: bearerSecurity, parameters: [idParameter],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', required: ['archivo'], properties: { archivo: { type: 'string', format: 'binary' } } } } },
          },
          responses: { '201': response('Adjunto creado'), '400': { $ref: '#/components/responses/BadRequest' } },
        },
      },
      '/api/tickets/{id}/adjuntos/{attachmentId}': {
        get: {
          tags: ['Tickets'], summary: 'Descargar adjunto autorizado', security: bearerSecurity,
          parameters: [idParameter, { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { description: 'Archivo adjunto', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } } },
        },
      },
      '/api/locations': {
        get: { tags: ['Ubicaciones'], summary: 'Listar ubicaciones', security: bearerSecurity, responses: { '200': response('Listado de ubicaciones') } },
        post: {
          tags: ['Ubicaciones'], summary: 'Crear ubicacion (administrador)', security: bearerSecurity,
          requestBody: jsonBody({ type: 'object', required: ['nombre'], properties: { nombre: { type: 'string' }, direccion: { type: 'string' } } }),
          responses: { '201': entityResponse('location', 'Location') },
        },
      },
      '/api/locations/{id}': {
        get: { tags: ['Ubicaciones'], summary: 'Consultar ubicacion', security: bearerSecurity, parameters: [idParameter], responses: { '200': entityResponse('location', 'Location') } },
        patch: { tags: ['Ubicaciones'], summary: 'Actualizar ubicacion (administrador)', security: bearerSecurity, parameters: [idParameter], responses: { '200': entityResponse('location', 'Location') } },
        delete: { tags: ['Ubicaciones'], summary: 'Eliminar ubicacion sin dependencias (administrador)', security: bearerSecurity, parameters: [idParameter], responses: { '204': response('Ubicacion eliminada'), '409': response('La ubicacion tiene elementos asociados') } },
      },
      '/api/categories': {
        get: { tags: ['Categorias'], summary: 'Listar categorias', security: bearerSecurity, responses: { '200': response('Listado de categorias') } },
        post: { tags: ['Categorias'], summary: 'Crear categoria (administrador)', security: bearerSecurity, responses: { '201': entityResponse('category', 'Category') } },
      },
      '/api/categories/{id}': {
        get: { tags: ['Categorias'], summary: 'Consultar categoria', security: bearerSecurity, parameters: [idParameter], responses: { '200': entityResponse('category', 'Category') } },
        patch: { tags: ['Categorias'], summary: 'Actualizar categoria (administrador)', security: bearerSecurity, parameters: [idParameter], responses: { '200': entityResponse('category', 'Category') } },
        delete: { tags: ['Categorias'], summary: 'Eliminar categoria sin tickets (administrador)', security: bearerSecurity, parameters: [idParameter], responses: { '204': response('Categoria eliminada'), '409': response('La categoria tiene tickets asociados') } },
      },
      '/api/users': {
        get: { tags: ['Usuarios'], summary: 'Listar usuarios (administrador)', security: bearerSecurity, responses: { '200': response('Listado de usuarios') } },
        post: { tags: ['Usuarios'], summary: 'Crear usuario (administrador)', security: bearerSecurity, responses: { '201': entityResponse('user', 'User') } },
      },
      '/api/users/technicians': {
        get: { tags: ['Usuarios'], summary: 'Listar tecnicos activos para asignacion', security: bearerSecurity, responses: { '200': response('Listado limitado de tecnicos') } },
      },
      '/api/users/{id}': {
        get: { tags: ['Usuarios'], summary: 'Consultar usuario (administrador)', security: bearerSecurity, parameters: [idParameter], responses: { '200': entityResponse('user', 'User') } },
        patch: { tags: ['Usuarios'], summary: 'Actualizar usuario (administrador)', security: bearerSecurity, parameters: [idParameter], responses: { '200': entityResponse('user', 'User') } },
      },
      '/api/notifications': {
        get: { tags: ['Notificaciones'], summary: 'Listar notificaciones propias', security: bearerSecurity, responses: { '200': response('Listado de notificaciones') } },
      },
      '/api/notifications/{id}/leida': {
        patch: { tags: ['Notificaciones'], summary: 'Marcar notificacion como leida', security: bearerSecurity, parameters: [idParameter], responses: { '200': response('Notificacion actualizada') } },
      },
      '/api/audit': {
        get: { tags: ['Auditoria'], summary: 'Consultar auditoria (administrador)', security: bearerSecurity, responses: { '200': response('Listado paginado de auditoria') } },
      },
      '/api/dashboard': {
        get: { tags: ['Dashboard'], summary: 'Obtener metricas reales (tecnico o administrador)', security: bearerSecurity, responses: { '200': response('Resumen de metricas') } },
      },
    },
  },
  apis: [],
});
