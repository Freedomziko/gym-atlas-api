const exercisesRepo = require('../repositories/exercisesRepository');

const getExercisesByCategory = async (category) => {
	if (!category) throw new Error('category is required');
	return await exercisesRepo.getExercisesByCategory(category);
};

module.exports = { getExercisesByCategory };
