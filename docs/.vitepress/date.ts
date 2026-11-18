/** gray-matter 会把不加引号的 `2026-11-18` 解析成 Date，这里统一成 YYYY-MM-DD */
export function toISODate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').slice(0, 10);
}
