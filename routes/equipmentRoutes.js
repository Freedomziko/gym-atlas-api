const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authMiddleware, optionalAuth, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
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

// ── Image upload ──────────────────────────────────────────────────────────────
router.post(
	'/:id/image',
	authMiddleware,
	upload.single('image'),
	equipmentController.uploadEquipmentImage
);

// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/', optionalAuth, equipmentController.getAllEquipment);
router.post('/', authMiddleware, equipmentController.createEquipment);

// ── Specific named routes (must be before /:id) ───────────────────────────────
router.get('/search', equipmentController.searchEquipment);
router.get('/brands', equipmentController.getBrands);
router.get('/series', equipmentController.getSeriesByBrand);
router.get('/check-duplicate', equipmentController.checkDuplicate);
router.get('/:slug/gyms', equipmentController.getGymsWithEquipment);

// ── Interactions ──────────────────────────────────────────────────────────────
router.post('/:id/rate', authMiddleware, equipmentController.rateEquipment);
router.post('/:id/favourite', authMiddleware, equipmentController.favouriteEquipment);
router.delete('/:id/favourite', authMiddleware, equipmentController.removeFavouriteEquipment);
router.patch('/:id/weight-stack', authMiddleware, equipmentController.updateWeightStack);

// ── Variants ──────────────────────────────────────────────────────────────────
router.get('/:id/variants', equipmentController.getVariants);
router.post('/:id/variants', authMiddleware, equipmentController.createVariant);
router.delete('/variants/:variantId', authMiddleware, adminMiddleware, equipmentController.deleteVariant);

// ── Single resource (must be last) ────────────────────────────────────────────
router.get('/:id', optionalAuth, equipmentController.getEquipmentById);

router.use((err, _req, res, next) => {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).json({ error: 'File too large. Max 5MB.' });
	}
	next(err);
});

module.exports = router;
