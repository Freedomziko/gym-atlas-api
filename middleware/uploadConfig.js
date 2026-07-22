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

const handleUploadError = (err, _req, res, next) => {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).json({ error: 'File too large. Max 5MB.' });
	}
	next(err);
};

module.exports = { upload, handleUploadError };
