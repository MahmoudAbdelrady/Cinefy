import type { UserPosition } from './types';

const ROUTE_ACCESS: Record<string, readonly UserPosition[]> = {
  '/': ['ADMIN', 'MANAGER', 'CASHIER', 'USHER'],
  '/halls': ['ADMIN', 'MANAGER'],
  '/movies': ['ADMIN', 'MANAGER', 'CASHIER'],
  '/statistics': ['ADMIN', 'MANAGER'],
  '/payment': ['ADMIN', 'MANAGER'],
  '/payment-old': ['ADMIN', 'MANAGER'],
  '/staff': ['ADMIN', 'MANAGER'],
};

const MANAGEMENT_POSITIONS: readonly UserPosition[] = ['ADMIN', 'MANAGER'];

const BOOKING_POSITIONS: readonly UserPosition[] = ['ADMIN', 'MANAGER', 'CASHIER'];

export function canAccessRoute(path: string, position: UserPosition): boolean {
  const allowed = ROUTE_ACCESS[path];
  return allowed?.includes(position) ?? true;
}

export function canManage(position: UserPosition): boolean {
  return MANAGEMENT_POSITIONS.includes(position);
}

export function canBook(position: UserPosition): boolean {
  return BOOKING_POSITIONS.includes(position);
}

export function canManageStaffMember(
  userPosition: UserPosition,
  targetPosition: UserPosition,
): boolean {
  if (!canManage(userPosition)) return false;
  if (targetPosition === 'MANAGER') return userPosition === 'ADMIN';
  return true;
}

export function assignableStaffPositions(userPosition: UserPosition): UserPosition[] {
  const all: UserPosition[] = ['MANAGER', 'CASHIER', 'USHER'];
  return userPosition === 'ADMIN' ? all : all.filter((position) => position !== 'MANAGER');
}
