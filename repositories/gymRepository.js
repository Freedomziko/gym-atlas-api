const pool = require('../db');
const { findPlaceId, fetchPlaceHours } = require('../services/placesService');

const getGyms = async (userId = null) => {
	const result = await pool.query(
		`
        SELECT
            g.id,
            g.name,
            g.city,
            g.country,
            g.image_url,
            g.latitude AS lat,
            g.longitude AS lng,
            COALESCE(eq.total_equipment, 0)::INT AS total_equipment,
            COALESCE(eq.unique_machines, 0)::INT AS unique_machines,
            COALESCE(ROUND(gr.avg_rating, 1), 0) AS avg_rating,
            gr.user_rating,
            COALESCE(gf.favourites, 0)::INT AS favourites,
            g.opening_hours,
            g.hours_updated_at,
            COALESCE((
                SELECT json_agg(e.image_url ORDER BY ge.created_at ASC)
                FROM gym_equipment ge
                JOIN equipment e ON ge.equipment_id = e.id
                WHERE ge.gym_id = g.id
                  AND ge.status = 'approved'
                  AND e.image_url IS NOT NULL
                LIMIT 4
            ), '[]') AS equipment_images
        FROM gyms g
        LEFT JOIN (
            SELECT gym_id,
                SUM(quantity) AS total_equipment,
                COUNT(DISTINCT equipment_id) AS unique_machines
            FROM gym_equipment
            WHERE status = 'approved'
            GROUP BY gym_id
        ) eq ON eq.gym_id = g.id
        LEFT JOIN (
            SELECT gym_id,
                AVG(rating) AS avg_rating,
                MAX(CASE WHEN user_id = $1 THEN rating END) AS user_rating
            FROM gym_ratings
            GROUP BY gym_id
        ) gr ON gr.gym_id = g.id
        LEFT JOIN (
            SELECT gym_id,
                COUNT(*) AS favourites
            FROM gym_favourites
            GROUP BY gym_id
        ) gf ON gf.gym_id = g.id
        WHERE g.status = 'approved'
        `,
		[userId]
	);
	return result.rows;
};

// Keep open for admin preview (no status filter)
const getGymById = async (id, userId = null) => {
	const result = await pool.query(
		`
        SELECT 
            g.id,
            g.name,
            g.slug,
            g.address,
            g.city,
            g.country,
            g.latitude AS lat,
            g.longitude AS lng,
            g.instagram,
            g.image_url,
            g.created_at,
            g.status,
            COALESCE(eq.total_equipment, 0)::INT AS total_equipment,
            COALESCE(eq.unique_machines, 0)::INT AS unique_machines,
            COALESCE(ROUND(gr.avg_rating, 1), 0) AS rating,
            COALESCE(gf.favourites, 0)::INT AS favourites,
            COALESCE(gf.is_favorite, false) AS is_favorite,
            g.opening_hours,
            g.hours_updated_at,
            COALESCE((
                SELECT json_agg(e.image_url ORDER BY ge.created_at ASC)
                FROM gym_equipment ge
                JOIN equipment e ON ge.equipment_id = e.id
                WHERE ge.gym_id = g.id
                  AND ge.status = 'approved'
                  AND e.image_url IS NOT NULL
                LIMIT 4
            ), '[]') AS equipment_images
        FROM gyms g
        LEFT JOIN (
            SELECT gym_id,
                SUM(quantity) AS total_equipment,
                COUNT(DISTINCT equipment_id) AS unique_machines
            FROM gym_equipment
            GROUP BY gym_id
        ) eq ON eq.gym_id = g.id
        LEFT JOIN (
            SELECT gym_id,
                AVG(rating) AS avg_rating
            FROM gym_ratings
            GROUP BY gym_id
        ) gr ON gr.gym_id = g.id
        LEFT JOIN (
            SELECT gym_id,
                COUNT(*) AS favourites,
                BOOL_OR(user_id = $2 AND $2 IS NOT NULL) AS is_favorite
            FROM gym_favourites
            GROUP BY gym_id
        ) gf ON gf.gym_id = g.id
        WHERE g.id = $1
        `,
		[id, userId]
	);
	return result.rows[0] || null;
};

const createGym = async (
	name,
	latitude,
	longitude,
	address,
	city,
	country,
	instagram,
	createdBy = null
) => {
	const slug = name.toLowerCase().replace(/\s+/g, '-');
	const result = await pool.query(
		`INSERT INTO gyms (name, slug, latitude, longitude, address, city, country, instagram, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING *`,
		[name, slug, latitude, longitude, address, city, country, instagram, createdBy]
	);
	const gym = result.rows[0];

	try {
		const placeId = await findPlaceId(name, latitude, longitude);
		if (placeId) {
			const hours = await fetchPlaceHours(placeId);
			if (hours) {
				await pool.query(
					`UPDATE gyms SET opening_hours = $1, hours_updated_at = NOW() WHERE id = $2`,
					[hours, gym.id]
				);
			}
		}
	} catch (err) {
		console.error('createGym: Places hours lookup failed:', err.message);
	}

	return gym;
};

// First photo (image_url IS NULL) goes live instantly; a replacement is staged in
// pending_image_url and left for admin approval so the live image is never clobbered.
const uploadGymImage = async (id, url, userId = null) => {
	const result = await pool.query(
		`UPDATE gyms SET
			image_url         = CASE WHEN image_url IS NULL THEN $1 ELSE image_url END,
			pending_image_url = CASE WHEN image_url IS NULL THEN NULL ELSE $1 END,
			photo_status      = CASE WHEN image_url IS NULL THEN 'approved' ELSE 'pending' END,
			photo_uploaded_by = $2,
			photo_uploaded_at = NOW()
		 WHERE id = $3
		 RETURNING image_url, pending_image_url, photo_status`,
		[url, userId, id]
	);
	return result.rows[0] || null;
};

// Stages a suggested Instagram handle for admin review; the live handle is
// unchanged until approved. Mirrors the weight-stack review flow.
const updateInstagram = async (id, instagram, submittedBy = null) => {
	const result = await pool.query(
		`UPDATE gyms
		 SET pending_instagram = $1, instagram_status = 'pending', instagram_submitted_by = $2
		 WHERE id = $3
		 RETURNING id, instagram, pending_instagram, instagram_status`,
		[instagram, submittedBy, id]
	);
	return result.rows[0] || null;
};

const getGymEquipment = async (gymId) => {
	const result = await pool.query(
		`
		SELECT
			e.id AS equipment_id,
			e.brand,
			e.series,
			e.name,
			CONCAT_WS(' ', e.brand, e.series, e.name) AS full_name,
			ge.quantity,
			e.image_url,
			ge.status
		FROM gym_equipment ge
		JOIN equipment e ON ge.equipment_id = e.id
		WHERE ge.gym_id = $1
		  AND ge.status IN ('approved', 'pending')
		ORDER BY ge.status ASC, e.brand, e.name
		`,
		[gymId]
	);
	return result.rows;
};

const addGymEquipment = async (
	gymId,
	equipmentId,
	quantity,
	notes,
	status = 'approved',
	createdBy = null
) => {
	const result = await pool.query(
		`INSERT INTO gym_equipment (gym_id, equipment_id, quantity, notes, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (gym_id, equipment_id)
         DO UPDATE SET
             quantity   = CASE
                              WHEN EXCLUDED.status = 'approved'
                              THEN gym_equipment.quantity + EXCLUDED.quantity
                              ELSE gym_equipment.quantity
                          END,
             notes      = COALESCE(EXCLUDED.notes, gym_equipment.notes),
             status     = CASE WHEN gym_equipment.status = 'approved' THEN 'approved' ELSE EXCLUDED.status END,
             created_by = COALESCE(gym_equipment.created_by, EXCLUDED.created_by)
         RETURNING *`,
		[gymId, equipmentId, quantity, notes, status, createdBy]
	);
	return result.rows[0];
};

// GET /gyms/ticker — small random sample of approved gyms + gym equipment,
// mixed together for the landing-page coordinate ticker. No pagination needed.
const getTickerSample = async () => {
	const gymsResult = await pool.query(
		`
		SELECT name, latitude AS lat, longitude AS lng
		FROM gyms
		WHERE status = 'approved'
		  AND latitude IS NOT NULL
		  AND longitude IS NOT NULL
		ORDER BY RANDOM()
		LIMIT 7
		`
	);

	const equipmentResult = await pool.query(
		`
		SELECT
			CONCAT_WS(' ', e.brand, e.series, e.name) AS name,
			g.latitude AS lat,
			g.longitude AS lng
		FROM gym_equipment ge
		JOIN gyms g ON g.id = ge.gym_id
		JOIN equipment e ON e.id = ge.equipment_id
		WHERE ge.status = 'approved'
		  AND g.status = 'approved'
		  AND e.status = 'approved'
		  AND g.latitude IS NOT NULL
		  AND g.longitude IS NOT NULL
		ORDER BY RANDOM()
		LIMIT 7
		`
	);

	const entries = [
		...gymsResult.rows.map((r) => ({ type: 'gym', name: r.name, lat: r.lat, lng: r.lng })),
		...equipmentResult.rows.map((r) => ({ type: 'equipment', name: r.name, lat: r.lat, lng: r.lng }))
	];

	for (let i = entries.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[entries[i], entries[j]] = [entries[j], entries[i]];
	}

	return entries;
};

const getGymStats = async () => {
	const result = await pool.query(
		`
		SELECT 
			g.id,
			g.name,
			g.latitude AS lat,
			g.longitude AS lng,
			COALESCE(SUM(ge.quantity), 0)::INT AS total_equipment,
			COUNT(DISTINCT ge.equipment_id)::INT AS unique_machines,
			ROUND(AVG(gr.rating), 1) AS avg_rating,
			COUNT(DISTINCT gf.user_id) AS hearts
		FROM gyms g
		LEFT JOIN gym_equipment ge ON ge.gym_id = g.id
		LEFT JOIN gym_ratings gr ON gr.gym_id = g.id
		LEFT JOIN gym_favourites gf ON gf.gym_id = g.id
		WHERE g.status = 'approved'
		GROUP BY g.id
		ORDER BY total_equipment DESC
		`
	);
	return result.rows;
};

// Quantity > 1: decrement
const decrementGymEquipment = async (gymId, equipmentId) => {
	const result = await pool.query(
		`
		UPDATE gym_equipment
		SET quantity = quantity - 1
		WHERE gym_id = $1
		AND equipment_id = $2
		AND quantity > 1
		RETURNING *
		`,
		[gymId, equipmentId]
	);
	return result.rows[0] || null;
};

// Quantity = 1: delete the row
const deleteGymEquipment = async (gymId, equipmentId) => {
	const result = await pool.query(
		`
		DELETE FROM gym_equipment
		WHERE gym_id = $1
		AND equipment_id = $2
		AND quantity = 1
		RETURNING *
		`,
		[gymId, equipmentId]
	);
	return result.rows[0] || null;
};

const rateGym = async (userId, gymId, rating) => {
	const result = await pool.query(
		`
		INSERT INTO gym_ratings (user_id, gym_id, rating)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, gym_id)
		DO UPDATE SET rating = EXCLUDED.rating
		RETURNING *
		`,
		[userId, gymId, rating]
	);
	return result.rows[0];
};

const favouriteGym = async (userId, gymId) => {
	const result = await pool.query(
		`
		INSERT INTO gym_favourites (user_id, gym_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
		RETURNING *
		`,
		[userId, gymId]
	);
	return result.rows[0] || null;
};

const removeFavouriteGym = async (userId, gymId) => {
	const result = await pool.query(
		`
		DELETE FROM gym_favourites
		WHERE user_id = $1 AND gym_id = $2
		RETURNING *
		`,
		[userId, gymId]
	);
	return result.rows[0] || null;
};

const searchGymsByMachines = async (filters) => {
	const patterns = filters.map((f) => `%${f}%`);
	const result = await pool.query(
		`
		SELECT 
			g.id,
			g.name,
			g.latitude AS lat,
			g.longitude AS lng,
			COALESCE(SUM(ge.quantity), 0)::INT AS total_equipment,
			COUNT(DISTINCT ge.equipment_id)::INT AS unique_machines,
			COALESCE(ROUND(AVG(gr.rating), 1), 0)::FLOAT AS rating,
			COUNT(DISTINCT gf.user_id)::INT AS favourites
		FROM gyms g
		JOIN gym_equipment ge ON ge.gym_id = g.id
		JOIN equipment e ON e.id = ge.equipment_id
		LEFT JOIN gym_ratings gr ON gr.gym_id = g.id
		LEFT JOIN gym_favourites gf ON gf.gym_id = g.id
		WHERE CONCAT_WS(' ', e.brand, e.series, e.name) ILIKE ANY($1)
		AND g.status = 'approved'
		GROUP BY g.id
		HAVING COUNT(DISTINCT e.id) = $2
		`,
		[patterns, filters.length]
	);
	return result.rows;
};

// Broad "has ANY equipment from this brand" match — unlike searchGymsByMachines
// there's no HAVING COUNT requirement, since one brand can match many machines per gym.
const searchGymsByBrand = async (brandId) => {
	const result = await pool.query(
		`
		SELECT
			g.id,
			g.name,
			g.latitude AS lat,
			g.longitude AS lng,
			COALESCE(SUM(ge.quantity), 0)::INT AS total_equipment,
			COUNT(DISTINCT ge.equipment_id)::INT AS unique_machines,
			COALESCE(ROUND(AVG(gr.rating), 1), 0)::FLOAT AS rating,
			COUNT(DISTINCT gf.user_id)::INT AS favourites
		FROM gyms g
		JOIN gym_equipment ge ON ge.gym_id = g.id
		JOIN equipment e ON e.id = ge.equipment_id
		LEFT JOIN gym_ratings gr ON gr.gym_id = g.id
		LEFT JOIN gym_favourites gf ON gf.gym_id = g.id
		WHERE e.brand_id = $1
		AND g.status = 'approved'
		GROUP BY g.id
		`,
		[brandId]
	);
	return result.rows;
};

const getFavouriteGyms = async (userId) => {
	const result = await pool.query(
		`
		SELECT g.*
		FROM gym_favourites gf
		JOIN gyms g ON g.id = gf.gym_id
		WHERE gf.user_id = $1
		AND g.status = 'approved'
		ORDER BY gf.created_at DESC
		`,
		[userId]
	);
	return result.rows;
};

module.exports = {
	getGyms,
	getGymById,
	createGym,
	uploadGymImage,
	updateInstagram,
	getGymEquipment,
	addGymEquipment,
	getGymStats,
	getTickerSample,
	decrementGymEquipment,
	deleteGymEquipment,
	rateGym,
	favouriteGym,
	removeFavouriteGym,
	searchGymsByMachines,
	searchGymsByBrand,
	getFavouriteGyms
};
