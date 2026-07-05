const equipmentRepo = require('../repositories/equipmentRepository');

const getAllEquipment = async (userId = null) => {
	return await equipmentRepo.getAllEquipment(userId);
};

const getEquipmentById = async (id, userId = null) => {
	const equipment = await equipmentRepo.getEquipmentById(id, userId);
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
};

const EQUIPMENT_TYPES = ['pin_loaded', 'plate_loaded'];
const RESISTANCE_PROFILES = ['constant', 'ascending', 'descending', 'adjustable', 'custom'];

const validateEquipmentDetails = ({ brand, series, name, type, resistance_profile, resistance_curve }) => {
	if (!brand || !name) throw new Error('brand and name are required');
	if (type && !EQUIPMENT_TYPES.includes(type)) throw new Error('Invalid equipment type');
	if (resistance_profile && !RESISTANCE_PROFILES.includes(resistance_profile)) {
		throw new Error('Invalid resistance profile');
	}
	if (resistance_curve !== undefined && resistance_curve !== null) {
		if (!Array.isArray(resistance_curve) || resistance_curve.some((value) => typeof value !== 'number')) {
			throw new Error('Invalid resistance curve');
		}
	}
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
	validateEquipmentDetails({
		brand,
		series,
		name,
		type: type || 'pin_loaded',
		resistance_profile: resistanceProfile,
		resistance_curve: resistanceCurve
	});
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
		resistanceCurve
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

const updateEquipmentDetails = async (id, fields) => {
	validateEquipmentDetails(fields);
	const equipment = await equipmentRepo.updateEquipmentDetails(id, {
		brand: fields.brand.trim(),
		series: fields.series?.trim() || null,
		name: fields.name.trim(),
		type: fields.type,
		resistance_profile: fields.resistance_profile || 'constant',
		resistance_curve: fields.resistance_profile === 'custom' ? fields.resistance_curve || null : null
	});
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
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
	updateEquipmentDetails,
	getVariants,
	createVariant,
	deleteVariant
};
