import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "../src/features/orders/csv";

describe("CSV export", () => {
  it("quotes cells and escapes quotes", () => {
    expect(csvRow(["Ava", 'Say "hi"', 42])).toBe('"Ava","Say ""hi""","42"');
  });
  it("stops spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell("-1+2")).toBe('"\'-1+2"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
  });
});
