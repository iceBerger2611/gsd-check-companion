export class AppError extends Error {
  code: string;
  cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.cause = cause;
  }
}

export class PersistenceError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PERSISTENCE_ERROR', cause);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'NOT_FOUND', cause);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CONFLICT', cause);
  }
}

export function mapDbError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('unique constraint')) {
      return new ConflictError(fallbackMessage, error);
    }

    if (
      msg.includes('foreign key') ||
      msg.includes('not null') ||
      msg.includes('constraint')
    ) {
      return new PersistenceError(fallbackMessage, error);
    }

    return new PersistenceError(fallbackMessage, error);
  }

  return new PersistenceError(fallbackMessage, error);
}