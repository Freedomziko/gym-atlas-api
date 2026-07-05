-- 004_import_idempotency.sql
-- Adds unique constraints on app.workout_sessions and app.set_logs
-- to make the Strong CSV import idempotent (re-running produces zero new rows).
-- Safe on non-empty tables: deduplicates first, keeping the earliest row per group.

-- ── workout_sessions dedup ────────────────────────────────────────────────────
-- Delete set_logs that belong to duplicate sessions BEFORE removing those sessions
-- (respects any FK constraint from set_logs.session_id → workout_sessions.id).
DELETE FROM app.set_logs
WHERE session_id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, started_at
             ORDER BY created_at ASC NULLS LAST, id ASC
           ) AS rn
    FROM app.workout_sessions
  ) ranked
  WHERE rn > 1
);

-- Now delete the duplicate sessions themselves (keep the earliest per user+started_at).
DELETE FROM app.workout_sessions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, started_at
             ORDER BY created_at ASC NULLS LAST, id ASC
           ) AS rn
    FROM app.workout_sessions
  ) ranked
  WHERE rn > 1
);

ALTER TABLE app.workout_sessions
  ADD CONSTRAINT workout_sessions_user_started_at_key
  UNIQUE (user_id, started_at);

-- ── set_logs dedup ────────────────────────────────────────────────────────────
-- Deduplicate remaining set_logs within the surviving sessions.
DELETE FROM app.set_logs
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY session_id, exercise_name, set_number
             ORDER BY created_at ASC NULLS LAST, id ASC
           ) AS rn
    FROM app.set_logs
  ) ranked
  WHERE rn > 1
);

ALTER TABLE app.set_logs
  ADD CONSTRAINT set_logs_session_exercise_set_key
  UNIQUE (session_id, exercise_name, set_number);
