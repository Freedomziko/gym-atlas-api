const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authMiddleware } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/uploadConfig');

router.get('/', brandController.getBrands);
router.post('/', authMiddleware, brandController.createBrand);
router.get('/:id/series', brandController.getSeriesByBrand);
router.post('/:id/logo', authMiddleware, upload.single('image'), brandController.uploadBrandLogo);

router.use(handleUploadError);

module.exports = router;
