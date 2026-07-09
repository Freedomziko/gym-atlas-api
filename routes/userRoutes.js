const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware: auth, optionalAuth, invalidateProfileCache } = require('../middleware/auth');

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

router.get('/:id/stats', auth, async (req, res) => {
	const userId = req.params.id;
	try {
		const [ratingsRes, gymFavsRes, equipFavsRes] = await Promise.all([
			pool.query(`SELECT COUNT(*) FROM equipment_ratings WHERE user_id = $1`, [userId]),
			pool.query(`SELECT COUNT(*) FROM gym_favourites WHERE user_id = $1`, [userId]),
			pool.query(`SELECT COUNT(*) FROM equipment_favourites WHERE user_id = $1`, [userId])
		]);
		res.json({
			data: {
				totalRatings: parseInt(ratingsRes.rows[0].count),
				favouriteGymsCount: parseInt(gymFavsRes.rows[0].count),
				favouriteEquipmentCount: parseInt(equipFavsRes.rows[0].count)
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch stats' });
	}
});

router.get('/:id/ratings/gyms', auth, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT g.id, g.name, g.city, g.country, gr.rating
			 FROM gym_ratings gr
			 JOIN gyms g ON g.id = gr.gym_id
			 WHERE gr.user_id = $1 AND g.status = 'approved'
			 ORDER BY gr.created_at DESC`,
			[req.params.id]
		);
		res.json({ data: result.rows });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch gym ratings' });
	}
});

router.get('/:id/ratings/equipment', auth, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT e.id, e.name, e.brand, e.series, e.slug, e.image_url, er.rating
			 FROM equipment_ratings er
			 JOIN equipment e ON e.id = er.equipment_id
			 WHERE er.user_id = $1 AND e.status = 'approved'
			 ORDER BY er.created_at DESC`,
			[req.params.id]
		);
		res.json({ data: result.rows });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch equipment ratings' });
	}
});

router.get('/:id/favourites/gyms', auth, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT g.id, g.name, g.city, g.country
			 FROM gym_favourites gf
			 JOIN gyms g ON g.id = gf.gym_id
			 WHERE gf.user_id = $1 AND g.status = 'approved'
			 ORDER BY gf.created_at DESC`,
			[req.params.id]
		);
		res.json({ data: result.rows });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch favourite gyms' });
	}
});

router.get('/:id/favourites/equipment', auth, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT e.id, e.name, e.brand, e.series, e.slug, e.image_url
			 FROM equipment_favourites ef
			 JOIN equipment e ON e.id = ef.equipment_id
			 WHERE ef.user_id = $1 AND e.status = 'approved'
			 ORDER BY ef.created_at DESC`,
			[req.params.id]
		);
		res.json({ data: result.rows });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch favourite equipment' });
	}
});

// POST /users/sync — upsert profile for the authenticated user (call after OAuth sign-in)
router.post('/sync', auth, async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT id, username, email, role, created_at FROM profiles WHERE id = $1',
			[req.user.id]
		);
		res.json({ data: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: 'Failed to sync user' });
	}
});

// PATCH /users/me/username -- a user may only rename their own profile.
router.patch('/me/username', auth, async (req, res) => {
	const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
	if (!USERNAME_PATTERN.test(username)) {
		return res.status(400).json({ error: 'Username must be 3-20 letters, numbers, or underscores' });
	}

	try {
		const result = await pool.query(
			`UPDATE profiles
			 SET username = $1
			 WHERE id = $2
			 RETURNING id, username, email, role, created_at`,
			[username, req.user.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

		invalidateProfileCache(req.user.id);
		res.json({ data: result.rows[0] });
	} catch (err) {
		if (err.code === '23505') {
			return res.status(409).json({ error: 'Username already taken' });
		}
		console.error('UPDATE USERNAME ERROR:', err);
		res.status(500).json({ error: 'Failed to update username' });
	}
});

router.get('/by-username/:username', optionalAuth, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT
				u.id, u.username, u.created_at,
				(SELECT COUNT(*) FROM gym_ratings       WHERE user_id = u.id)::int AS gyms_rated,
				(SELECT COUNT(*) FROM equipment_ratings WHERE user_id = u.id)::int AS equipment_rated
			 FROM profiles u
			 WHERE u.username = $1`,
			[req.params.username]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
		res.json({ data: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch user' });
	}
});

// /:id must always be last
router.get('/:id', optionalAuth, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT
				u.username, u.created_at,
				(SELECT COUNT(*) FROM gym_ratings       WHERE user_id = u.id)::int AS gyms_rated,
				(SELECT COUNT(*) FROM equipment_ratings WHERE user_id = u.id)::int AS equipment_rated
			 FROM profiles u
			 WHERE u.id = $1`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
		res.json({ data: result.rows[0] });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch user' });
	}
});

module.exports = router;
