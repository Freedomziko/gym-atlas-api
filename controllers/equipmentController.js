const equipmentService = require('../services/equipmentService');
const { createNotification } = require('../services/notificationService');

const getAllEquipment = async (req, res) => {
	try {
		const userId = req.user?.id || null;
		const equipment = await equipmentService.getAllEquipment(userId);
		res.json({ data: equipment });
	} catch (err) {
		console.error('GET ALL EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch equipment' });
	}
};

const getEquipmentById = async (req, res) => {
	try {
		const userId = req.user?.id || null;
		const equipment = await equipmentService.getEquipmentById(req.params.id, userId);
		res.json({ data: equipment });
	} catch (err) {
		if (err.message === 'Equipment not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('GET EQUIPMENT BY ID ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch equipment' });
	}
};

const createEquipment = async (req, res) => {
	try {
		const { brand, series, name, type, brand_id, exercise_id, secondary_exercise_id,
			resistance_profile, resistance_curve } = req.body;
		const createdBy = req.user?.id || null;
		const equipment = await equipmentService.createEquipment(
			brand,
			series,
			name,
			type,
			createdBy,
			brand_id || null,
			exercise_id || null,
			secondary_exercise_id || null,
			resistance_profile ?? 'constant',
			resistance_curve ?? null
		);
		if (createdBy) {
			try {
				await createNotification(createdBy, 'submission_received', equipment.id, 'Your equipment submission is under review');
			} catch (notifyErr) {
				console.error('EQUIPMENT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.status(201).json({ data: equipment });
	} catch (err) {
		if (/required|Invalid/.test(err.message)) {
			return res.status(400).json({ error: err.message });
		}
		console.error('CREATE EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to create equipment' });
	}
};

const getGymsWithEquipment = async (req, res) => {
	try {
		const data = await equipmentService.getGymsWithEquipment(req.params.slug);
		res.json({ data });
	} catch (err) {
		if (err.message === 'Equipment not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('GET GYMS WITH EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch gyms for equipment' });
	}
};

const searchEquipment = async (req, res) => {
	try {
		const results = await equipmentService.searchEquipment(req.query.q);
		res.json({ data: results });
	} catch (err) {
		console.error('SEARCH EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to search equipment' });
	}
};

const getBrands = async (req, res) => {
	try {
		const brands = await equipmentService.getBrands();
		res.json({ data: brands });
	} catch (err) {
		console.error('GET BRANDS ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch brands' });
	}
};

const getSeriesByBrand = async (req, res) => {
	try {
		const series = await equipmentService.getSeriesByBrand(req.query.brand);
		res.json({ data: series });
	} catch (err) {
		if (err.message === 'brand is required') {
			return res.status(400).json({ error: err.message });
		}
		console.error('GET SERIES ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch series' });
	}
};

const checkDuplicate = async (req, res) => {
	try {
		const { brandId, series, name } = req.query;
		const match = await equipmentService.checkDuplicate(parseInt(brandId, 10), series, name);
		res.json({ data: { match: match || null } });
	} catch (err) {
		if (err.message === 'brandId and name are required') {
			return res.status(400).json({ error: err.message });
		}
		console.error('CHECK DUPLICATE ERROR:', err);
		res.status(500).json({ error: 'Failed to check for duplicates' });
	}
};

const uploadEquipmentImage = async (req, res) => {
	try {
		const userId = req.user?.id || null;
		const result = await equipmentService.uploadEquipmentImage(req.params.id, req.file?.buffer, req.file?.mimetype, userId);
		if (!result) return res.status(404).json({ error: 'Equipment not found' });
		// A replacement photo is staged as pending; only then notify the contributor it's under review.
		if (result.status === 'pending' && userId) {
			try {
				await createNotification(userId, 'submission_received', req.params.id, 'Your equipment photo update is under review');
			} catch (notifyErr) {
				console.error('EQUIPMENT PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: { image_url: result.image_url, status: result.status } });
	} catch (err) {
		if (err.message === 'No image provided') {
			return res.status(400).json({ error: err.message });
		}
		console.error('IMAGE UPLOAD ERROR:', err);
		res.status(500).json({ error: 'Failed to upload image' });
	}
};

const rateEquipment = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'No user found' });
		const result = await equipmentService.rateEquipment(userId, req.params.id, req.body.rating);
		res.json({ data: result });
	} catch (err) {
		if (err.message === 'Rating must be between 1 and 5') {
			return res.status(400).json({ error: err.message });
		}
		console.error('RATE EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to rate equipment' });
	}
};

const favouriteEquipment = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'No user found' });
		const result = await equipmentService.favouriteEquipment(userId, req.params.id);
		res.json({ data: result });
	} catch (err) {
		console.error('FAVOURITE EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to favourite equipment' });
	}
};

const removeFavouriteEquipment = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'No user found' });
		const result = await equipmentService.removeFavouriteEquipment(userId, req.params.id);
		res.json({ data: result });
	} catch (err) {
		console.error('REMOVE FAVOURITE ERROR:', err);
		res.status(500).json({ error: 'Failed to remove favourite' });
	}
};

const updateWeightStack = async (req, res) => {
	try {
		const submittedBy = req.user?.id || null;
		const { weight_stack } = req.body;
		const value = weight_stack === null ? null : parseInt(weight_stack, 10);
		if (value !== null && (isNaN(value) || value <= 0)) {
			return res.status(400).json({ error: 'Invalid weight stack value' });
		}
		const result = await equipmentService.updateWeightStack(req.params.id, value, submittedBy);
		if (!result) return res.status(404).json({ error: 'Equipment not found or not pin loaded' });
		if (submittedBy) {
			try {
				await createNotification(submittedBy, 'submission_received', req.params.id, 'Your weight stack update is under review');
			} catch (notifyErr) {
				console.error('WEIGHT STACK NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: result });
	} catch (err) {
		console.error('UPDATE WEIGHT STACK ERROR:', err);
		res.status(500).json({ error: 'Failed to update weight stack' });
	}
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// exercises.id is a uuid. Returns null for "no exercise", undefined for malformed.
const parseExerciseId = (value) => {
	if (value === null || value === undefined || value === '') return null;
	return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
};

const updateExerciseMapping = async (req, res) => {
	try {
		const { exercise_id, secondary_exercise_id } = req.body;
		const exerciseId = parseExerciseId(exercise_id);
		const secondaryExerciseId = parseExerciseId(secondary_exercise_id);
		if (exerciseId === undefined || secondaryExerciseId === undefined) {
			return res.status(400).json({ error: 'Invalid exercise id' });
		}

		const isSuperAdmin = req.user?.role === 'super_admin';
		const submittedBy = req.user?.id || null;

		const result = await equipmentService.updateExerciseMapping(
			req.params.id,
			exerciseId,
			secondaryExerciseId,
			isSuperAdmin,
			submittedBy
		);
		if (!result) return res.status(404).json({ error: 'Equipment not found' });

		if (!isSuperAdmin && submittedBy) {
			try {
				await createNotification(
					submittedBy,
					'submission_received',
					req.params.id,
					'Your exercise mapping change is under review'
				);
			} catch (notifyErr) {
				console.error('EXERCISE MAPPING NOTIFICATION ERROR:', notifyErr);
			}
		}

		res.json({ data: { id: result.id, review: isSuperAdmin ? 'approved' : 'pending' } });
	} catch (err) {
		if (/must differ|without a primary/.test(err.message)) {
			return res.status(400).json({ error: err.message });
		}
		console.error('UPDATE EXERCISE MAPPING ERROR:', err);
		res.status(500).json({ error: 'Failed to update exercise mapping' });
	}
};

const getVariants = async (req, res) => {
	try {
		const variants = await equipmentService.getVariants(req.params.id);
		res.json({ data: variants });
	} catch (err) {
		console.error('GET VARIANTS ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch variants' });
	}
};

const createVariant = async (req, res) => {
	try {
		const createdBy = req.user?.id || null;
		const { label, variation_type, is_default } = req.body;
		const variant = await equipmentService.createVariant(
			req.params.id,
			label,
			variation_type,
			is_default,
			createdBy
		);
		if (createdBy) {
			try {
				await createNotification(createdBy, 'submission_received', req.params.id, 'Your variant submission is under review');
			} catch (notifyErr) {
				console.error('VARIANT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.status(201).json({ data: variant });
	} catch (err) {
		if (
			err.message === 'label and variation_type are required' ||
			err.message === 'Invalid variation_type'
		) {
			return res.status(400).json({ error: err.message });
		}
		console.error('CREATE VARIANT ERROR:', err);
		res.status(500).json({ error: 'Failed to create variant' });
	}
};

const deleteVariant = async (req, res) => {
	try {
		const result = await equipmentService.deleteVariant(req.params.variantId);
		if (!result) return res.status(404).json({ error: 'Variant not found' });
		res.json({ data: result });
	} catch (err) {
		console.error('DELETE VARIANT ERROR:', err);
		res.status(500).json({ error: 'Failed to delete variant' });
	}
};

module.exports = {
	getAllEquipment,
	getEquipmentById,
	createEquipment,
	getGymsWithEquipment,
	searchEquipment,
	getBrands,
	getSeriesByBrand,
	checkDuplicate,
	uploadEquipmentImage,
	rateEquipment,
	favouriteEquipment,
	removeFavouriteEquipment,
	updateWeightStack,
	updateExerciseMapping,
	getVariants,
	createVariant,
	deleteVariant
};
