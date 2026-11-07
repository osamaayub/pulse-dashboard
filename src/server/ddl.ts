/** The tables, as SQL. Used by `npm run db:setup` for a real Postgres, and by the built-in demo database. */
export const DDL = `
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending','paid','shipped','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS customers (id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, country text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS products (id serial PRIMARY KEY, name text NOT NULL, category text NOT NULL, price_cents integer NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id serial PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(id), status order_status NOT NULL, total_cents integer NOT NULL, created_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE TABLE IF NOT EXISTS order_items (id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id integer NOT NULL REFERENCES products(id), quantity integer NOT NULL, unit_cents integer NOT NULL);
`;

export const RESET = `DROP TABLE IF EXISTS order_items, orders, products, customers; DROP TYPE IF EXISTS order_status;`;
