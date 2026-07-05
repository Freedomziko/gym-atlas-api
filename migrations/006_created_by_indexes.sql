CREATE INDEX IF NOT EXISTS gyms_created_by_idx ON gyms (created_by);
CREATE INDEX IF NOT EXISTS equipment_created_by_idx ON equipment (created_by);
CREATE INDEX IF NOT EXISTS equipment_photo_uploaded_by_idx ON equipment (photo_uploaded_by);
CREATE INDEX IF NOT EXISTS gym_equipment_created_by_idx ON gym_equipment (created_by);
