import type { Request } from 'express';
import { env } from '../config/env.js';

const lastAlertBySignature = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000;

export async function notifyUnhandledError(error: unknown, req: Request): Promise<void> {
  if (!env.ERROR_ALERT_WEBHOOK_URL) return;
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const signature = `${errorName}:${req.method}:${req.route?.path ?? req.path}`;
  const now = Date.now();
  const lastAlert = lastAlertBySignature.get(signature) ?? 0;
  if (now - lastAlert < DEDUPLICATION_WINDOW_MS) return;
  lastAlertBySignature.set(signature, now);

  const message = [
    'SoporteQR detecto un error no controlado.',
    `Entorno: ${env.NODE_ENV}`,
    `Ruta: ${req.method} ${req.path}`,
    `Tipo: ${errorName}`,
    `Fecha: ${new Date(now).toISOString()}`,
  ].join('\n');

  try {
    await fetch(env.ERROR_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: message, content: message }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (alertError) {
    console.error('No se pudo enviar la alerta de error:', alertError);
  }
}
