const notificationRepo = require('../repositories/notificationRepository');

const createNotification = async (userId, type, relatedId, message) => {
	await notificationRepo.insertNotification(userId, type, relatedId, message);
};

module.exports = { createNotification };
