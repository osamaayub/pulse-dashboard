/** Quotes every cell and neutralises formulas (=, +, -, @), so the file is safe to open in Excel or Sheets. */
export function csvCell(v: string | number) {
  const s = String(v);
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
}

export const csvRow = (cells: (string | number)[]) => cells.map(csvCell).join(",");
