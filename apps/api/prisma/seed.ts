import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { hashPassword } from '../src/modules/auth/password.js';

const DEMO_PASSWORD = 'Demo1234!';

function daysAgo(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
}

export async function seedDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  try {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: { nombre: 'Clínica Demo Córdoba' },
  });

  const [recepcion, consultorios, administracion] = await Promise.all([
    prisma.location.create({ data: { organizationId: organization.id, nombre: 'Recepción', direccion: 'Planta baja' } }),
    prisma.location.create({ data: { organizationId: organization.id, nombre: 'Consultorios', direccion: 'Primer piso' } }),
    prisma.location.create({ data: { organizationId: organization.id, nombre: 'Administración', direccion: 'Segundo piso' } }),
  ]);
  const ubicaciones = [recepcion, consultorios, administracion];

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      nombre: 'Ana Administradora',
      email: 'admin@soporteqr.demo',
      passwordHash,
      role: 'ADMINISTRADOR',
      locationId: administracion.id,
    },
  });

  const tecnico = await prisma.user.create({
    data: {
      organizationId: organization.id,
      nombre: 'Tomás Técnico',
      email: 'tecnico@soporteqr.demo',
      passwordHash,
      role: 'TECNICO',
      locationId: administracion.id,
    },
  });

  const tecnico2 = await prisma.user.create({
    data: {
      organizationId: organization.id,
      nombre: 'Valeria Soporte',
      email: 'tecnico2@soporteqr.demo',
      passwordHash,
      role: 'TECNICO',
      locationId: administracion.id,
    },
  });

  const empleado = await prisma.user.create({
    data: {
      organizationId: organization.id,
      nombre: 'Emilia Empleada',
      email: 'empleado@soporteqr.demo',
      passwordHash,
      role: 'EMPLEADO',
      locationId: recepcion.id,
    },
  });

  const empleado2 = await prisma.user.create({
    data: {
      organizationId: organization.id,
      nombre: 'Ezequiel Empleado',
      email: 'empleado2@soporteqr.demo',
      passwordHash,
      role: 'EMPLEADO',
      locationId: consultorios.id,
    },
  });

  const [catHardware, catRed, catSoftware, catImpresion] = await Promise.all([
    prisma.category.create({ data: { organizationId: organization.id, nombre: 'Hardware', descripcion: 'Fallas físicas de equipos' } }),
    prisma.category.create({ data: { organizationId: organization.id, nombre: 'Red', descripcion: 'Conectividad y redes' } }),
    prisma.category.create({ data: { organizationId: organization.id, nombre: 'Software', descripcion: 'Aplicaciones y sistema operativo' } }),
    prisma.category.create({ data: { organizationId: organization.id, nombre: 'Impresión', descripcion: 'Impresoras y escáneres' } }),
  ]);
  const categorias = [catHardware, catRed, catSoftware, catImpresion];

  const activosDatos = [
    { codigoInterno: 'PC-001', tipo: 'Computadora de escritorio', marca: 'Dell', modelo: 'OptiPlex 3080', numeroSerie: 'DL3080-001', locationId: recepcion.id },
    { codigoInterno: 'PC-002', tipo: 'Computadora de escritorio', marca: 'HP', modelo: 'ProDesk 400', numeroSerie: 'HP400-002', locationId: consultorios.id },
    { codigoInterno: 'PC-003', tipo: 'Computadora de escritorio', marca: 'Dell', modelo: 'OptiPlex 3080', numeroSerie: 'DL3080-003', locationId: administracion.id },
    { codigoInterno: 'NB-001', tipo: 'Notebook', marca: 'Lenovo', modelo: 'ThinkPad E14', numeroSerie: 'LN14-001', locationId: consultorios.id },
    { codigoInterno: 'NB-002', tipo: 'Notebook', marca: 'Lenovo', modelo: 'ThinkPad E14', numeroSerie: 'LN14-002', locationId: administracion.id },
    { codigoInterno: 'IMP-001', tipo: 'Impresora', marca: 'Epson', modelo: 'L3250', numeroSerie: 'EP3250-001', locationId: recepcion.id },
    { codigoInterno: 'IMP-002', tipo: 'Impresora', marca: 'HP', modelo: 'LaserJet M110', numeroSerie: 'HPLJ-002', locationId: administracion.id },
    { codigoInterno: 'RED-001', tipo: 'Router', marca: 'TP-Link', modelo: 'Archer C6', numeroSerie: 'TPC6-001', locationId: administracion.id },
    { codigoInterno: 'RED-002', tipo: 'Switch', marca: 'TP-Link', modelo: 'TL-SG1008', numeroSerie: 'TPSG-002', locationId: administracion.id },
    { codigoInterno: 'MON-001', tipo: 'Monitor', marca: 'Samsung', modelo: 'S24R350', numeroSerie: 'SM24-001', locationId: recepcion.id },
    { codigoInterno: 'MON-002', tipo: 'Monitor', marca: 'LG', modelo: '24MK430H', numeroSerie: 'LG24-002', locationId: consultorios.id },
    { codigoInterno: 'TAB-001', tipo: 'Tablet', marca: 'Samsung', modelo: 'Galaxy Tab A8', numeroSerie: 'SGT8-001', locationId: consultorios.id },
  ];

  const activos = [];
  for (let i = 0; i < activosDatos.length; i++) {
    const d = activosDatos[i];
    const activo = await prisma.asset.create({
      data: {
        organizationId: organization.id,
        codigoInterno: d.codigoInterno,
        publicAssetCode: `AST${String(i + 1).padStart(4, '0')}`,
        tipo: d.tipo,
        marca: d.marca,
        modelo: d.modelo,
        numeroSerie: d.numeroSerie,
        locationId: d.locationId,
        estado: 'ACTIVO',
        fechaAdquisicion: daysAgo(400 + i * 10),
        ultimoMantenimiento: daysAgo(30 + i * 5),
      },
    });
    activos.push(activo);
  }

  const reportantes = [empleado, empleado2, admin];
  const tecnicos = [tecnico, tecnico2];

  type TicketSeed = {
    titulo: string;
    descripcion: string;
    assetIdx: number;
    reporterIdx: number;
    tecnicoIdx: number | null;
    categoriaIdx: number;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    estado: 'NUEVO' | 'ASIGNADO' | 'EN_PROGRESO' | 'ESPERANDO_USUARIO' | 'RESUELTO' | 'CERRADO';
    diasAtras: number;
    diagnostico?: string;
    solucion?: string;
  };

  const ticketsSeed: TicketSeed[] = [
    { titulo: 'La PC no enciende', descripcion: 'La computadora de recepción no enciende al presionar el botón.', assetIdx: 0, reporterIdx: 0, tecnicoIdx: 0, categoriaIdx: 0, prioridad: 'ALTA', estado: 'RESUELTO', diasAtras: 20, diagnostico: 'Fuente de alimentación defectuosa', solucion: 'Se reemplazó la fuente de alimentación' },
    { titulo: 'Impresora no imprime', descripcion: 'La impresora Epson no responde al enviar trabajos de impresión.', assetIdx: 5, reporterIdx: 0, tecnicoIdx: 0, categoriaIdx: 3, prioridad: 'MEDIA', estado: 'RESUELTO', diasAtras: 18, diagnostico: 'Cartucho de tinta vacío', solucion: 'Se reemplazó el cartucho de tinta' },
    { titulo: 'Sin conexión a internet', descripcion: 'El router no distribuye internet en el sector de administración.', assetIdx: 7, reporterIdx: 2, tecnicoIdx: 1, categoriaIdx: 1, prioridad: 'CRITICA', estado: 'CERRADO', diasAtras: 25, diagnostico: 'Firmware desactualizado del router', solucion: 'Se actualizó el firmware y se reinició el equipo' },
    { titulo: 'Notebook muy lenta', descripcion: 'La notebook del consultorio tarda varios minutos en iniciar.', assetIdx: 3, reporterIdx: 1, tecnicoIdx: 1, categoriaIdx: 2, prioridad: 'BAJA', estado: 'RESUELTO', diasAtras: 15, diagnostico: 'Disco con poco espacio y muchos programas de inicio', solucion: 'Se liberó espacio y se limpiaron programas de inicio' },
    { titulo: 'Monitor con líneas en pantalla', descripcion: 'El monitor de recepción muestra líneas verticales de color.', assetIdx: 9, reporterIdx: 0, tecnicoIdx: 0, categoriaIdx: 0, prioridad: 'MEDIA', estado: 'EN_PROGRESO', diasAtras: 5, diagnostico: 'Posible falla del panel LCD' },
    { titulo: 'No puedo iniciar sesión en el sistema', descripcion: 'El sistema de gestión no acepta las credenciales de la administración.', assetIdx: 2, reporterIdx: 2, tecnicoIdx: 1, categoriaIdx: 2, prioridad: 'ALTA', estado: 'EN_PROGRESO', diasAtras: 3, diagnostico: 'Cuenta bloqueada por intentos fallidos' },
    { titulo: 'Switch de red con luces intermitentes', descripcion: 'El switch de administración parpadea y corta la conexión intermitentemente.', assetIdx: 8, reporterIdx: 2, tecnicoIdx: null, categoriaIdx: 1, prioridad: 'ALTA', estado: 'ASIGNADO', diasAtras: 2 },
    { titulo: 'Impresora HP atasca papel', descripcion: 'La impresora láser de administración atasca el papel constantemente.', assetIdx: 6, reporterIdx: 2, tecnicoIdx: 0, categoriaIdx: 3, prioridad: 'MEDIA', estado: 'ASIGNADO', diasAtras: 2 },
    { titulo: 'Tablet no carga batería', descripcion: 'La tablet de consultorios no carga al conectar el cargador.', assetIdx: 11, reporterIdx: 1, tecnicoIdx: null, categoriaIdx: 0, prioridad: 'BAJA', estado: 'NUEVO', diasAtras: 1 },
    { titulo: 'Actualización de software pendiente', descripcion: 'Se solicita actualizar el sistema operativo de la notebook de administración.', assetIdx: 4, reporterIdx: 2, tecnicoIdx: null, categoriaIdx: 2, prioridad: 'BAJA', estado: 'NUEVO', diasAtras: 1 },
    { titulo: 'Monitor de consultorio no enciende', descripcion: 'El monitor LG no muestra imagen aunque el equipo está encendido.', assetIdx: 10, reporterIdx: 1, tecnicoIdx: 1, categoriaIdx: 0, prioridad: 'MEDIA', estado: 'ESPERANDO_USUARIO', diasAtras: 4, diagnostico: 'Se solicitó al usuario probar con otro cable VGA' },
    { titulo: 'PC de administración reinicia sola', descripcion: 'La computadora se reinicia de forma inesperada varias veces al día.', assetIdx: 2, reporterIdx: 2, tecnicoIdx: 0, categoriaIdx: 0, prioridad: 'CRITICA', estado: 'ESPERANDO_USUARIO', diasAtras: 6, diagnostico: 'Posible sobrecalentamiento, se solicitó limpieza programada' },
    { titulo: 'No se puede escanear documentos', descripcion: 'El escáner integrado de la impresora Epson no es detectado por la PC.', assetIdx: 5, reporterIdx: 0, tecnicoIdx: null, categoriaIdx: 3, prioridad: 'BAJA', estado: 'NUEVO', diasAtras: 0 },
    { titulo: 'Router pierde señal wifi', descripcion: 'La señal wifi del router se corta intermitentemente en consultorios.', assetIdx: 7, reporterIdx: 1, tecnicoIdx: 1, categoriaIdx: 1, prioridad: 'ALTA', estado: 'RESUELTO', diasAtras: 12, diagnostico: 'Interferencia de canal wifi', solucion: 'Se cambió el canal wifi y se reubicó la antena' },
    { titulo: 'Teclado de notebook con teclas que no responden', descripcion: 'Varias teclas del teclado de la notebook de consultorios no responden.', assetIdx: 3, reporterIdx: 1, tecnicoIdx: 0, categoriaIdx: 0, prioridad: 'MEDIA', estado: 'RESUELTO', diasAtras: 10, diagnostico: 'Suciedad acumulada bajo las teclas', solucion: 'Se realizó limpieza del teclado' },
  ];

  let numeroSecuencial = 1;
  const anio = new Date().getFullYear();

  for (const t of ticketsSeed) {
    const numero = `SOP-${anio}-${String(numeroSecuencial).padStart(4, '0')}`;
    numeroSecuencial += 1;

    const asset = activos[t.assetIdx];
    const reportante = reportantes[t.reporterIdx];
    const tecnicoAsignado = t.tecnicoIdx !== null ? tecnicos[t.tecnicoIdx] : null;
    const categoria = categorias[t.categoriaIdx];
    const creado = daysAgo(t.diasAtras);
    const resuelto = t.estado === 'RESUELTO' || t.estado === 'CERRADO' ? daysAgo(Math.max(t.diasAtras - 2, 0)) : null;
    const cerrado = t.estado === 'CERRADO' ? daysAgo(Math.max(t.diasAtras - 1, 0)) : null;
    const primeraRespuesta = tecnicoAsignado ? daysAgo(Math.max(t.diasAtras - 1, 0)) : null;

    const ticket = await prisma.ticket.create({
      data: {
        organizationId: organization.id,
        numero,
        titulo: t.titulo,
        descripcion: t.descripcion,
        assetId: asset.id,
        reporterId: reportante.id,
        technicianId: tecnicoAsignado?.id,
        categoryId: categoria.id,
        locationId: asset.locationId,
        prioridad: t.prioridad,
        estado: t.estado,
        diagnostico: t.diagnostico,
        solucion: t.solucion,
        createdAt: creado,
        primeraRespuestaAt: primeraRespuesta ?? undefined,
        resueltoAt: resuelto ?? undefined,
        cerradoAt: cerrado ?? undefined,
      },
    });

    await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        authorId: reportante.id,
        contenido: 'Quedo atento a novedades sobre este ticket, gracias.',
        interno: false,
        createdAt: creado,
      },
    });

    if (tecnicoAsignado) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: tecnicoAsignado.id,
          contenido: 'Tomo el ticket, reviso el equipo a la brevedad.',
          interno: false,
          createdAt: primeraRespuesta ?? creado,
        },
      });

      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: tecnicoAsignado.id,
          estadoAnterior: 'NUEVO',
          estadoNuevo: 'ASIGNADO',
          descripcion: `${tecnicoAsignado.nombre} se asignó el ticket`,
          createdAt: primeraRespuesta ?? creado,
        },
      });

      await prisma.notification.create({
        data: {
          userId: tecnicoAsignado.id,
          ticketId: ticket.id,
          type: 'TICKET_ASIGNADO',
          mensaje: `Se te asignó el ticket ${numero}: ${t.titulo}`,
          leida: t.estado === 'RESUELTO' || t.estado === 'CERRADO',
          createdAt: primeraRespuesta ?? creado,
        },
      });
    }

    if (resuelto) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: tecnicoAsignado?.id ?? admin.id,
          estadoAnterior: 'EN_PROGRESO',
          estadoNuevo: 'RESUELTO',
          descripcion: 'Ticket marcado como resuelto',
          createdAt: resuelto,
        },
      });

      await prisma.notification.create({
        data: {
          userId: reportante.id,
          ticketId: ticket.id,
          type: 'TICKET_RESUELTO',
          mensaje: `Tu ticket ${numero} fue resuelto`,
          leida: t.estado === 'CERRADO',
          createdAt: resuelto,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: reportante.id,
        action: 'TICKET_CREADO',
        entidad: 'Ticket',
        entidadId: ticket.id,
        detalle: { numero, titulo: t.titulo },
        createdAt: creado,
      },
    });

    if (tecnicoAsignado) {
      await prisma.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: tecnicoAsignado.id,
          action: 'TICKET_ASIGNADO',
          entidad: 'Ticket',
          entidadId: ticket.id,
          detalle: { numero, tecnico: tecnicoAsignado.nombre },
          createdAt: primeraRespuesta ?? creado,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      userId: admin.id,
      action: 'LOGIN_EXITOSO',
      entidad: 'User',
      entidadId: admin.id,
      detalle: { email: admin.email },
      createdAt: daysAgo(1),
    },
  });

  console.log('Seed completado.');
  console.log('Usuarios de demostración (contraseña: %s):', DEMO_PASSWORD);
  console.log(' - admin@soporteqr.demo (ADMINISTRADOR)');
  console.log(' - tecnico@soporteqr.demo (TECNICO)');
  console.log(' - empleado@soporteqr.demo (EMPLEADO)');
  } finally {
    await prisma.$disconnect();
  }
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  seedDatabase().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
