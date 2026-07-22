const pool = require('../db');

const getAllUsers = async () => {
	const result = await pool.query(
		`SELECT id, email, username, role, created_at FROM profiles ORDER BY created_at DESC`
	);
	return result.rows;
};

const getPendingGyms = async () => {
	const result = await pool.query(
		`SELECT g.*, u.username AS submitted_by
         FROM gyms g
         LEFT JOIN profiles u ON u.id = g.created_by
         WHERE g.status = 'pending'
         ORDER BY g.created_at DESC`
	);
	return result.rows;
};

const getPendingEquipment = async () => {
	const result = await pool.query(
		`SELECT e.*, u.username AS submitted_by
         FROM equipment e
         LEFT JOIN profiles u ON u.id = e.created_by
         WHERE e.status = 'pending'
         ORDER BY e.created_at DESC`
	);
	return result.rows;
};

const getPendingSuggestions = async () => {
	const result = await pool.query(
		`SELECT ge.*,
                g.name AS gym_name,
                CONCAT(e.brand, ' ', e.name) AS equipment_name,
                e.image_url AS equipment_image_url,
                u.username AS submitted_by
         FROM gym_equipment ge
         JOIN gyms g ON g.id = ge.gym_id
         JOIN equipment e ON e.id = ge.equipment_id
         LEFT JOIN profiles u ON u.id = ge.created_by
         WHERE ge.status = 'pending'
         ORDER BY ge.created_at DESC`
	);
	return result.rows;
};

const getPendingPhotos = async () => {
	const result = await pool.query(
		`SELECT e.id, e.brand, e.series, e.name, e.image_url, e.pending_image_url, e.photo_uploaded_at,
                u.username AS submitted_by
         FROM equipment e
         LEFT JOIN profiles u ON u.id = e.photo_uploaded_by
         WHERE e.photo_status = 'pending' AND e.status = 'approved' AND e.pending_image_url IS NOT NULL
         ORDER BY e.photo_uploaded_at DESC`
	);
	return result.rows;
};

const getPendingGymPhotos = async () => {
	const result = await pool.query(
		`SELECT g.id, g.name, g.city, g.country, g.image_url, g.pending_image_url, g.photo_uploaded_at,
                u.username AS submitted_by
         FROM gyms g
         LEFT JOIN profiles u ON u.id = g.photo_uploaded_by
         WHERE g.photo_status = 'pending' AND g.status = 'approved' AND g.pending_image_url IS NOT NULL
         ORDER BY g.photo_uploaded_at DESC`
	);
	return result.rows;
};

const getPendingVariants = async () => {
	const result = await pool.query(
		`SELECT v.*,
                CONCAT(e.brand, ' ', e.name) AS equipment_name,
                e.image_url AS equipment_image_url,
                u.username AS submitted_by
         FROM equipment_variants v
         JOIN equipment e ON e.id = v.equipment_id
         LEFT JOIN profiles u ON u.id = v.created_by
         WHERE v.status = 'pending'
         ORDER BY v.created_at DESC`
	);
	return result.rows;
};

const getPendingWeightStacks = async () => {
	const result = await pool.query(
		`SELECT e.id, e.brand, e.series, e.name, e.image_url,
                e.weight_stack, e.pending_weight_stack,
                u.username AS submitted_by
         FROM equipment e
         LEFT JOIN profiles u ON u.id = e.weight_stack_submitted_by
         WHERE e.weight_stack_status = 'pending'
         ORDER BY e.id DESC`
	);
	return result.rows;
};

const getPendingGymInstagrams = async () => {
	const result = await pool.query(
		`SELECT g.id, g.name, g.city, g.country, g.image_url,
                g.instagram, g.pending_instagram,
                u.username AS submitted_by
         FROM gyms g
         LEFT JOIN profiles u ON u.id = g.instagram_submitted_by
         WHERE g.instagram_status = 'pending'
         ORDER BY g.id DESC`
	);
	return result.rows;
};

const approveGym = async (id) => {
	const result = await pool.query(
		`UPDATE gyms SET status = 'approved' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectGym = async (id) => {
	const result = await pool.query(
		`UPDATE gyms SET status = 'rejected' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approveSuggestion = async (id) => {
	const result = await pool.query(
		`UPDATE gym_equipment SET status = 'approved' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectSuggestion = async (id) => {
	const result = await pool.query(
		`UPDATE gym_equipment SET status = 'rejected' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approveEquipment = async (id) => {
	const result = await pool.query(
		`UPDATE equipment SET status = 'approved' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectEquipment = async (id) => {
	const result = await pool.query(
		`UPDATE equipment SET status = 'rejected' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approvePhoto = async (id) => {
	const result = await pool.query(
		`UPDATE equipment
         SET image_url = COALESCE(pending_image_url, image_url), pending_image_url = NULL, photo_status = 'approved'
         WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectPhoto = async (id) => {
	// Keep the live image_url; only drop the staged replacement and mark it rejected.
	const result = await pool.query(
		`UPDATE equipment
         SET pending_image_url = NULL, photo_status = 'rejected'
         WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approveGymPhoto = async (id) => {
	const result = await pool.query(
		`UPDATE gyms
         SET image_url = COALESCE(pending_image_url, image_url), pending_image_url = NULL, photo_status = 'approved'
         WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectGymPhoto = async (id) => {
	// Keep the live image_url; only drop the staged replacement and mark it rejected.
	const result = await pool.query(
		`UPDATE gyms
         SET pending_image_url = NULL, photo_status = 'rejected'
         WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approveVariant = async (id) => {
	const result = await pool.query(
		`UPDATE equipment_variants SET status = 'approved' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectVariant = async (id) => {
	const result = await pool.query(
		`UPDATE equipment_variants SET status = 'rejected' WHERE id = $1 RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approveWeightStack = async (id) => {
	const result = await pool.query(
		`UPDATE equipment
         SET weight_stack = pending_weight_stack, pending_weight_stack = NULL, weight_stack_status = 'approved'
         WHERE id = $1 AND weight_stack_status = 'pending'
         RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectWeightStack = async (id) => {
	const result = await pool.query(
		`UPDATE equipment
         SET pending_weight_stack = NULL, weight_stack_status = 'rejected'
         WHERE id = $1 AND weight_stack_status = 'pending'
         RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const approveGymInstagram = async (id) => {
	const result = await pool.query(
		`UPDATE gyms
         SET instagram = pending_instagram, pending_instagram = NULL, instagram_status = 'approved'
         WHERE id = $1 AND instagram_status = 'pending'
         RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const rejectGymInstagram = async (id) => {
	const result = await pool.query(
		`UPDATE gyms
         SET pending_instagram = NULL, instagram_status = 'rejected'
         WHERE id = $1 AND instagram_status = 'pending'
         RETURNING *`,
		[id]
	);
	return result.rows[0] || null;
};

const promoteToAdmin = async (userId) => {
	// Guard on role = 'user' so this can never silently downgrade a super_admin to admin.
	const result = await pool.query(
		`UPDATE profiles SET role = 'admin' WHERE id = $1 AND role = 'user' RETURNING id, email, username, role`,
		[userId]
	);
	return result.rows[0] || null;
};

const promoteToSuperAdmin = async (userId) => {
	const result = await pool.query(
		`UPDATE profiles SET role = 'super_admin' WHERE id = $1 AND role = 'admin' RETURNING id, email, username, role`,
		[userId]
	);
	return result.rows[0] || null;
};

const getUserRole = async (userId) => {
	const result = await pool.query(`SELECT id, role FROM profiles WHERE id = $1`, [userId]);
	return result.rows[0] || null;
};

const updateUserRole = async (userId, newRole) => {
	const result = await pool.query(
		`UPDATE profiles SET role = $2 WHERE id = $1 RETURNING id, email, username, role`,
		[userId, newRole]
	);
	return result.rows[0] || null;
};

module.exports = {
	getAllUsers,
	getPendingGyms,
	getPendingEquipment,
	getPendingSuggestions,
	getPendingPhotos,
	getPendingGymPhotos,
	getPendingVariants,
	getPendingWeightStacks,
	getPendingGymInstagrams,
	approveGym,
	rejectGym,
	approveSuggestion,
	rejectSuggestion,
	approveEquipment,
	rejectEquipment,
	approvePhoto,
	rejectPhoto,
	approveGymPhoto,
	rejectGymPhoto,
	approveVariant,
	rejectVariant,
	approveWeightStack,
	rejectWeightStack,
	approveGymInstagram,
	rejectGymInstagram,
	promoteToAdmin,
	promoteToSuperAdmin,
	getUserRole,
	updateUserRole
};
