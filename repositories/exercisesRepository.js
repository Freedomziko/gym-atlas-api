const pool = require('../db');

// Aliases ride along so search can match a merged-away name (e.g. "T Bar Row -
// Chest Supported") back to the exercise that absorbed it.
const getExercisesByCategory = async (category) => {
	const result = await pool.query(
		`SELECT e.id, e.name,
		        COALESCE(
		            ARRAY_AGG(a.raw_name) FILTER (WHERE a.raw_name IS NOT NULL),
		            '{}'
		        ) AS aliases
		 FROM exercises e
		 LEFT JOIN exercise_name_aliases a ON a.exercise_id = e.id
		 WHERE e.category = $1
		 GROUP BY e.id, e.name
		 ORDER BY e.name ASC`,
		[category]
	);
	return result.rows;
};

module.exports = { getExercisesByCategory };
