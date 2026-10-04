export function toggleInSet<T>(set: ReadonlySet<T>, value: T, include = !set.has(value)): Set<T> {
  const next = new Set(set);
  if (include) {
    next.add(value);
  } else {
    next.delete(value);
  }
  return next;
}
