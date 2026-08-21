import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(400).json({ error: 'Datos invalidos', details: result.error.flatten() });
      return;
    }
    req[target] = result.data;
    next();
  };
}
