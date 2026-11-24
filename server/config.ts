export interface ServerConfig {
  port: number;
  host?: string;
  corsOrigin: string;
}

export function getServerConfig(): ServerConfig {
  return {
    port: parsePort(process.env.PORT ?? process.env.SOCKET_SERVER_PORT, 3001),
    host: process.env.SOCKET_SERVER_HOST,
    corsOrigin: process.env.SOCKET_SERVER_CORS_ORIGIN ?? "http://localhost:3000",
  };
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
