import 'dotenv/config';
import { z } from 'zod';

const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET debe tener al menos 16 caracteres'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET debe tener al menos 16 caracteres'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    REFRESH_COOKIE_NAME: z.string().default('soporteqr_refresh'),
    CORS_ORIGIN: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
    APP_BASE_URL: z.string().default('http://localhost:5173'),
    UPLOAD_DIR: z.string().default('uploads'),
    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
    R2_ACCOUNT_ID: optionalSecret,
    R2_ACCESS_KEY_ID: optionalSecret,
    R2_SECRET_ACCESS_KEY: optionalSecret,
    R2_ATTACHMENTS_BUCKET: z.string().default('soporteqr-attachments'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().default(300),
    ERROR_ALERT_WEBHOOK_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().url().optional(),
    ),
  })
  .superRefine((value, context) => {
    if (value.STORAGE_DRIVER !== 'r2') return;
    for (const key of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'] as const) {
      if (!value[key])
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} es obligatorio con STORAGE_DRIVER=r2`,
        });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno invalidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuracion de entorno invalida. Revisa .env contra .env.example');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
