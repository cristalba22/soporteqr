export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): HttpError {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'No autenticado'): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = 'No autorizado'): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = 'Recurso no encontrado'): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message: string): HttpError {
    return new HttpError(409, message);
  }
}
