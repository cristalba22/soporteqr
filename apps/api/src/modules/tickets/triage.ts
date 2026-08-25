import type { CreateTicketInput, TicketPriority } from '@soporteqr/shared';

export const TRIAGE_VERSION = 'rules-v1';

const RIESGO_PATTERN = /humo|chispa|quemad|cortocircuit|descarga electric|electrocuci|ransomware|datos expuestos|fuga de datos|incendio/i;
const ACTIVO_CRITICO_PATTERN = /servidor|router|switch|firewall|ups|respirador|desfibrilador|monitor multiparametrico/i;

export interface TriageResult {
  prioridad: TicketPriority;
  motivo: string;
  version: string;
}

export function calcularPrioridad(input: CreateTicketInput, assetType: string): TriageResult {
  const texto = `${input.titulo} ${input.descripcion}`;
  const riesgoDetectado = input.riesgoSeguridad || RIESGO_PATTERN.test(texto);
  const activoCritico = ACTIVO_CRITICO_PATTERN.test(assetType);

  if (riesgoDetectado) {
    return { prioridad: 'CRITICA', motivo: 'Riesgo de seguridad, electrico o de perdida de informacion detectado.', version: TRIAGE_VERSION };
  }
  if (input.impacto === 'ORGANIZACION' && input.servicioInterrumpido && !input.tieneAlternativa) {
    return { prioridad: 'CRITICA', motivo: 'Toda la organizacion esta detenida y no dispone de alternativa.', version: TRIAGE_VERSION };
  }
  if ((input.impacto === 'SECTOR' && input.servicioInterrumpido && !input.tieneAlternativa)
    || (activoCritico && input.servicioInterrumpido && !input.tieneAlternativa)) {
    return { prioridad: 'ALTA', motivo: activoCritico ? 'Activo critico detenido sin alternativa.' : 'Un sector esta detenido y no dispone de alternativa.', version: TRIAGE_VERSION };
  }
  if (input.servicioInterrumpido && !input.tieneAlternativa) {
    return { prioridad: 'MEDIA', motivo: 'El trabajo esta detenido sin alternativa, con impacto individual.', version: TRIAGE_VERSION };
  }
  if (input.impacto !== 'PERSONA' || input.servicioInterrumpido) {
    return { prioridad: 'MEDIA', motivo: 'La incidencia afecta la operacion, pero existe continuidad parcial o alternativa.', version: TRIAGE_VERSION };
  }
  return { prioridad: 'BAJA', motivo: 'Impacto individual sin interrupcion total del trabajo.', version: TRIAGE_VERSION };
}

const CATEGORY_RULES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Red', pattern: /internet|wifi|wi-fi|red|router|switch|conexion|conectividad/i },
  { name: 'Impresión', pattern: /impres|imprimir|papel|scanner|escaner|toner|tinta/i },
  { name: 'Software', pattern: /sistema|aplicacion|programa|contrasena|sesion|actualiz|software/i },
  { name: 'Hardware', pattern: /enciende|pantalla|monitor|teclado|bateria|cargador|disco|ruido|temperatura|hardware/i },
];

export function sugerirCategoria(titulo: string, descripcion: string, assetType: string): string | undefined {
  const texto = `${titulo} ${descripcion} ${assetType}`;
  return CATEGORY_RULES.find((rule) => rule.pattern.test(texto))?.name;
}
