const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /notifications - get user's notifications
router.get('/', authMiddleware, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT * FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
			[req.user.id]
		);
		res.json({ data: { notifications: result.rows } });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch notifications' });
	}
});

// POST /notifications/read-all - mark all as read
router.post('/read-all', authMiddleware, async (req, res) => {
	try {
		await pool.query(`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`, [
			req.user.id
		]);
		res.json({ data: null });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to mark all as read' });
	}
});

// POST /notifications/:id/read - mark as read
router.post('/:id/read', authMiddleware, async (req, res) => {
	try {
		await pool.query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, [
			req.params.id,
			req.user.id
		]);
		res.json({ data: null });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to mark as read' });
	}
});

module.exports = router;
