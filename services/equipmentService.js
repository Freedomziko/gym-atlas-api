const equipmentRepo = require('../repositories/equipmentRepository');

const getAllEquipment = async (userId = null) => {
	return await equipmentRepo.getAllEquipment(userId);
};

const getEquipmentById = async (id, userId = null) => {
	const equipment = await equipmentRepo.getEquipmentById(id, userId);
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
};

const createEquipment = async (
	brand,
	series,
	name,
	type,
	createdBy = null,
	brandId = null,
	exerciseId = null,
	secondaryExerciseId = null,
	resistanceProfile = 'constant',
	resistanceCurve = null
) => {
	if (!brand || !name) throw new Error('brand and name are required');
	validateResistance(resistanceProfile, resistanceCurve);
	return await equipmentRepo.createEquipment(
		brand,
		series || null,
		name,
		type || null,
		createdBy,
		brandId,
		exerciseId,
		secondaryExerciseId,
		resistanceProfile,
		resistanceProfile === 'custom' ? resistanceCurve : null
	);
};

const getGymsWithEquipment = async (slug) => {
	const equipment = await equipmentRepo.getEquipmentBySlug(slug);
	if (!equipment) throw new Error('Equipment not found');
	const gyms = await equipmentRepo.getGymsByEquipmentSlug(slug);
	return { equipment, gyms };
};

const searchEquipment = async (query) => {
	if (!query) return [];
	return await equipmentRepo.searchEquipmentByName(query);
};

const getBrands = async () => {
	return await equipmentRepo.getBrands();
};

const getSeriesByBrand = async (brand) => {
	if (!brand) throw new Error('brand is required');
	return await equipmentRepo.getSeriesByBrand(brand);
};

const checkDuplicate = async (brandId, series, name) => {
	if (!brandId || !name) throw new Error('brandId and name are required');
	return await equipmentRepo.checkDuplicate(brandId, series || null, name);
};

const uploadEquipmentImage = async (id, fileBuffer, mimeType, userId = null) => {
	if (!fileBuffer) throw new Error('No image provided');
	return await equipmentRepo.uploadEquipmentImage(id, fileBuffer, mimeType, userId);
};

const rateEquipment = async (userId, equipmentId, rating) => {
	if (!rating || rating < 1 || rating > 5) {
		throw new Error('Rating must be between 1 and 5');
	}
	return await equipmentRepo.rateEquipment(userId, equipmentId, rating);
};

const favouriteEquipment = async (userId, equipmentId) => {
	return await equipmentRepo.favouriteEquipment(userId, equipmentId);
};

const removeFavouriteEquipment = async (userId, equipmentId) => {
	return await equipmentRepo.removeFavouriteEquipment(userId, equipmentId);
};

const updateWeightStack = async (id, weightStack, submittedBy = null) => {
	return await equipmentRepo.updateWeightStack(id, weightStack, submittedBy);
};

const RESISTANCE_PROFILES = ['constant', 'ascending', 'descending', 'adjustable', 'custom'];

const validateResistance = (profile, curve) => {
	if (profile != null && !RESISTANCE_PROFILES.includes(profile)) {
		throw new Error('Invalid resistance_profile');
	}
	if (curve != null && (!Array.isArray(curve) || curve.some(value => !Number.isFinite(value)))) {
		throw new Error('Invalid resistance_curve');
	}
};

const updateEquipment = async (id, fields) => {
	const { brand, name, type, resistanceProfile } = fields;
	if (!brand || !name) throw new Error('brand and name are required');
	if (type && !['pin_loaded', 'plate_loaded'].includes(type)) {
		throw new Error('Invalid type');
	}
	validateResistance(resistanceProfile, fields.resistanceCurve);
	return await equipmentRepo.updateEquipment(id, fields);
};

// Admins may retarget a machine's exercise mapping, but only a super admin's
// edit lands live — everyone else's is staged for confirmation.
const updateExerciseMapping = async (id, exerciseId, secondaryExerciseId, applyDirectly, submittedBy = null) => {
	if (secondaryExerciseId !== null && exerciseId === null) {
		throw new Error('Cannot set a secondary exercise without a primary');
	}
	if (exerciseId !== null && exerciseId === secondaryExerciseId) {
		throw new Error('Primary and secondary exercise must differ');
	}
	return applyDirectly
		? await equipmentRepo.applyExerciseMapping(id, exerciseId, secondaryExerciseId)
		: await equipmentRepo.stageExerciseMapping(id, exerciseId, secondaryExerciseId, submittedBy);
};

const VARIATION_TYPES = ['grip', 'unilateral', 'incline'];

const getVariants = async (equipmentId) => {
	return await equipmentRepo.getVariantsByEquipmentId(equipmentId);
};

const createVariant = async (equipmentId, label, variationType, isDefault = false, createdBy = null) => {
	if (!label || !variationType) {
		throw new Error('label and variation_type are required');
	}
	if (!VARIATION_TYPES.includes(variationType)) {
		throw new Error('Invalid variation_type');
	}
	return await equipmentRepo.createVariant(equipmentId, label, variationType, Boolean(isDefault), createdBy);
};

const deleteVariant = async (variantId) => {
	return await equipmentRepo.deleteVariant(variantId);
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
	updateEquipment,
	updateExerciseMapping,
	getVariants,
	createVariant,
	deleteVariant
};
