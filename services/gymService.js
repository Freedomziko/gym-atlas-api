const gymRepo = require('../repositories/gymRepository');

const getGyms = async (userId = null) => {
	return await gymRepo.getGyms(userId);
};

const getGymById = async (id, userId = null) => {
	const [gym, freeWeights] = await Promise.all([
		gymRepo.getGymById(id, userId),
		gymRepo.getFreeWeights(id)
	]);
	if (!gym) throw new Error('Gym not found');
	return { ...gym, free_weights: freeWeights };
};

const createGym = async (
	name,
	latitude,
	longitude,
	address,
	city,
	country,
	instagram,
	createdBy = null
) => {
	if (!name) throw new Error('Name is required');
	return await gymRepo.createGym(
		name,
		latitude,
		longitude,
		address,
		city,
		country,
		instagram,
		createdBy
	);
};

const getGymEquipment = async (gymId) => {
	return await gymRepo.getGymEquipment(gymId);
};

const uploadGymImage = async (id, fileBuffer, mimeType, userId = null) => {
	if (!fileBuffer) throw new Error('No image provided');
	return await gymRepo.uploadGymImage(id, fileBuffer, mimeType, userId);
};

// Normalises a submitted Instagram handle (strips a leading @ and any URL
// wrapping) before staging it for review.
const updateInstagram = async (id, instagram, submittedBy = null) => {
	const handle = String(instagram || '')
		.trim()
		.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
		.replace(/^@/, '')
		.replace(/\/+$/, '')
		.split(/[/?]/)[0];
	if (!handle) throw new Error('Instagram handle is required');
	if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new Error('Invalid Instagram handle');
	return await gymRepo.updateInstagram(id, handle, submittedBy);
};

const toCount = (value, field) => {
	const number = Number(value ?? 0);
	if (!Number.isInteger(number) || number < 0 || number > 999) {
		throw new Error(`${field} must be a whole number between 0 and 999`);
	}
	return number;
};

const toOptionalKg = (value, field) => {
	if (value === null || value === undefined || value === '') return null;
	const number = Number(value);
	if (!Number.isInteger(number) || number < 0 || number > 999) {
		throw new Error(`${field} must be a whole number between 0 and 999`);
	}
	return number;
};

const normaliseFreeWeights = (body = {}) => {
	const values = {
		dumbbell_min_kg: toOptionalKg(body.dumbbell_min_kg, 'dumbbell_min_kg'),
		dumbbell_max_kg: toOptionalKg(body.dumbbell_max_kg, 'dumbbell_max_kg'),
		dumbbell_racks: toCount(body.dumbbell_racks, 'dumbbell_racks'),
		squat_racks: toCount(body.squat_racks, 'squat_racks'),
		flat_benches: toCount(body.flat_benches, 'flat_benches'),
		incline_benches: toCount(body.incline_benches, 'incline_benches'),
		platforms: toCount(body.platforms, 'platforms'),
		preacher_curl_stations: toCount(body.preacher_curl_stations, 'preacher_curl_stations')
	};
	if (
		values.dumbbell_min_kg !== null &&
		values.dumbbell_max_kg !== null &&
		values.dumbbell_max_kg < values.dumbbell_min_kg
	) {
		throw new Error('dumbbell_max_kg must be greater than or equal to dumbbell_min_kg');
	}
	return values;
};

const submitFreeWeights = async (gymId, body, submittedBy = null) => {
	const parsedGymId = Number(gymId);
	if (!Number.isInteger(parsedGymId) || parsedGymId <= 0) throw new Error('Gym not found');
	const values = normaliseFreeWeights(body);
	const suggestion = await gymRepo.submitFreeWeights(parsedGymId, values, submittedBy);
	if (!suggestion) throw new Error('Gym not found');
	return suggestion;
};

const addGymEquipment = async (gymId, equipmentId, quantity, notes, status, createdBy) => {
	return await gymRepo.addGymEquipment(gymId, equipmentId, quantity, notes, status, createdBy);
};

const getGymStats = async () => {
	return await gymRepo.getGymStats();
};

const getTickerSample = async () => {
	return await gymRepo.getTickerSample();
};

// Decrement quantity if > 1, otherwise delete the row entirely
const removeGymEquipment = async (gymId, equipmentId) => {
	const dec = await gymRepo.decrementGymEquipment(gymId, equipmentId);
	if (dec) return { row: dec, action: 'decremented' };

	const del = await gymRepo.deleteGymEquipment(gymId, equipmentId);
	if (del) return { row: del, action: 'deleted' };

	return null;
};

const rateGym = async (userId, gymId, rating) => {
	if (!rating || rating < 1 || rating > 5) {
		throw new Error('Rating must be between 1 and 5');
	}
	return await gymRepo.rateGym(userId, gymId, rating);
};

const favouriteGym = async (userId, gymId) => {
	return await gymRepo.favouriteGym(userId, gymId);
};

const removeFavouriteGym = async (userId, gymId) => {
	return await gymRepo.removeFavouriteGym(userId, gymId);
};

const getFavouriteGyms = async (userId) => {
	return await gymRepo.getFavouriteGyms(userId);
};

const searchGymsByMachines = async (filters) => {
	if (!filters || filters.length === 0) return await gymRepo.getGyms();
	return await gymRepo.searchGymsByMachines(filters);
};

const searchGymsByBrand = async (brandId) => {
	if (!brandId) return await gymRepo.getGyms();
	return await gymRepo.searchGymsByBrand(brandId);
};

module.exports = {
	getGyms,
	getGymById,
	createGym,
	getGymEquipment,
	updateInstagram,
	uploadGymImage,
	submitFreeWeights,
	addGymEquipment,
	getGymStats,
	getTickerSample,
	removeGymEquipment,
	rateGym,
	favouriteGym,
	removeFavouriteGym,
	getFavouriteGyms,
	searchGymsByMachines,
	searchGymsByBrand
};
