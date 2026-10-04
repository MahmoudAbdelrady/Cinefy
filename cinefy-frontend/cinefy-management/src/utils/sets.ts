export function toggleInSet<T>(set: ReadonlySet<T>, value: T, include = !set.has(value)): Set<T> {
  const next = new Set(set);
  if (include) {
    next.add(value);
  } else {
    next.delete(value);
  }
  return next;
}

export function setsEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
