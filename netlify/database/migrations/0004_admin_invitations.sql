CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  invited_by_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS admin_invitations (
  id serial PRIMARY KEY,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  invited_by_email text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_invitations_email_idx ON admin_invitations(email, expires_at);
