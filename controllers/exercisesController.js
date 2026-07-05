const exercisesService = require('../services/exercisesService');

const getExercisesByCategory = async (req, res) => {
	try {
		const category = req.query.category || 'machine';
		const exercises = await exercisesService.getExercisesByCategory(category);
		res.json({ data: exercises });
	} catch (err) {
		if (err.message === 'category is required') {
			return res.status(400).json({ error: err.message });
		}
		console.error('GET EXERCISES ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch exercises' });
	}
};

module.exports = { getExercisesByCategory };
