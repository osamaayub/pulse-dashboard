import { z } from "zod";
import { rangeSchema } from "@/features/analytics/range";

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const PRODUCT_SORTS = ["revenue", "units", "growth", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** ?range=&category=&sort= for the products page. */
export const productsQuerySchema = z.object({
  range: rangeSchema,
  category: z.preprocess(one, z.string().trim().max(40).optional().catch(undefined)),
  sort: z.preprocess(one, z.enum(PRODUCT_SORTS).catch("revenue")).default("revenue"),
});
export type ProductsQuery = z.infer<typeof productsQuerySchema>;
