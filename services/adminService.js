const adminRepo = require('../repositories/adminRepository');
const { invalidateProfileCache } = require('../middleware/auth');

const getAllUsers = async () => {
	return await adminRepo.getAllUsers();
};

const getPendingSubmissions = async () => {
	const [
		gyms,
		equipment,
		suggestions,
		photos,
		gymPhotos,
		variants,
		weightStacks,
		gymInstagrams,
		exerciseChanges
	] = await Promise.all([
		adminRepo.getPendingGyms(),
		adminRepo.getPendingEquipment(),
		adminRepo.getPendingSuggestions(),
		adminRepo.getPendingPhotos(),
		adminRepo.getPendingGymPhotos(),
		adminRepo.getPendingVariants(),
		adminRepo.getPendingWeightStacks(),
		adminRepo.getPendingGymInstagrams(),
		adminRepo.getPendingExerciseChanges()
	]);
	return {
		gyms,
		equipment,
		suggestions,
		photos,
		gymPhotos,
		variants,
		weightStacks,
		gymInstagrams,
		exerciseChanges
	};
};

const approveGym = async (id) => {
	const gym = await adminRepo.approveGym(id);
	if (!gym) throw new Error('Gym not found');
	return gym;
};

const rejectGym = async (id) => {
	const gym = await adminRepo.rejectGym(id);
	if (!gym) throw new Error('Gym not found');
	return gym;
};

const approveSuggestion = async (id) => {
	const suggestion = await adminRepo.approveSuggestion(id);
	if (!suggestion) throw new Error('Suggestion not found');
	return suggestion;
};

const rejectSuggestion = async (id) => {
	const suggestion = await adminRepo.rejectSuggestion(id);
	if (!suggestion) throw new Error('Suggestion not found');
	return suggestion;
};

const approveEquipment = async (id) => {
	const equipment = await adminRepo.approveEquipment(id);
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
};

const rejectEquipment = async (id) => {
	const equipment = await adminRepo.rejectEquipment(id);
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
};

const approvePhoto = async (id) => {
	const equipment = await adminRepo.approvePhoto(id);
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
};

const rejectPhoto = async (id) => {
	const equipment = await adminRepo.rejectPhoto(id);
	if (!equipment) throw new Error('Equipment not found');
	return equipment;
};

const approveGymPhoto = async (id) => {
	const gym = await adminRepo.approveGymPhoto(id);
	if (!gym) throw new Error('Gym not found');
	return gym;
};

const rejectGymPhoto = async (id) => {
	const gym = await adminRepo.rejectGymPhoto(id);
	if (!gym) throw new Error('Gym not found');
	return gym;
};

const approveVariant = async (id) => {
	const variant = await adminRepo.approveVariant(id);
	if (!variant) throw new Error('Variant not found');
	return variant;
};

const rejectVariant = async (id) => {
	const variant = await adminRepo.rejectVariant(id);
	if (!variant) throw new Error('Variant not found');
	return variant;
};

const approveWeightStack = async (id) => {
	const equipment = await adminRepo.approveWeightStack(id);
	if (!equipment) throw new Error('Pending weight stack not found');
	return equipment;
};

const rejectWeightStack = async (id) => {
	const equipment = await adminRepo.rejectWeightStack(id);
	if (!equipment) throw new Error('Pending weight stack not found');
	return equipment;
};

const approveExerciseChange = async (id) => {
	const equipment = await adminRepo.approveExerciseChange(id);
	if (!equipment) throw new Error('Pending exercise change not found');
	return equipment;
};

const rejectExerciseChange = async (id) => {
	const equipment = await adminRepo.rejectExerciseChange(id);
	if (!equipment) throw new Error('Pending exercise change not found');
	return equipment;
};

const approveGymInstagram = async (id) => {
	const gym = await adminRepo.approveGymInstagram(id);
	if (!gym) throw new Error('Pending Instagram not found');
	return gym;
};

const rejectGymInstagram = async (id) => {
	const gym = await adminRepo.rejectGymInstagram(id);
	if (!gym) throw new Error('Pending Instagram not found');
	return gym;
};

const makeAdmin = async (userId) => {
	const user = await adminRepo.promoteToAdmin(userId);
	if (!user) throw new Error('User not found or not a plain user');
	invalidateProfileCache(userId);
	return user;
};

const promoteSuper = async (userId) => {
	const user = await adminRepo.promoteToSuperAdmin(userId);
	if (!user) throw new Error('User not found or not an admin');
	invalidateProfileCache(userId);
	return user;
};

// admin -> user for anyone; super_admin -> admin only when the caller is the root owner (OWNER_USER_ID)
const demote = async (callerId, userId) => {
	const ownerId = process.env.OWNER_USER_ID;

	const target = await adminRepo.getUserRole(userId);
	if (!target) throw new Error('User not found');

	if (target.role === 'user') {
		throw new Error('User is already at the lowest role');
	}

	let newRole;
	if (target.role === 'super_admin') {
		if (!ownerId || callerId !== ownerId) {
			throw new Error('Only the owner can demote a super admin');
		}
		if (userId === ownerId) {
			throw new Error('The owner cannot be demoted');
		}
		newRole = 'admin';
	} else {
		newRole = 'user';
	}

	const updated = await adminRepo.updateUserRole(userId, newRole);
	invalidateProfileCache(userId);
	return updated;
};

module.exports = {
	getAllUsers,
	getPendingSubmissions,
	approveGym,
	rejectGym,
	approveSuggestion,
	rejectSuggestion,
	approveEquipment,
	rejectEquipment,
	approvePhoto,
	rejectPhoto,
	approveGymPhoto,
	rejectGymPhoto,
	approveVariant,
	rejectVariant,
	approveWeightStack,
	rejectWeightStack,
	approveGymInstagram,
	rejectGymInstagram,
	approveExerciseChange,
	rejectExerciseChange,
	makeAdmin,
	promoteSuper,
	demote
};
