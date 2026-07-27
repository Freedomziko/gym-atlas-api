-- Exercise mapping review migration
-- Lets admins correct which exercise a machine maps to without the change going
-- live unreviewed. The proposal is staged in pending_exercise_id /
-- pending_secondary_exercise_id and left for super-admin confirmation, so the
-- live exercise_id is never overwritten without a second pair of eyes.
--
-- exercise_submitted_by doubles as the pending flag: NOT NULL means a proposal
-- is awaiting confirmation. No separate status column — it would only ever
-- restate what these columns already say.
-- Idempotent: safe to run more than once.

-- exercises.id is uuid, so the pending columns must match it — not integer.
ALTER TABLE public.equipment
    ADD COLUMN IF NOT EXISTS pending_exercise_id uuid,
    ADD COLUMN IF NOT EXISTS pending_secondary_exercise_id uuid,
    ADD COLUMN IF NOT EXISTS exercise_submitted_by uuid;
