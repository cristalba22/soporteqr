import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();

describe('endpoints publicos del sistema', () => {
  it('responde el control de salud sin consultar PostgreSQL', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('publica una especificacion OpenAPI con las rutas principales', async () => {
    const response = await request(app).get('/api/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/api/auth/login']).toBeDefined();
    expect(response.body.paths['/api/assets/{id}']).toBeDefined();
    expect(response.body.paths['/api/tickets/{id}/adjuntos']).toBeDefined();
    expect(response.body.paths['/api/dashboard']).toBeDefined();
  });

  it('sirve la interfaz Swagger', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('SoporteQR API');
  });

  it('permite el frontend local tanto por localhost como por 127.0.0.1', async () => {
    for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
    }
  });

  it('protege las bajas administrativas sin autenticacion', async () => {
    const locationResponse = await request(app).delete('/api/locations/00000000-0000-0000-0000-000000000000');
    const categoryResponse = await request(app).delete('/api/categories/00000000-0000-0000-0000-000000000000');

    expect(locationResponse.status).toBe(401);
    expect(categoryResponse.status).toBe(401);
  });
});
