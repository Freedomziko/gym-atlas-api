const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');
const { authMiddleware: auth, authMiddleware, adminMiddleware, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/uploadConfig');

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
router.patch('/:id/free-weights', authMiddleware, gymController.submitFreeWeights);
router.post('/:id/favourite', auth, gymController.favouriteGym);
router.post('/:id/image', authMiddleware, upload.single('image'), gymController.uploadGymImage);

router.delete('/:gymId/equipment/:equipmentId', authMiddleware, adminMiddleware, gymController.removeGymEquipment);
router.delete('/:id/favourite', auth, gymController.removeFavouriteGym);

router.get('/:id', gymController.getGymById);

router.use(handleUploadError);

module.exports = router;
