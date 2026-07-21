-- REVIEW-ONLY. Do not run this blindly.
--
-- Backfills exercises.category_id (added in 008_exercise_category_id.sql) for all
-- exercises.category = 'machine' rows, mapping each to its best-guess row in
-- equipment_categories (type='exercise'). Every mapping is name-similarity based,
-- not verified against a canonical taxonomy — scan the "left side -> right side"
-- comment above each UPDATE and delete/edit any pairing that's wrong before running.
--
-- Excluded on purpose, no category_id assigned to any of these:
--  - Smith Machine exercises (barbell-pattern on a fixed rail, not a true
--    selectorized/plate-loaded machine)
--  - Anything with "(Assisted)" in the name — assisted bodyweight movements
--    aren't being force-fit into an existing machine category
--  - "Calf Press On Leg Press" — too niche/generic a variant to bucket
--
-- equipment_categories (type='exercise') reference, for scanning against below:
--  13 Leg Press            18 Standing Calf Raise   23 Lateral Raise      28 T-Bar Row
--  14 Hack Squat           19 Seated Calf Raise     24 Shoulder Press     29 Bicep Curl
--  15 Leg Extension        20 Incline Chest Press    25 Upper Back Row    30 Tricep Pushdown
--  16 Lying Hamstring Curl 21 Chest Fly              26 Lat Pulldown      31 Tricep Extension
--  17 Seated Hamstring Curl 22 Chest Press           27 Lat Row           32 Glute Kickback
--                                                                          33 Hip Abduction
--                                                                          34 Hip Adduction
--                                                                          35 Ab Crunch
--                                                                          36 Hip Thrust (new)
--                                                                          37 Seated Dip (new)
--                                                                          38 Pendulum Squat (new)

-- ===================================================================
-- NEW CATEGORIES
-- ===================================================================

INSERT INTO equipment_categories (name, slug, type)
VALUES ('Hip Thrust', 'hip-thrust', 'exercise')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO equipment_categories (name, slug, type)
VALUES ('Seated Dip', 'seated-dip', 'exercise')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO equipment_categories (name, slug, type)
VALUES ('Pendulum Squat', 'pendulum-squat', 'exercise')
ON CONFLICT (slug) DO NOTHING;

-- "Hip Thrust (Machine)" -> "Hip Thrust"
UPDATE exercises
SET category_id = (SELECT id FROM equipment_categories WHERE slug = 'hip-thrust')
WHERE id = '4acbb3fa-c13c-4537-a769-ae7954f0639d';

-- "Triceps Press (Machine)" -> "Seated Dip"
UPDATE exercises
SET category_id = (SELECT id FROM equipment_categories WHERE slug = 'seated-dip')
WHERE id = 'da991513-5d9e-41f4-a447-fd61767fed93';

-- "Pendulum Squat" -> "Pendulum Squat"  [own category now, no longer folded into Hack Squat]
UPDATE exercises
SET category_id = (SELECT id FROM equipment_categories WHERE slug = 'pendulum-squat')
WHERE id = 'fba82ead-f09d-4c72-8a85-1aef9f84f7f4';

-- ===================================================================
-- HIGH CONFIDENCE — direct or near-direct name match
-- ===================================================================

-- "Abdominal Crunch (Machine)" -> "Ab Crunch" (35)
UPDATE exercises SET category_id = 35 WHERE id = '12c0988b-abbc-4e22-9e14-08d5c891f891';

-- "Chest Fly (Machine)" -> "Chest Fly" (21)
UPDATE exercises SET category_id = 21 WHERE id = 'ed5c3b4d-93e4-4558-a7d2-c0694b8f0120';

-- "Chest Press (Machine)" -> "Chest Press" (22)
UPDATE exercises SET category_id = 22 WHERE id = '8a971ca7-b004-4760-a20f-dcfec5bd0715';

-- "Glute Kickback (Machine)" -> "Glute Kickback" (32)
UPDATE exercises SET category_id = 32 WHERE id = '5b44649d-fbe2-4b08-89d2-49af2d436d4f';

-- "Hack Squat (Machine)" -> "Hack Squat" (14)
UPDATE exercises SET category_id = 14 WHERE id = '980d551e-f1ea-4cf1-831b-486a1920c19e';

-- "Hip Abductor (Machine)" -> "Hip Abduction" (33)
UPDATE exercises SET category_id = 33 WHERE id = 'ad0f7239-01ea-46d9-b96f-98f80dc5a5d4';

-- "Hip Adductor (Machine)" -> "Hip Adduction" (34)
UPDATE exercises SET category_id = 34 WHERE id = 'ae879462-bc6d-4201-b878-27c2f534efc9';

-- "Incline Chest Press (Machine)" -> "Incline Chest Press" (20)
UPDATE exercises SET category_id = 20 WHERE id = 'fe65e94a-7ee5-45c7-8b73-b8558df4c485';

-- "Lat Pulldown (Machine)" -> "Lat Pulldown" (26)
UPDATE exercises SET category_id = 26 WHERE id = 'b085aed2-5fe9-4924-aca2-9c58b301a61b';

-- "Lateral Raise (Machine)" -> "Lateral Raise" (23)
UPDATE exercises SET category_id = 23 WHERE id = 'd7894d24-6e5b-401d-9e57-055c7061937a';

-- "Leg Extension (Machine)" -> "Leg Extension" (15)
UPDATE exercises SET category_id = 15 WHERE id = 'dd5590bb-7d40-4d5e-8eec-8139927a4cf5';

-- "Leg Press (Machine)" -> "Leg Press" (13)
UPDATE exercises SET category_id = 13 WHERE id = '6c56fdfc-5193-4ddf-b5cb-3bfeb61db8d1';

-- "Lying Leg Curl (Machine)" -> "Lying Hamstring Curl" (16)
UPDATE exercises SET category_id = 16 WHERE id = '2e2fcacd-6250-4e58-a45f-66c69bf2f0b3';

-- "Preacher Curl (Machine)" -> "Bicep Curl" (29)
UPDATE exercises SET category_id = 29 WHERE id = 'f2659e26-4bbe-416f-a39d-383fdb13db85';

-- "Seated Calf Raise (Machine)" -> "Seated Calf Raise" (19)
UPDATE exercises SET category_id = 19 WHERE id = '15a6b6b9-2c83-4e09-b7a0-f11935ab009f';

-- "Seated Leg Curl (Machine)" -> "Seated Hamstring Curl" (17)
UPDATE exercises SET category_id = 17 WHERE id = 'bdd76761-ba4e-4c57-a445-bf5bf6df88e1';

-- "Seated Leg Press" -> "Leg Press" (13)
UPDATE exercises SET category_id = 13 WHERE id = 'a6c5e3d1-0b99-4089-be0c-69d42d3357a7';

-- "Shoulder Press (Machine)" -> "Shoulder Press" (24)
UPDATE exercises SET category_id = 24 WHERE id = 'eed957c5-acfd-4fdb-b8b9-7158bf0c3192';

-- "Standing Calf Raise (Machine)" -> "Standing Calf Raise" (18)
UPDATE exercises SET category_id = 18 WHERE id = 'f0a1eef7-00a6-47da-b83e-e0d404935fee';

-- "T Bar Row" -> "T-Bar Row" (28)
UPDATE exercises SET category_id = 28 WHERE id = '0cdddcc6-013f-47af-8127-5888e65b3620';

-- "T Bar Row - Chest Supported" -> "T-Bar Row" (28)
UPDATE exercises SET category_id = 28 WHERE id = '54bf08c6-c58e-450c-8f20-76229b74a423';

-- ===================================================================
-- MEDIUM CONFIDENCE — functional equivalent, no exact name match.
-- ===================================================================

-- "Arm Curl (Machine)" -> "Bicep Curl" (29)
UPDATE exercises SET category_id = 29 WHERE id = '622e9ffd-2e66-46ab-b9d1-a891d51dce9f';

-- "Calf Raise (Machine)" -> "Standing Calf Raise" (18)  [generic name, no stance specified; alt: 19 Seated Calf Raise]
UPDATE exercises SET category_id = 18 WHERE id = '0a872a4d-2d35-4290-8f84-304276e08622';

-- "Decline Chest Press (Machine)" -> "Chest Press" (22)  [no separate "Decline Chest Press" category exists]
UPDATE exercises SET category_id = 22 WHERE id = '7fca726b-7389-49a8-8b9d-13de5c28a340';

-- "Pec Deck (Machine)" -> "Chest Fly" (21)  [pec deck is the common name for a chest fly machine]
UPDATE exercises SET category_id = 21 WHERE id = 'b16f90db-8b32-4d81-bedb-457f5db61d6b';

-- "Seated Row (Machine)" -> "Lat Row" (27)  [alt: 25 Upper Back Row]
UPDATE exercises SET category_id = 27 WHERE id = 'fc1da1aa-5a6c-4d3d-81cc-78a9c000dd4e';

-- ===================================================================
-- NO MATCH FOUND — left as comments only, no UPDATE statement.
-- ===================================================================

-- "Back Extension (Machine)"     id d14ac09e-856b-434a-818b-b8d0e77f65a8
-- "Lat pullover"                 id 6ed5c7cd-0dca-4151-aef6-1d1851b70dc6
-- "Pullover (Machine)"           id aaef03cf-015e-47ac-913b-e57d97cba5ce
-- "Reverse Fly (Machine)"        id 8809b502-8c38-4ea8-a3d1-2e9806be9fc2
-- "Shrug (Machine)"              id ff721b5e-c563-46cb-a3c5-3a158cb402e6
-- "Calf Press On Leg Press"      id 858c48c1-ad5b-4748-a4fb-e04e52bbaf62

-- ===================================================================
-- EXCLUDED ON PURPOSE — Smith Machine exercises
-- ===================================================================

-- "Incline Bench Press (Smith Machine)"  id 09fb44bd-ee93-47c1-8b5e-ab213ac90d51
-- "Bench Press (Smith Machine)"          id d466abe9-35a7-4bc5-8ec5-88d158868ca4
-- "JM Press (Smith Machine)"             id 0135f3dd-53fe-4a4f-ae74-6e6e9439d100

-- ===================================================================
-- EXCLUDED ON PURPOSE — Assisted exercises
-- ===================================================================

-- "Chin Up (Assisted)"           id 5fab02ff-4d7a-49c8-9402-3639acc27f79
-- "Pull Up (Assisted)"           id 7d0a136e-8685-4c82-bf1a-bd60cbe87a77
-- "Chest Dip (Assisted)"         id 5d84572d-095c-4211-859e-77c3c0340aa1
-- "Tricep Dip (Assisted)"        id 96b3dc92-4ce3-45a8-aaf7-e29d4b109568
