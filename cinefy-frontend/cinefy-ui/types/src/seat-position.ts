const SEAT_POSITION_PATTERN = /^([A-Z]+)(\d+)$/;

function seatRowLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  const repeat = Math.floor(index / 26) + 1;
  return letter.repeat(repeat);
}

function seatRowIndex(label: string): number {
  const repeat = label.length;
  const letterCode = label.charCodeAt(0) - 65;
  return (repeat - 1) * 26 + letterCode;
}

function compareSeatPositions(a: string, b: string): number {
  const [, aRow, aCol] = a.match(SEAT_POSITION_PATTERN) ?? [];
  const [, bRow, bCol] = b.match(SEAT_POSITION_PATTERN) ?? [];
  const rowDiff = seatRowIndex(aRow) - seatRowIndex(bRow);
  return rowDiff !== 0 ? rowDiff : Number(aCol) - Number(bCol);
}

export { SEAT_POSITION_PATTERN, seatRowLabel, seatRowIndex, compareSeatPositions };
