const express = require('express');
const router = express.Router();
const exercisesController = require('../controllers/exercisesController');

router.get('/', exercisesController.getExercisesByCategory);

module.exports = router;
