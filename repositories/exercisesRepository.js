const pool = require('../db');

const getExercisesByCategory = async (category) => {
	const result = await pool.query(
		`SELECT id, name FROM exercises WHERE category = $1 ORDER BY name ASC`,
		[category]
	);
	return result.rows;
};

module.exports = { getExercisesByCategory };
