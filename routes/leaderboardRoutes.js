const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
	try {
		const result = await pool.query(`
            WITH gym_counts AS (
                SELECT created_by AS user_id, COUNT(*) AS cnt
                FROM gyms
                WHERE status = 'approved' AND created_by IS NOT NULL
                GROUP BY created_by
            ),
            equipment_counts AS (
                SELECT created_by AS user_id, COUNT(*) AS cnt
                FROM equipment
                WHERE status = 'approved' AND created_by IS NOT NULL
                GROUP BY created_by
            ),
            link_counts AS (
                SELECT created_by AS user_id, COUNT(*) AS cnt
                FROM gym_equipment
                WHERE status = 'approved' AND created_by IS NOT NULL
                GROUP BY created_by
            ),
            photo_counts AS (
                SELECT photo_uploaded_by AS user_id, COUNT(*) AS cnt
                FROM equipment
                WHERE status = 'approved' AND photo_status = 'approved' AND photo_uploaded_by IS NOT NULL
                GROUP BY photo_uploaded_by
            )
            SELECT
                u.id,
                u.username,
                COALESCE(gc.cnt, 0) AS gyms_added,
                COALESCE(ec.cnt, 0) AS equipment_added,
                COALESCE(lc.cnt, 0) AS equipment_linked,
                COALESCE(pc.cnt, 0) AS photos_added,
                (COALESCE(gc.cnt, 0) + COALESCE(ec.cnt, 0) + COALESCE(lc.cnt, 0) + COALESCE(pc.cnt, 0)) AS total_contributions
            FROM profiles u
            LEFT JOIN gym_counts gc ON gc.user_id = u.id
            LEFT JOIN equipment_counts ec ON ec.user_id = u.id
            LEFT JOIN link_counts lc ON lc.user_id = u.id
            LEFT JOIN photo_counts pc ON pc.user_id = u.id
            WHERE COALESCE(gc.cnt, 0) + COALESCE(ec.cnt, 0) + COALESCE(lc.cnt, 0) + COALESCE(pc.cnt, 0) > 0
            ORDER BY total_contributions DESC
            LIMIT 100
        `);
		res.json({ data: result.rows });
	} catch (err) {
		console.error('LEADERBOARD ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch leaderboard' });
	}
});

// GET /leaderboard/user/:id - get specific user's contributions with details
router.get('/user/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const [summary, gyms, equipment, links, photos] = await Promise.all([
			pool.query(
				`
	            SELECT
	                (SELECT COUNT(*) FROM gyms        WHERE created_by = $1 AND status = 'approved')::int AS gyms_added,
	                (SELECT COUNT(*) FROM equipment   WHERE created_by = $1 AND status = 'approved')::int AS equipment_added,
	                (SELECT COUNT(*) FROM gym_equipment WHERE created_by = $1 AND status = 'approved')::int AS equipment_linked,
	                (SELECT COUNT(*) FROM equipment   WHERE photo_uploaded_by = $1 AND status = 'approved' AND photo_status = 'approved')::int AS photos_added
	        `,
				[id]
			),
			pool.query(
				`
	            SELECT id, name, city, country, created_at
	            FROM gyms
	            WHERE created_by = $1 AND status = 'approved'
	            ORDER BY created_at DESC
	            LIMIT 5
	        `,
				[id]
			),
			pool.query(
				`
	            SELECT id, brand, series, name, created_at
	            FROM equipment
	            WHERE created_by = $1 AND status = 'approved'
	            ORDER BY created_at DESC
	            LIMIT 5
	        `,
				[id]
			),
			pool.query(
				`
	            SELECT
	                ge.id,
	                ge.created_at,
	                g.name AS gym_name,
	                CONCAT(e.brand, ' ', e.name) AS equipment_name
	            FROM gym_equipment ge
	            JOIN gyms g ON g.id = ge.gym_id
	            JOIN equipment e ON e.id = ge.equipment_id
	            WHERE ge.created_by = $1 AND ge.status = 'approved'
	            ORDER BY ge.created_at DESC
	            LIMIT 5
	        `,
				[id]
			),
			pool.query(
				`
	            SELECT id, brand, series, name, image_url, photo_uploaded_at AS uploaded_at
	            FROM equipment
	            WHERE photo_uploaded_by = $1 AND status = 'approved'
	            ORDER BY photo_uploaded_at DESC
	            LIMIT 5
	        `,
				[id]
			),
		]);

		const s = summary.rows[0] || { gyms_added: 0, equipment_added: 0, equipment_linked: 0, photos_added: 0 };
		res.json({
			data: {
				summary: {
					...s,
					total_contributions: s.gyms_added + s.equipment_added + s.equipment_linked + s.photos_added
				},
				recent: {
					gyms: gyms.rows,
					equipment: equipment.rows,
					links: links.rows,
					photos: photos.rows
				}
			}
		});
	} catch (err) {
		console.error('USER CONTRIBUTIONS ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch user contributions' });
	}
});

module.exports = router;
