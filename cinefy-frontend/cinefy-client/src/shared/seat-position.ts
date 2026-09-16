const POSITION_PATTERN = /^([A-Z]+)(\d+)$/;

export function rowLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  const repeat = Math.floor(index / 26) + 1;
  return letter.repeat(repeat);
}

function rowLabelToIndex(label: string): number {
  const repeat = label.length;
  const letterCode = label.charCodeAt(0) - 65;
  return (repeat - 1) * 26 + letterCode;
}

export function comparePositions(a: string, b: string): number {
  const [, aRow, aCol] = a.match(POSITION_PATTERN) ?? [];
  const [, bRow, bCol] = b.match(POSITION_PATTERN) ?? [];
  const rowDiff = rowLabelToIndex(aRow) - rowLabelToIndex(bRow);
  return rowDiff !== 0 ? rowDiff : Number(aCol) - Number(bCol);
}
