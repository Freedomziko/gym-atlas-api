const pool = require('../db');

const insertNotification = async (userId, type, relatedId, message) => {
	await pool.query(
		`INSERT INTO notifications (user_id, type, related_id, message, read)
         VALUES ($1, $2, $3, $4, false)`,
		[userId, type, relatedId, message]
	);
};

module.exports = { insertNotification };
