-- When the sample data was made, so the app can replace it with a fresh copy every day (DEMO_RESET_HOURS).
CREATE TABLE IF NOT EXISTS demo_meta (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), seeded_at timestamptz NOT NULL);
