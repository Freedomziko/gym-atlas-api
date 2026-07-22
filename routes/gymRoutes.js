const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');
const { authMiddleware: auth, authMiddleware, adminMiddleware, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('./notificationsRoutes');
const gymRepo = require('../repositories/gymRepository');
const pool = require('../db');
const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only images allowed'));
		}
	}
});

router.get('/', optionalAuth, gymController.getGyms);
router.get('/stats', gymController.getGymStats);
router.get('/ticker', gymController.getGymTicker);
router.get('/favourites', auth, gymController.getFavouriteGyms);
router.get('/:id/equipment', gymController.getGymEquipment);

router.post('/', authMiddleware, gymController.createGym);
router.post('/search', gymController.searchGyms);
router.post('/:gymId/equipment', auth, gymController.addGymEquipment);
router.post('/:id/rate', auth, gymController.rateGym);
router.patch('/:id/instagram', authMiddleware, gymController.updateInstagram);
router.post('/:id/favourite', auth, gymController.favouriteGym);
router.post('/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No image provided' });

		const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'gyms');
		// First photo goes live instantly; a replacement is staged as pending until an admin approves.
		const result = await gymRepo.uploadGymImage(req.params.id, url, req.user?.id || null);
		if (!result) return res.status(404).json({ error: 'Gym not found' });

		if (result.photo_status === 'pending' && req.user?.id) {
			try {
				await createNotification(pool, req.user.id, 'submission_received', req.params.id, 'Your gym photo update is under review');
			} catch (notifyErr) {
				console.error('GYM PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: { image_url: result.image_url, status: result.photo_status } });
	} catch (err) {
		console.error('IMAGE UPLOAD ERROR:', err);
		res.status(500).json({ error: 'Failed to upload image' });
	}
});

router.delete('/:gymId/equipment/:equipmentId', authMiddleware, adminMiddleware, gymController.removeGymEquipment);
router.delete('/:id/favourite', auth, gymController.removeFavouriteGym);

router.get('/:id', gymController.getGymById);

router.use((err, _req, res, next) => {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).json({ error: 'File too large. Max 5MB.' });
	}
	next(err);
});

module.exports = router;
