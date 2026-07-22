const gymRepo = require('../repositories/gymRepository');

const getGyms = async (userId = null) => {
	return await gymRepo.getGyms(userId);
};

const getGymById = async (id, userId = null) => {
	const gym = await gymRepo.getGymById(id, userId);
	if (!gym) throw new Error('Gym not found');
	return gym;
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
