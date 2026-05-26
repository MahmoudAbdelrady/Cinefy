import type { UserPosition } from './types';

const ROUTE_ACCESS: Record<string, readonly UserPosition[]> = {
  '/': ['ADMIN', 'MANAGER', 'CASHIER', 'USHER'],
  '/halls': ['ADMIN', 'MANAGER'],
  '/movies': ['ADMIN', 'MANAGER', 'CASHIER'],
  '/statistics': ['ADMIN', 'MANAGER'],
  '/payment': ['ADMIN', 'MANAGER'],
  '/staff': ['ADMIN', 'MANAGER'],
};

export function canAccessRoute(path: string, position: UserPosition): boolean {
  const allowed = ROUTE_ACCESS[path];
  return allowed?.includes(position) ?? true;
}
