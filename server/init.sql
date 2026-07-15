CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key TEXT NOT NULL PRIMARY KEY,
    status          TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
    record          JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);