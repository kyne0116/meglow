import { DEFAULT_JWT_SECRET } from '../auth/auth.constants';

const DEFAULT_PORT = 5002;
const MIN_PORT = 1;
const MAX_PORT = 65535;

export function getRuntimeJwtSecret() {
  const value = process.env.JWT_SECRET?.trim();
  return value || DEFAULT_JWT_SECRET;
}

export function getRuntimePort() {
  const value = process.env.PORT?.trim();
  const port = Number(value || `${DEFAULT_PORT}`);

  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    return DEFAULT_PORT;
  }

  return port;
}

export function getRuntimeDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  return value ? value : null;
}
