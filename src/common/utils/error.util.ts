export function getErrorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  // Handle objects with message property
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    const message = errorObj.message || errorObj.err?.message || errorObj.error?.message || JSON.stringify(error);
    const stack = errorObj.stack || errorObj.err?.stack || errorObj.error?.stack;
    return {
      message,
      stack,
    };
  }

  // Handle primitives
  return {
    message: String(error),
    stack: undefined,
  };
}
