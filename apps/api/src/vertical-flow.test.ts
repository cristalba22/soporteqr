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
    const [employee, technician, administrator] = await Promise.all([
      login('empleado@soporteqr.demo'),
      login('tecnico@soporteqr.demo'),
      login('admin@soporteqr.demo'),
    ]);

    expect(employee.user.role).toBe('EMPLEADO');
    expect(technician.user.role).toBe('TECNICO');
    expect(administrator.user.role).toBe('ADMINISTRADOR');

    const categories = await request(app)
      .get('/api/categories')
      .set(auth(employee.accessToken))
      .expect(200);
    const hardware = categories.body.categories.find((category: { nombre: string }) => category.nombre === 'Hardware');

    const created = await request(app)
      .post('/api/tickets')
      .set(auth(employee.accessToken))
      .send({
        titulo: 'Flujo vertical automatizado',
        descripcion: 'Incidencia creada por Supertest para validar el circuito completo.',
        assetPublicCode: 'AST0001',
        categoryId: hardware.id,
        prioridad: 'ALTA',
      })
      .expect(201);
    const ticketId = created.body.ticket.id as string;

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
      expect.arrayContaining(['TICKET_CREADO', 'TICKET_ASIGNADO', 'TICKET_CAMBIO_ESTADO']),
    );
  });
});
