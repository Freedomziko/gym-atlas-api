const cloudinary = require('cloudinary').v2;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

// Drop-in replacement for azureStorage's uploadToAzure(fileBuffer, mimeType, folder).
// mimeType is accepted for signature compatibility; Cloudinary detects it automatically.
const uploadToCloudinary = (fileBuffer, mimeType, folder) =>
	new Promise((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{ folder: `gym-atlas/${folder}`, resource_type: 'image' },
				(error, result) => {
					if (error) reject(error);
					else resolve(result.secure_url);
				}
			)
			.end(fileBuffer);
	});

module.exports = { cloudinary, uploadToCloudinary };
