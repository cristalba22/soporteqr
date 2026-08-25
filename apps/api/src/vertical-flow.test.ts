import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();
const password = 'Demo1234!';

async function login(email: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return response.body as {
    accessToken: string;
    user: { id: string; email: string; role: string };
  };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('flujo vertical completo de SoporteQR', () => {
  it('conecta empleado, tecnico y administrador desde el ticket hasta auditoria', async () => {
    const [employee, otherEmployee, technician, administrator] = await Promise.all([
      login('empleado@soporteqr.demo'),
      login('empleado2@soporteqr.demo'),
      login('tecnico@soporteqr.demo'),
      login('admin@soporteqr.demo'),
    ]);

    expect(employee.user.role).toBe('EMPLEADO');
    expect(otherEmployee.user.role).toBe('EMPLEADO');
    expect(technician.user.role).toBe('TECNICO');
    expect(administrator.user.role).toBe('ADMINISTRADOR');

    const categories = await request(app)
      .get('/api/categories')
      .set(auth(employee.accessToken))
      .expect(200);
    const hardware = categories.body.categories.find(
      (category: { nombre: string }) => category.nombre === 'Hardware',
    );

    const created = await request(app)
      .post('/api/tickets')
      .set(auth(employee.accessToken))
      .send({
        titulo: 'Flujo vertical automatizado',
        descripcion: 'Incidencia creada por Supertest para validar el circuito completo.',
        assetPublicCode: 'PC-001',
        categoryId: hardware.id,
        impacto: 'SECTOR',
        servicioInterrumpido: true,
        tieneAlternativa: false,
        riesgoSeguridad: false,
      })
      .expect(201);
    const ticketId = created.body.ticket.id as string;
    expect(created.body.ticket.prioridad).toBe('ALTA');
    expect(created.body.ticket.prioridadCalculada).toBe('ALTA');

    const attachmentBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const uploaded = await request(app)
      .post(`/api/tickets/${ticketId}/adjuntos`)
      .set(auth(employee.accessToken))
      .attach('archivo', attachmentBytes, { filename: 'evidencia.png', contentType: 'image/png' })
      .expect(201);
    const attachmentId = uploaded.body.attachment.id as string;
    const downloaded = await request(app)
      .get(`/api/tickets/${ticketId}/adjuntos/${attachmentId}`)
      .set(auth(employee.accessToken))
      .expect(200);
    expect(downloaded.headers['content-type']).toContain('image/png');
    expect(Buffer.compare(downloaded.body as Buffer, attachmentBytes)).toBe(0);

    await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set(auth(otherEmployee.accessToken))
      .expect(404);
    const otherEmployeeTickets = await request(app)
      .get('/api/tickets?pageSize=100')
      .set(auth(otherEmployee.accessToken))
      .expect(200);
    expect(otherEmployeeTickets.body.tickets).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: ticketId })]),
    );

    const reprioritized = await request(app)
      .post(`/api/tickets/${ticketId}/prioridad`)
      .set(auth(technician.accessToken))
      .send({ prioridad: 'MEDIA', motivo: 'Se confirmo una alternativa operativa temporal.' })
      .expect(200);
    expect(reprioritized.body.ticket.prioridad).toBe('MEDIA');

    const assigned = await request(app)
      .post(`/api/tickets/${ticketId}/asignar`)
      .set(auth(technician.accessToken))
      .send({ technicianId: technician.user.id })
      .expect(200);
    expect(assigned.body.ticket.estado).toBe('ASIGNADO');

    await request(app)
      .post(`/api/tickets/${ticketId}/estado`)
      .set(auth(technician.accessToken))
      .send({ estado: 'EN_PROGRESO', diagnostico: 'Diagnostico automatizado confirmado.' })
      .expect(200);

    const resolved = await request(app)
      .post(`/api/tickets/${ticketId}/estado`)
      .set(auth(technician.accessToken))
      .send({
        estado: 'RESUELTO',
        diagnostico: 'Diagnostico automatizado confirmado.',
        solucion: 'Solucion aplicada y verificada por la suite.',
      })
      .expect(200);
    expect(resolved.body.ticket.estado).toBe('RESUELTO');
    expect(resolved.body.ticket.solucion).toContain('suite');

    const notifications = await request(app)
      .get('/api/notifications')
      .set(auth(employee.accessToken))
      .expect(200);
    expect(notifications.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ticketId, type: 'TICKET_RESUELTO', userId: employee.user.id }),
      ]),
    );

    const audit = await request(app)
      .get('/api/audit?entidad=Ticket&pageSize=100')
      .set(auth(administrator.accessToken))
      .expect(200);
    const ticketActions = audit.body.items
      .filter((item: { entidadId: string }) => item.entidadId === ticketId)
      .map((item: { action: string }) => item.action);

    expect(ticketActions).toEqual(
      expect.arrayContaining([
        'TICKET_CREADO',
        'TICKET_PRIORIDAD_CAMBIADA',
        'TICKET_ASIGNADO',
        'TICKET_CAMBIO_ESTADO',
      ]),
    );
  });
});
