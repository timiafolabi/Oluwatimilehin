export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toAppError(error: unknown, fallbackCode: string, context?: Record<string, unknown>): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, fallbackCode, context);
  return new AppError("Unexpected error", fallbackCode, { ...context, raw: String(error) });
}
