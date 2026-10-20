/**
 * Whether a row can move up or down. Rows only move among siblings with the
 * same pin status, because pinned rows always stay first.
 */
export function moveBounds<T extends { id: string; is_pinned: boolean }>(siblings: T[], row: T) {
  const group = siblings.filter((s) => s.is_pinned === row.is_pinned);
  const i = group.findIndex((s) => s.id === row.id);
  return { canMoveUp: i > 0, canMoveDown: i >= 0 && i < group.length - 1 };
}
