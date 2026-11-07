import { describe, expect, it } from "vitest";
import { customersQuerySchema } from "../src/features/customers/params";
import { productsQuerySchema } from "../src/features/products/params";
import { idFromSearch, likePattern } from "../src/lib/search";

describe("customers query params", () => {
  it("uses safe defaults", () => {
    expect(customersQuerySchema.parse({})).toEqual({ q: "", sort: "ltv", dir: "desc", page: 1 });
  });
  it("falls back instead of throwing on bad input", () => {
    expect(customersQuerySchema.parse({ sort: "drop table", dir: "up", page: "-3" })).toEqual({ q: "", sort: "ltv", dir: "desc", page: 1 });
  });
  it("keeps valid values", () => {
    expect(customersQuerySchema.parse({ q: " khan ", sort: "recent", dir: "asc", page: "4" })).toEqual({ q: "khan", sort: "recent", dir: "asc", page: 4 });
  });
});

describe("products query params", () => {
  it("defaults to 30 days sorted by revenue", () => {
    expect(productsQuerySchema.parse({})).toEqual({ range: "30d", category: undefined, sort: "revenue" });
  });
  it("ignores an unknown range or sort", () => {
    expect(productsQuerySchema.parse({ range: "5y", sort: "price", category: "Bags" })).toEqual({ range: "30d", category: "Bags", sort: "revenue" });
  });
});

describe("search helpers", () => {
  it("escapes LIKE wildcards", () => {
    expect(likePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });
  it("reads #123 and 123 as ids, nothing else", () => {
    expect(idFromSearch("#123")).toBe(123);
    expect(idFromSearch("123")).toBe(123);
    expect(idFromSearch("khan")).toBeNull();
    expect(idFromSearch("12345678901")).toBeNull();
  });
});
