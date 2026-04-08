export function logInfo(message: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ level: "info", message, data, at: new Date().toISOString() }));
}

export function logError(message: string, data?: Record<string, unknown>): void {
  console.error(JSON.stringify({ level: "error", message, data, at: new Date().toISOString() }));
}
