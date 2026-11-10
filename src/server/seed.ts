/** Deterministic demo data: the same "random" store every time, with dates relative to today. */
const FIRST = ["Ava", "Liam", "Sara", "Omar", "Mia", "Noah", "Zara", "Ethan", "Aisha", "Lucas", "Hana", "Leo", "Fatima", "Ivan", "Chloe", "Yusuf", "Nina", "Adam", "Emma", "Ali"];
const LAST = ["Khan", "Smith", "Garcia", "Chen", "Ahmed", "Novak", "Silva", "Brown", "Rossi", "Kim", "Malik", "Dubois", "Haddad", "Taylor", "Sato"];
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Germany", "Pakistan", "UAE", "Australia", "Netherlands"];
export const CATALOG: [string, string, number][] = [
  ["Aero Running Shoes", "Footwear", 12900], ["Trail Hiker Boots", "Footwear", 15900], ["Everyday Sneakers", "Footwear", 8900],
  ["Merino Crew Sweater", "Apparel", 9400], ["Rain Shell Jacket", "Apparel", 17900], ["Organic Cotton Tee", "Apparel", 2900],
  ["Commuter Backpack", "Bags", 11900], ["Weekender Duffel", "Bags", 13900], ["Sling Pouch", "Bags", 4500],
  ["Smart Water Bottle", "Accessories", 3900], ["Wool Beanie", "Accessories", 2400], ["Polarized Sunglasses", "Accessories", 7900],
  ["Noise-Cancel Earbuds", "Tech", 14900], ["Fitness Band", "Tech", 9900], ["Power Bank 20k", "Tech", 5900],
];

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeedData = ReturnType<typeof buildSeed>;

export function buildSeed(now = Date.now(), seed = 42) {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const DAY = 86_400_000;
  const customers = Array.from({ length: 420 }, (_, i) => {
    const first = pick(FIRST), last = pick(LAST);
    return { id: i + 1, name: `${first} ${last}`, email: `${first}.${last}${i}@example.com`.toLowerCase(), country: pick(COUNTRIES), createdAt: new Date(now - Math.floor(r() * 790) * DAY), isActive: true };
  });
  const products = CATALOG.map(([name, category, priceCents], i) => ({ id: i + 1, name, category, priceCents, stockQuantity: 3 + ((i * 37) % 70), isActive: true }));
  const orders: { id: number; customerId: number; status: "pending" | "paid" | "shipped" | "refunded"; totalCents: number; createdAt: Date }[] = [];
  const items: { orderId: number; productId: number; quantity: number; unitCents: number }[] = [];
  let id = 0;
  const DAYS = 760; // two years, so every range has a full previous period to compare with
  for (let d = DAYS; d >= 0; d--) {
    // Gentle growth over the year, busier weekends, a November peak.
    const date = new Date(now - d * DAY);
    const growth = 1 + (0.6 * (DAYS - d)) / DAYS;
    const weekend = [0, 6].includes(date.getDay()) ? 1.35 : 1;
    const peak = date.getMonth() === 10 ? 1.4 : 1;
    const n = Math.round((2 + r() * 3) * growth * weekend * peak);
    for (let k = 0; k < n; k++) {
      id++;
      const c = pick(customers.filter((x) => x.createdAt <= date)) ?? customers[0];
      const lines = 1 + Math.floor(r() * 3);
      let total = 0;
      for (let j = 0; j < lines; j++) {
        const p = pick(products), q = 1 + Math.floor(r() * 2);
        items.push({ orderId: id, productId: p.id, quantity: q, unitCents: p.priceCents });
        total += p.priceCents * q;
      }
      const age = d + r();
      const roll = r();
      const status = roll < 0.04 ? "refunded" : age < 1.2 ? (roll < 0.5 ? "pending" : "paid") : age < 4 ? (roll < 0.55 ? "paid" : "shipped") : "shipped";
      orders.push({ id, customerId: c.id, status, totalCents: total, createdAt: new Date(date.getTime() + Math.floor(r() * DAY * 0.9) - DAY * 0.45) });
    }
  }
  return { customers, products, orders, items };
}
