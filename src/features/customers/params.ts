import { z } from "zod";

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const CUSTOMER_SORTS = ["ltv", "orders", "recent", "name"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

/** ?q=&sort=&dir=&page= for the customers list. Bad values fall back to defaults instead of throwing. */
export const customersQuerySchema = z.object({
  q: z.preprocess(one, z.string().trim().max(60).catch("")).default(""),
  sort: z.preprocess(one, z.enum(CUSTOMER_SORTS).catch("ltv")).default("ltv"),
  dir: z.preprocess(one, z.enum(["asc", "desc"]).catch("desc")).default("desc"),
  page: z.preprocess(one, z.coerce.number().int().min(1).max(500).catch(1)).default(1),
});
export type CustomersQuery = z.infer<typeof customersQuerySchema>;
