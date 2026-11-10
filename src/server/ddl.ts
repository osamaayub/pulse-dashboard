/** The tables, as SQL. Used by `npm run db:setup` for a real Postgres, and by the built-in demo database. */
export const DDL = `
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending','paid','shipped','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS customers (id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, country text NOT NULL, created_at timestamptz NOT NULL);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS products (id serial PRIMARY KEY, name text NOT NULL, category text NOT NULL, price_cents integer NOT NULL);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS audit_log (id serial PRIMARY KEY, actor_email text NOT NULL, action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL, summary text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at);
CREATE TABLE IF NOT EXISTS admin_users (email text PRIMARY KEY, invited_by_email text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), is_active boolean NOT NULL DEFAULT true);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
CREATE TABLE IF NOT EXISTS admin_invitations (id serial PRIMARY KEY, email text NOT NULL, token_hash text NOT NULL UNIQUE, invited_by_email text NOT NULL, expires_at timestamptz NOT NULL, accepted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS admin_invitations_email_idx ON admin_invitations(email, expires_at);
CREATE TABLE IF NOT EXISTS orders (id serial PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(id), status order_status NOT NULL, total_cents integer NOT NULL, created_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE TABLE IF NOT EXISTS order_items (id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id integer NOT NULL REFERENCES products(id), quantity integer NOT NULL, unit_cents integer NOT NULL);
CREATE TABLE IF NOT EXISTS demo_meta (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), seeded_at timestamptz NOT NULL);
`;

export const RESET = `DROP TABLE IF EXISTS admin_invitations, admin_users, audit_log, order_items, orders, products, customers, demo_meta; DROP TYPE IF EXISTS order_status;`;
