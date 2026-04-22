export interface ServerConfig {
  port: number;
  corsOrigin: string;
}

export function getServerConfig(): ServerConfig {
  return {
    port: parsePort(process.env.SOCKET_SERVER_PORT, 3001),
    corsOrigin: process.env.SOCKET_SERVER_CORS_ORIGIN ?? "http://localhost:3000",
  };
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
