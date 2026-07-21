-- Link exercises to the coarser equipment_categories taxonomy so filtering
-- (including Best in Class) can key off a real FK chain instead of name matching.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES equipment_categories(id);
