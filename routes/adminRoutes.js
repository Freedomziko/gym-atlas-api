const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, adminMiddleware, superAdminMiddleware, invalidateProfileCache } = require('../middleware/auth');
const { createNotification } = require('./notificationsRoutes');
const equipmentController = require('../controllers/equipmentController');

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /admin/users — super_admin only
router.get('/users', superAdminMiddleware, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT id, email, username, role, created_at FROM profiles ORDER BY created_at DESC`
		);
		res.json({ data: result.rows });
	} catch (err) {
		console.error('GET USERS ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
});

// GET /admin/pending — all pending submissions
router.get('/pending', async (req, res) => {
	try {
		const gyms = await pool.query(
			`SELECT g.*, u.username AS submitted_by
             FROM gyms g
             LEFT JOIN profiles u ON u.id = g.created_by
             WHERE g.status = 'pending'
             ORDER BY g.created_at DESC`
		);
		const equipment = await pool.query(
			`SELECT e.*, u.username AS submitted_by
             FROM equipment e
             LEFT JOIN profiles u ON u.id = e.created_by
             WHERE e.status = 'pending'
             ORDER BY e.created_at DESC`
		);
		const suggestions = await pool.query(
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
		const photos = await pool.query(
			`SELECT e.id, e.brand, e.series, e.name, e.image_url, e.pending_image_url, e.photo_uploaded_at,
                u.username AS submitted_by
             FROM equipment e
             LEFT JOIN profiles u ON u.id = e.photo_uploaded_by
             WHERE e.photo_status = 'pending' AND e.status = 'approved' AND e.pending_image_url IS NOT NULL
             ORDER BY e.photo_uploaded_at DESC`
		);
		const gymPhotos = await pool.query(
			`SELECT g.id, g.name, g.city, g.country, g.image_url, g.pending_image_url, g.photo_uploaded_at,
                u.username AS submitted_by
             FROM gyms g
             LEFT JOIN profiles u ON u.id = g.photo_uploaded_by
             WHERE g.photo_status = 'pending' AND g.status = 'approved' AND g.pending_image_url IS NOT NULL
             ORDER BY g.photo_uploaded_at DESC`
		);
		const variants = await pool.query(
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
		const weightStacks = await pool.query(
			`SELECT e.id, e.brand, e.series, e.name, e.image_url,
                e.weight_stack, e.pending_weight_stack,
                u.username AS submitted_by
             FROM equipment e
             LEFT JOIN profiles u ON u.id = e.weight_stack_submitted_by
             WHERE e.weight_stack_status = 'pending'
             ORDER BY e.id DESC`
		);
		const gymInstagrams = await pool.query(
			`SELECT g.id, g.name, g.city, g.country, g.image_url,
                g.instagram, g.pending_instagram,
                u.username AS submitted_by
             FROM gyms g
             LEFT JOIN profiles u ON u.id = g.instagram_submitted_by
             WHERE g.instagram_status = 'pending'
             ORDER BY g.id DESC`
		);
		res.json({ data: { gyms: gyms.rows, equipment: equipment.rows, suggestions: suggestions.rows, photos: photos.rows, gymPhotos: gymPhotos.rows, variants: variants.rows, weightStacks: weightStacks.rows, gymInstagrams: gymInstagrams.rows } });
	} catch (err) {
		console.error('GET PENDING ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch pending submissions' });
	}
});

// PATCH /admin/equipment/:id -- direct catalog corrections by trusted admins
router.patch('/equipment/:id', equipmentController.updateEquipmentDetails);

// POST /admin/approve/gym/:id
router.post('/approve/gym/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gyms SET status = 'approved' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Gym not found' });

		const gym = result.rows[0];
		if (gym.created_by) {
			try {
				await createNotification(pool, gym.created_by, 'gym_approved', gym.id, 'Your gym submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE GYM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		console.error('APPROVE GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to approve gym' });
	}
});

// POST /admin/reject/gym/:id
router.post('/reject/gym/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gyms SET status = 'rejected' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Gym not found' });

		const gym = result.rows[0];
		if (gym.created_by) {
			try {
				await createNotification(pool, gym.created_by, 'gym_rejected', gym.id, 'Your gym submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT GYM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		console.error('REJECT GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to reject gym' });
	}
});

// POST /admin/approve/suggestion/:id
router.post('/approve/suggestion/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gym_equipment SET status = 'approved' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Suggestion not found' });

		const sugg = result.rows[0];
		if (sugg.created_by) {
			try {
				await createNotification(pool, sugg.created_by, 'suggestion_approved', sugg.id, 'Your equipment suggestion was approved!');
			} catch (notifyErr) {
				console.error('APPROVE SUGGESTION NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: sugg });
	} catch (err) {
		console.error('APPROVE SUGGESTION ERROR:', err);
		res.status(500).json({ error: 'Failed to approve suggestion' });
	}
});

// POST /admin/reject/suggestion/:id
router.post('/reject/suggestion/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gym_equipment SET status = 'rejected' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Suggestion not found' });
		res.json({ data: result.rows[0] });
	} catch (err) {
		console.error('REJECT SUGGESTION ERROR:', err);
		res.status(500).json({ error: 'Failed to reject suggestion' });
	}
});

// POST /admin/approve/equipment/:id
router.post('/approve/equipment/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment SET status = 'approved' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Equipment not found' });

		const eq = result.rows[0];
		if (eq.created_by) {
			try {
				await createNotification(pool, eq.created_by, 'equipment_approved', eq.id, 'Your equipment submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE EQUIPMENT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		console.error('APPROVE EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to approve equipment' });
	}
});

// POST /admin/reject/equipment/:id
router.post('/reject/equipment/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment SET status = 'rejected' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Equipment not found' });

		const equipment = result.rows[0];
		if (equipment.created_by) {
			try {
				await createNotification(pool, equipment.created_by, 'equipment_rejected', equipment.id, 'Your equipment submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT EQUIPMENT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: equipment });
	} catch (err) {
		console.error('REJECT EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to reject equipment' });
	}
});

// POST /admin/approve/photo/:id
router.post('/approve/photo/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment
             SET image_url = COALESCE(pending_image_url, image_url), pending_image_url = NULL, photo_status = 'approved'
             WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Equipment not found' });

		const eq = result.rows[0];
		if (eq.photo_uploaded_by) {
			try {
				await createNotification(pool, eq.photo_uploaded_by, 'equipment_approved', eq.id, 'Your photo submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		console.error('APPROVE PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to approve photo' });
	}
});

// POST /admin/reject/photo/:id
router.post('/reject/photo/:id', async (req, res) => {
	try {
		// Keep the live image_url; only drop the staged replacement and mark it rejected.
		const result = await pool.query(
			`UPDATE equipment
             SET pending_image_url = NULL, photo_status = 'rejected'
             WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Equipment not found' });

		const eq = result.rows[0];
		if (eq.photo_uploaded_by) {
			try {
				await createNotification(pool, eq.photo_uploaded_by, 'equipment_rejected', eq.id, 'Your photo submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		console.error('REJECT PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to reject photo' });
	}
});

// POST /admin/approve/gym-photo/:id
router.post('/approve/gym-photo/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gyms
             SET image_url = COALESCE(pending_image_url, image_url), pending_image_url = NULL, photo_status = 'approved'
             WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Gym not found' });

		const gym = result.rows[0];
		if (gym.photo_uploaded_by) {
			try {
				await createNotification(pool, gym.photo_uploaded_by, 'gym_approved', gym.id, 'Your gym photo was approved');
			} catch (notifyErr) {
				console.error('APPROVE GYM PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		console.error('APPROVE GYM PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to approve gym photo' });
	}
});

// POST /admin/reject/gym-photo/:id
router.post('/reject/gym-photo/:id', async (req, res) => {
	try {
		// Keep the live image_url; only drop the staged replacement and mark it rejected.
		const result = await pool.query(
			`UPDATE gyms
             SET pending_image_url = NULL, photo_status = 'rejected'
             WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Gym not found' });

		const gym = result.rows[0];
		if (gym.photo_uploaded_by) {
			try {
				await createNotification(pool, gym.photo_uploaded_by, 'gym_rejected', gym.id, 'Your gym photo was not approved');
			} catch (notifyErr) {
				console.error('REJECT GYM PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		console.error('REJECT GYM PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to reject gym photo' });
	}
});

// POST /admin/approve/variant/:id
router.post('/approve/variant/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment_variants SET status = 'approved' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Variant not found' });

		const variant = result.rows[0];
		if (variant.created_by) {
			try {
				await createNotification(pool, variant.created_by, 'equipment_approved', variant.equipment_id, 'Your variant submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE VARIANT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: variant });
	} catch (err) {
		console.error('APPROVE VARIANT ERROR:', err);
		res.status(500).json({ error: 'Failed to approve variant' });
	}
});

// POST /admin/reject/variant/:id
router.post('/reject/variant/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment_variants SET status = 'rejected' WHERE id = $1 RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Variant not found' });

		const variant = result.rows[0];
		if (variant.created_by) {
			try {
				await createNotification(pool, variant.created_by, 'equipment_rejected', variant.equipment_id, 'Your variant submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT VARIANT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: variant });
	} catch (err) {
		console.error('REJECT VARIANT ERROR:', err);
		res.status(500).json({ error: 'Failed to reject variant' });
	}
});

// POST /admin/approve/weight-stack/:id
router.post('/approve/weight-stack/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment
             SET weight_stack = pending_weight_stack, pending_weight_stack = NULL, weight_stack_status = 'approved'
             WHERE id = $1 AND weight_stack_status = 'pending'
             RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Pending weight stack not found' });

		const eq = result.rows[0];
		if (eq.weight_stack_submitted_by) {
			try {
				await createNotification(pool, eq.weight_stack_submitted_by, 'equipment_approved', eq.id, 'Your weight stack update was approved');
			} catch (notifyErr) {
				console.error('APPROVE WEIGHT STACK NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		console.error('APPROVE WEIGHT STACK ERROR:', err);
		res.status(500).json({ error: 'Failed to approve weight stack' });
	}
});

// POST /admin/reject/weight-stack/:id
router.post('/reject/weight-stack/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE equipment
             SET pending_weight_stack = NULL, weight_stack_status = 'rejected'
             WHERE id = $1 AND weight_stack_status = 'pending'
             RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Pending weight stack not found' });

		const eq = result.rows[0];
		if (eq.weight_stack_submitted_by) {
			try {
				await createNotification(pool, eq.weight_stack_submitted_by, 'equipment_rejected', eq.id, 'Your weight stack update was not approved');
			} catch (notifyErr) {
				console.error('REJECT WEIGHT STACK NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		console.error('REJECT WEIGHT STACK ERROR:', err);
		res.status(500).json({ error: 'Failed to reject weight stack' });
	}
});

// POST /admin/approve/gym-instagram/:id
router.post('/approve/gym-instagram/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gyms
             SET instagram = pending_instagram, pending_instagram = NULL, instagram_status = 'approved'
             WHERE id = $1 AND instagram_status = 'pending'
             RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Pending Instagram not found' });

		const gym = result.rows[0];
		if (gym.instagram_submitted_by) {
			try {
				await createNotification(pool, gym.instagram_submitted_by, 'gym_approved', gym.id, 'Your gym Instagram suggestion was approved');
			} catch (notifyErr) {
				console.error('APPROVE GYM INSTAGRAM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		console.error('APPROVE GYM INSTAGRAM ERROR:', err);
		res.status(500).json({ error: 'Failed to approve Instagram' });
	}
});

// POST /admin/reject/gym-instagram/:id
router.post('/reject/gym-instagram/:id', async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE gyms
             SET pending_instagram = NULL, instagram_status = 'rejected'
             WHERE id = $1 AND instagram_status = 'pending'
             RETURNING *`,
			[req.params.id]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'Pending Instagram not found' });

		const gym = result.rows[0];
		if (gym.instagram_submitted_by) {
			try {
				await createNotification(pool, gym.instagram_submitted_by, 'gym_rejected', gym.id, 'Your gym Instagram suggestion was not approved');
			} catch (notifyErr) {
				console.error('REJECT GYM INSTAGRAM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		console.error('REJECT GYM INSTAGRAM ERROR:', err);
		res.status(500).json({ error: 'Failed to reject Instagram' });
	}
});

// POST /admin/make-admin/:userId — super_admin only; promotes a user → admin
router.post('/make-admin/:userId', superAdminMiddleware, async (req, res) => {
	try {
		// Guard on role = 'user' so this can never silently downgrade a super_admin to admin.
		const result = await pool.query(
			`UPDATE profiles SET role = 'admin' WHERE id = $1 AND role = 'user' RETURNING id, email, username, role`,
			[req.params.userId]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'User not found or not a plain user' });
		invalidateProfileCache(req.params.userId);
		res.json({ data: result.rows[0] });
	} catch (err) {
		console.error('MAKE ADMIN ERROR:', err);
		res.status(500).json({ error: 'Failed to update role' });
	}
});

// POST /admin/promote-super/:userId — super_admin only; promotes an admin → super_admin
router.post('/promote-super/:userId', superAdminMiddleware, async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE profiles SET role = 'super_admin' WHERE id = $1 AND role = 'admin' RETURNING id, email, username, role`,
			[req.params.userId]
		);
		if (!result.rows[0]) return res.status(404).json({ error: 'User not found or not an admin' });
		invalidateProfileCache(req.params.userId);
		res.json({ data: result.rows[0] });
	} catch (err) {
		console.error('PROMOTE SUPER ERROR:', err);
		res.status(500).json({ error: 'Failed to update role' });
	}
});

// POST /admin/demote/:userId — super_admin only
// admin → user for anyone; super_admin → admin only when the caller is the root owner (OWNER_USER_ID).
router.post('/demote/:userId', superAdminMiddleware, async (req, res) => {
	try {
		const { userId } = req.params;
		const ownerId = process.env.OWNER_USER_ID;

		const target = await pool.query(`SELECT id, role FROM profiles WHERE id = $1`, [userId]);
		if (!target.rows[0]) return res.status(404).json({ error: 'User not found' });
		const role = target.rows[0].role;

		if (role === 'user') {
			return res.status(400).json({ error: 'User is already at the lowest role' });
		}

		let newRole;
		if (role === 'super_admin') {
			if (!ownerId || req.user.id !== ownerId) {
				return res.status(403).json({ error: 'Only the owner can demote a super admin' });
			}
			if (userId === ownerId) {
				return res.status(403).json({ error: 'The owner cannot be demoted' });
			}
			newRole = 'admin';
		} else {
			// role === 'admin'
			newRole = 'user';
		}

		const result = await pool.query(
			`UPDATE profiles SET role = $2 WHERE id = $1 RETURNING id, email, username, role`,
			[userId, newRole]
		);
		invalidateProfileCache(userId);
		res.json({ data: result.rows[0] });
	} catch (err) {
		console.error('DEMOTE ERROR:', err);
		res.status(500).json({ error: 'Failed to update role' });
	}
});

module.exports = router;
