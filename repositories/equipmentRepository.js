const pool = require('../db');
const { uploadToCloudinary } = require('../config/cloudinary');

const buildSlug = (brand, series, name) =>
	`${brand}-${series || ''}-${name}`
		.toLowerCase()
		.replace(/[\/\\]/g, '-')
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

// CREATE new equipment (catalog)
const createEquipment = async (
	brand,
	series,
	name,
	type,
	createdBy = null,
	brandId = null,
	exerciseId = null,
	secondaryExerciseId = null
) => {
	const slug = buildSlug(brand, series, name);

	const result = await pool.query(
		`INSERT INTO equipment (brand, brand_id, series, name, type, slug, status, created_by, exercise_id, secondary_exercise_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9) RETURNING *`,
		[brand, brandId, series, name, type, slug, createdBy, exerciseId, secondaryExerciseId]
	);
	return result.rows[0];
};

// Keep open for admin preview (no status filter)
const getEquipmentById = async (id, userId = null) => {
	const result = await pool.query(
		`
		SELECT
			e.id, e.brand, e.series, e.name, e.slug, e.type, e.weight_stack, e.created_at, e.image_url, e.status,
			COALESCE(ROUND(AVG(er.rating), 1), 0) AS avg_rating,
			MAX(CASE WHEN er.user_id = $2 THEN er.rating END) AS user_rating,
			COALESCE(BOOL_OR(ef.user_id = $2), false) AS is_favorite,
			CASE WHEN ex1.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', ex1.id, 'name', ex1.name, 'category_id', ec1.id, 'category_name', ec1.name) END AS exercise,
			CASE WHEN ex2.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', ex2.id, 'name', ex2.name, 'category_id', ec2.id, 'category_name', ec2.name) END AS secondary_exercise,
			COALESCE((
				SELECT JSON_AGG(
					JSON_BUILD_OBJECT(
						'id', ev.id,
						'label', ev.label,
						'variation_type', ev.variation_type,
						'is_default', ev.is_default
					) ORDER BY ev.is_default DESC, ev.label ASC
				)
				FROM equipment_variants ev
				WHERE ev.equipment_id = e.id AND ev.status = 'approved'
			), '[]') AS variants
		FROM equipment e
		LEFT JOIN equipment_ratings er ON er.equipment_id = e.id
		LEFT JOIN equipment_favourites ef ON ef.equipment_id = e.id
		LEFT JOIN exercises ex1 ON ex1.id = e.exercise_id
		LEFT JOIN exercises ex2 ON ex2.id = e.secondary_exercise_id
		LEFT JOIN equipment_categories ec1 ON ec1.id = ex1.category_id
		LEFT JOIN equipment_categories ec2 ON ec2.id = ex2.category_id
		WHERE e.id = $1
		GROUP BY e.id, e.brand, e.series, e.name, e.slug, e.type, e.weight_stack, e.created_at, e.image_url, e.status, ex1.id, ex1.name, ex2.id, ex2.name, ec1.id, ec1.name, ec2.id, ec2.name
		`,
		[id, userId]
	);
	return result.rows[0] || null;
};

const getAllEquipment = async (userId = null) => {
	const result = await pool.query(
		`
		SELECT
			e.id, e.brand, e.series, e.name, e.slug, e.type, e.weight_stack, e.created_at, e.image_url, e.status,
			COALESCE(ROUND(AVG(er.rating), 1), 0) AS avg_rating,
			MAX(CASE WHEN er.user_id = $1 THEN er.rating END) AS user_rating,
			COALESCE(BOOL_OR(ef.user_id = $1), false) AS is_favorite,
			CASE WHEN ex1.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', ex1.id, 'name', ex1.name, 'category_id', ec1.id, 'category_name', ec1.name) END AS exercise,
			CASE WHEN ex2.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', ex2.id, 'name', ex2.name, 'category_id', ec2.id, 'category_name', ec2.name) END AS secondary_exercise,
			COALESCE((
				SELECT JSON_AGG(
					JSON_BUILD_OBJECT(
						'id', ev.id,
						'label', ev.label,
						'variation_type', ev.variation_type,
						'is_default', ev.is_default
					) ORDER BY ev.is_default DESC, ev.label ASC
				)
				FROM equipment_variants ev
				WHERE ev.equipment_id = e.id AND ev.status = 'approved'
			), '[]') AS variants
		FROM equipment e
		LEFT JOIN equipment_ratings er ON er.equipment_id = e.id
		LEFT JOIN equipment_favourites ef ON ef.equipment_id = e.id
		LEFT JOIN exercises ex1 ON ex1.id = e.exercise_id
		LEFT JOIN exercises ex2 ON ex2.id = e.secondary_exercise_id
		LEFT JOIN equipment_categories ec1 ON ec1.id = ex1.category_id
		LEFT JOIN equipment_categories ec2 ON ec2.id = ex2.category_id
		WHERE e.status = 'approved'
		GROUP BY e.id, e.brand, e.series, e.name, e.slug, e.type, e.weight_stack, e.created_at, e.image_url, e.status, ex1.id, ex1.name, ex2.id, ex2.name, ec1.id, ec1.name, ec2.id, ec2.name
		ORDER BY e.brand, e.name
		`,
		[userId]
	);
	return result.rows;
};

const getGymsByEquipmentSlug = async (slug) => {
	const result = await pool.query(
		`
		SELECT 
			g.id,
			g.name,
			g.city,
			g.country,
			ge.quantity
		FROM gym_equipment ge
		JOIN gyms g ON g.id = ge.gym_id
		JOIN equipment e ON e.id = ge.equipment_id
		WHERE e.slug = $1
		AND g.status = 'approved'
		AND ge.status = 'approved'
		ORDER BY ge.quantity DESC
		`,
		[slug]
	);
	return result.rows;
};

const getEquipmentBySlug = async (slug) => {
	const result = await pool.query(
		`
		SELECT
			e.id, e.name, e.brand, e.series,
			CASE WHEN ex1.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', ex1.id, 'name', ex1.name, 'category_id', ec1.id, 'category_name', ec1.name) END AS exercise,
			CASE WHEN ex2.id IS NOT NULL THEN JSON_BUILD_OBJECT('id', ex2.id, 'name', ex2.name, 'category_id', ec2.id, 'category_name', ec2.name) END AS secondary_exercise
		FROM equipment e
		LEFT JOIN exercises ex1 ON ex1.id = e.exercise_id
		LEFT JOIN exercises ex2 ON ex2.id = e.secondary_exercise_id
		LEFT JOIN equipment_categories ec1 ON ec1.id = ex1.category_id
		LEFT JOIN equipment_categories ec2 ON ec2.id = ex2.category_id
		WHERE e.slug = $1
		`,
		[slug]
	);
	return result.rows[0] || null;
};

const searchEquipmentByName = async (query) => {
	const result = await pool.query(
		`
		SELECT id, name, brand, series, slug, type
		FROM equipment
		WHERE 
			(name ILIKE $1
			OR slug ILIKE $1
			OR brand ILIKE $1
			OR series ILIKE $1)
		AND status = 'approved'
		ORDER BY name ASC
		LIMIT 10
		`,
		[`%${query}%`]
	);
	return result.rows;
};

const getBrands = async () => {
	const result = await pool.query(
		`SELECT brand AS name, COUNT(*) AS equipment_count
		FROM equipment
		WHERE brand IS NOT NULL AND status = 'approved'
		GROUP BY brand
		ORDER BY brand ASC`
	);
	return result.rows.map((r) => ({ name: r.name, equipment_count: parseInt(r.equipment_count, 10) }));
};

const getSeriesByBrand = async (brand) => {
	const result = await pool.query(
		`SELECT series AS name, COUNT(*) AS equipment_count
		FROM equipment
		WHERE brand ILIKE $1
		AND series IS NOT NULL
		AND status = 'approved'
		GROUP BY series
		ORDER BY series ASC`,
		[brand]
	);
	return result.rows.map((r) => ({ name: r.name, equipment_count: parseInt(r.equipment_count, 10) }));
};

const checkDuplicate = async (brandId, series, name) => {
	const result = await pool.query(
		`SELECT id, slug, name
		FROM equipment
		WHERE brand_id = $1
		AND ($2::text IS NULL OR series ILIKE $2)
		AND name ILIKE $3
		AND status = 'approved'
		LIMIT 1`,
		[brandId, series || null, `%${name}%`]
	);
	return result.rows[0] || null;
};

// First photo (image_url IS NULL) goes live instantly; a replacement is staged in
// pending_image_url and left for admin approval so the live image is never clobbered.
const uploadEquipmentImage = async (id, fileBuffer, mimeType, userId = null) => {
	const url = await uploadToCloudinary(fileBuffer, mimeType, 'equipment');
	const result = await pool.query(
		`UPDATE equipment SET
			image_url         = CASE WHEN image_url IS NULL THEN $1 ELSE image_url END,
			pending_image_url = CASE WHEN image_url IS NULL THEN NULL ELSE $1 END,
			photo_status      = CASE WHEN image_url IS NULL THEN 'approved' ELSE 'pending' END,
			photo_uploaded_by = $2,
			photo_uploaded_at = NOW()
		 WHERE id = $3
		 RETURNING image_url, pending_image_url, photo_status`,
		[url, userId, id]
	);
	const row = result.rows[0];
	if (!row) return null;
	return { image_url: row.image_url, status: row.photo_status };
};

const rateEquipment = async (userId, equipmentId, rating) => {
	const result = await pool.query(
		`
		INSERT INTO equipment_ratings (user_id, equipment_id, rating)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, equipment_id)
		DO UPDATE SET rating = EXCLUDED.rating
		RETURNING *
		`,
		[userId, equipmentId, rating]
	);
	return result.rows[0];
};

const favouriteEquipment = async (userId, equipmentId) => {
	const result = await pool.query(
		`
		INSERT INTO equipment_favourites (user_id, equipment_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, equipment_id) DO NOTHING
		RETURNING *
		`,
		[userId, equipmentId]
	);
	return result.rows[0] || null;
};

const removeFavouriteEquipment = async (userId, equipmentId) => {
	const result = await pool.query(
		`
		DELETE FROM equipment_favourites
		WHERE user_id = $1 AND equipment_id = $2
		RETURNING *
		`,
		[userId, equipmentId]
	);
	return result.rows[0] || null;
};

// Weight-stack edits are submitted as pending; the live value is untouched until an admin approves.
const updateWeightStack = async (id, weightStack, submittedBy = null) => {
	const result = await pool.query(
		`UPDATE equipment
		 SET pending_weight_stack = $1, weight_stack_status = 'pending', weight_stack_submitted_by = $2
		 WHERE id = $3 AND type = 'pin_loaded'
		 RETURNING id, pending_weight_stack, weight_stack_status`,
		[weightStack, submittedBy, id]
	);
	return result.rows[0] || null;
};

// Admin edit of the catalogue entry itself. The slug is rebuilt from the new
// brand/series/name so it never drifts from what createEquipment would produce.
const updateEquipment = async (id, { brand, series, name, type, resistanceProfile, resistanceCurve }) => {
	const result = await pool.query(
		`UPDATE equipment
		 SET brand = $1,
		     series = $2,
		     name = $3,
		     type = $4,
		     slug = $5,
		     resistance_profile = $6,
		     resistance_curve = $7
		 WHERE id = $8
		 RETURNING *`,
		[
			brand,
			series,
			name,
			type,
			buildSlug(brand, series, name),
			resistanceProfile,
			resistanceCurve ? JSON.stringify(resistanceCurve) : null,
			id
		]
	);
	return result.rows[0] || null;
};

// Exercise-mapping edits from a plain admin are staged; the live mapping is
// untouched until a super admin confirms. exercise_submitted_by is the pending flag.
const stageExerciseMapping = async (id, exerciseId, secondaryExerciseId, submittedBy = null) => {
	const result = await pool.query(
		`UPDATE equipment
		 SET pending_exercise_id = $1,
		     pending_secondary_exercise_id = $2,
		     exercise_submitted_by = $3
		 WHERE id = $4
		 RETURNING id`,
		[exerciseId, secondaryExerciseId, submittedBy, id]
	);
	return result.rows[0] || null;
};

// Super admins write straight through, discarding any proposal already queued.
const applyExerciseMapping = async (id, exerciseId, secondaryExerciseId) => {
	const result = await pool.query(
		`UPDATE equipment
		 SET exercise_id = $1,
		     secondary_exercise_id = $2,
		     pending_exercise_id = NULL,
		     pending_secondary_exercise_id = NULL,
		     exercise_submitted_by = NULL
		 WHERE id = $3
		 RETURNING id`,
		[exerciseId, secondaryExerciseId, id]
	);
	return result.rows[0] || null;
};

const getVariantsByEquipmentId = async (equipmentId) => {
	const result = await pool.query(
		`SELECT id, label, variation_type, is_default
		 FROM equipment_variants
		 WHERE equipment_id = $1 AND status = 'approved'
		 ORDER BY is_default DESC, label ASC`,
		[equipmentId]
	);
	return result.rows;
};

const createVariant = async (equipmentId, label, variationType, isDefault = false, createdBy = null) => {
	const result = await pool.query(
		`INSERT INTO equipment_variants (equipment_id, label, variation_type, is_default, created_by)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING *`,
		[equipmentId, label, variationType, isDefault, createdBy]
	);
	return result.rows[0];
};

const deleteVariant = async (variantId) => {
	const result = await pool.query(
		`DELETE FROM equipment_variants WHERE id = $1 RETURNING *`,
		[variantId]
	);
	return result.rows[0] || null;
};

module.exports = {
	getEquipmentById,
	getAllEquipment,
	getGymsByEquipmentSlug,
	getEquipmentBySlug,
	createEquipment,
	getBrands,
	getSeriesByBrand,
	checkDuplicate,
	uploadEquipmentImage,
	rateEquipment,
	favouriteEquipment,
	removeFavouriteEquipment,
	searchEquipmentByName,
	updateWeightStack,
	updateEquipment,
	stageExerciseMapping,
	applyExerciseMapping,
	getVariantsByEquipmentId,
	createVariant,
	deleteVariant
};
