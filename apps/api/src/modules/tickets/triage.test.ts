import { describe, expect, it } from 'vitest';
import type { CreateTicketInput } from '@soporteqr/shared';
import { calcularPrioridad, sugerirCategoria } from './triage.js';

const base: CreateTicketInput = {
  titulo: 'Equipo con una falla',
  descripcion: 'El equipo presenta una falla desde esta manana.',
  assetPublicCode: 'IMP-001',
  impacto: 'PERSONA',
  servicioInterrumpido: false,
  tieneAlternativa: true,
  riesgoSeguridad: false,
};

describe('triage automatico', () => {
  it('marca critica una incidencia con riesgo aunque el empleado no elija prioridad', () => {
    expect(calcularPrioridad({ ...base, descripcion: 'Sale humo y hay olor a quemado del equipo.' }, 'Impresora').prioridad).toBe('CRITICA');
  });

  it('marca alta cuando un sector queda detenido sin alternativa', () => {
    const resultado = calcularPrioridad({ ...base, impacto: 'SECTOR', servicioInterrumpido: true, tieneAlternativa: false }, 'Impresora');
    expect(resultado.prioridad).toBe('ALTA');
    expect(resultado.motivo).toContain('sector');
  });

  it('sugiere la categoria por el problema y el tipo de activo', () => {
    expect(sugerirCategoria('No imprime', 'Se atasca el papel', 'Impresora')).toBe('Impresión');
  });
});
