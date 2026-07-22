const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authMiddleware, optionalAuth, adminMiddleware } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/uploadConfig');

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

router.use(handleUploadError);

module.exports = router;
