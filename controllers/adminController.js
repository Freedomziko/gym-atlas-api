const adminService = require('../services/adminService');
const equipmentService = require('../services/equipmentService');
const { createNotification } = require('../services/notificationService');

const getUsers = async (req, res) => {
	try {
		const users = await adminService.getAllUsers();
		res.json({ data: users });
	} catch (err) {
		console.error('GET USERS ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
};

const getPending = async (req, res) => {
	try {
		const data = await adminService.getPendingSubmissions();
		res.json({ data });
	} catch (err) {
		console.error('GET PENDING ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch pending submissions' });
	}
};

const approveGym = async (req, res) => {
	try {
		const gym = await adminService.approveGym(req.params.id);
		if (gym.created_by) {
			try {
				await createNotification(gym.created_by, 'gym_approved', gym.id, 'Your gym submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE GYM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		if (err.message === 'Gym not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to approve gym' });
	}
};

const rejectGym = async (req, res) => {
	try {
		const gym = await adminService.rejectGym(req.params.id);
		if (gym.created_by) {
			try {
				await createNotification(gym.created_by, 'gym_rejected', gym.id, 'Your gym submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT GYM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		if (err.message === 'Gym not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to reject gym' });
	}
};

const approveSuggestion = async (req, res) => {
	try {
		const sugg = await adminService.approveSuggestion(req.params.id);
		if (sugg.created_by) {
			try {
				await createNotification(sugg.created_by, 'suggestion_approved', sugg.id, 'Your equipment suggestion was approved!');
			} catch (notifyErr) {
				console.error('APPROVE SUGGESTION NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: sugg });
	} catch (err) {
		if (err.message === 'Suggestion not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE SUGGESTION ERROR:', err);
		res.status(500).json({ error: 'Failed to approve suggestion' });
	}
};

const rejectSuggestion = async (req, res) => {
	try {
		const suggestion = await adminService.rejectSuggestion(req.params.id);
		res.json({ data: suggestion });
	} catch (err) {
		if (err.message === 'Suggestion not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT SUGGESTION ERROR:', err);
		res.status(500).json({ error: 'Failed to reject suggestion' });
	}
};

const approveEquipment = async (req, res) => {
	try {
		const eq = await adminService.approveEquipment(req.params.id);
		if (eq.created_by) {
			try {
				await createNotification(eq.created_by, 'equipment_approved', eq.id, 'Your equipment submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE EQUIPMENT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		if (err.message === 'Equipment not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to approve equipment' });
	}
};

const rejectEquipment = async (req, res) => {
	try {
		const equipment = await adminService.rejectEquipment(req.params.id);
		if (equipment.created_by) {
			try {
				await createNotification(equipment.created_by, 'equipment_rejected', equipment.id, 'Your equipment submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT EQUIPMENT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: equipment });
	} catch (err) {
		if (err.message === 'Equipment not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to reject equipment' });
	}
};

const approvePhoto = async (req, res) => {
	try {
		const eq = await adminService.approvePhoto(req.params.id);
		if (eq.photo_uploaded_by) {
			try {
				await createNotification(eq.photo_uploaded_by, 'equipment_approved', eq.id, 'Your photo submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		if (err.message === 'Equipment not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to approve photo' });
	}
};

const rejectPhoto = async (req, res) => {
	try {
		const eq = await adminService.rejectPhoto(req.params.id);
		if (eq.photo_uploaded_by) {
			try {
				await createNotification(eq.photo_uploaded_by, 'equipment_rejected', eq.id, 'Your photo submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		if (err.message === 'Equipment not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to reject photo' });
	}
};

const approveGymPhoto = async (req, res) => {
	try {
		const gym = await adminService.approveGymPhoto(req.params.id);
		if (gym.photo_uploaded_by) {
			try {
				await createNotification(gym.photo_uploaded_by, 'gym_approved', gym.id, 'Your gym photo was approved');
			} catch (notifyErr) {
				console.error('APPROVE GYM PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		if (err.message === 'Gym not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE GYM PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to approve gym photo' });
	}
};

const rejectGymPhoto = async (req, res) => {
	try {
		const gym = await adminService.rejectGymPhoto(req.params.id);
		if (gym.photo_uploaded_by) {
			try {
				await createNotification(gym.photo_uploaded_by, 'gym_rejected', gym.id, 'Your gym photo was not approved');
			} catch (notifyErr) {
				console.error('REJECT GYM PHOTO NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		if (err.message === 'Gym not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT GYM PHOTO ERROR:', err);
		res.status(500).json({ error: 'Failed to reject gym photo' });
	}
};

const approveVariant = async (req, res) => {
	try {
		const variant = await adminService.approveVariant(req.params.id);
		if (variant.created_by) {
			try {
				await createNotification(variant.created_by, 'equipment_approved', variant.equipment_id, 'Your variant submission was approved');
			} catch (notifyErr) {
				console.error('APPROVE VARIANT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: variant });
	} catch (err) {
		if (err.message === 'Variant not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE VARIANT ERROR:', err);
		res.status(500).json({ error: 'Failed to approve variant' });
	}
};

const rejectVariant = async (req, res) => {
	try {
		const variant = await adminService.rejectVariant(req.params.id);
		if (variant.created_by) {
			try {
				await createNotification(variant.created_by, 'equipment_rejected', variant.equipment_id, 'Your variant submission was not approved');
			} catch (notifyErr) {
				console.error('REJECT VARIANT NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: variant });
	} catch (err) {
		if (err.message === 'Variant not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT VARIANT ERROR:', err);
		res.status(500).json({ error: 'Failed to reject variant' });
	}
};

const approveWeightStack = async (req, res) => {
	try {
		const eq = await adminService.approveWeightStack(req.params.id);
		if (eq.weight_stack_submitted_by) {
			try {
				await createNotification(eq.weight_stack_submitted_by, 'equipment_approved', eq.id, 'Your weight stack update was approved');
			} catch (notifyErr) {
				console.error('APPROVE WEIGHT STACK NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		if (err.message === 'Pending weight stack not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE WEIGHT STACK ERROR:', err);
		res.status(500).json({ error: 'Failed to approve weight stack' });
	}
};

const rejectWeightStack = async (req, res) => {
	try {
		const eq = await adminService.rejectWeightStack(req.params.id);
		if (eq.weight_stack_submitted_by) {
			try {
				await createNotification(eq.weight_stack_submitted_by, 'equipment_rejected', eq.id, 'Your weight stack update was not approved');
			} catch (notifyErr) {
				console.error('REJECT WEIGHT STACK NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: eq });
	} catch (err) {
		if (err.message === 'Pending weight stack not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT WEIGHT STACK ERROR:', err);
		res.status(500).json({ error: 'Failed to reject weight stack' });
	}
};

const updateEquipment = async (req, res) => {
	try {
		const { brand, series, name, type, resistance_profile, resistance_curve } = req.body;
		const equipment = await equipmentService.updateEquipment(req.params.id, {
			brand,
			series: series || null,
			name,
			type,
			resistanceProfile: resistance_profile || null,
			resistanceCurve: resistance_profile === 'custom' ? resistance_curve : null
		});
		if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
		res.json({ data: equipment });
	} catch (err) {
		if (/required|Invalid/.test(err.message)) {
			return res.status(400).json({ error: err.message });
		}
		// slug is unique, so renaming onto another machine's identity collides
		if (err.code === '23505') {
			return res.status(409).json({ error: 'Another machine already has that brand, series and name' });
		}
		console.error('UPDATE EQUIPMENT ERROR:', err);
		res.status(500).json({ error: 'Failed to update equipment' });
	}
};

const approveExerciseChange = async (req, res) => {
	try {
		const equipment = await adminService.approveExerciseChange(req.params.id);
		if (equipment.exercise_submitted_by) {
			try {
				await createNotification(equipment.exercise_submitted_by, 'equipment_approved', equipment.id, 'Your exercise mapping change was approved');
			} catch (notifyErr) {
				console.error('APPROVE EXERCISE CHANGE NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: equipment });
	} catch (err) {
		if (err.message === 'Pending exercise change not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE EXERCISE CHANGE ERROR:', err);
		res.status(500).json({ error: 'Failed to approve exercise change' });
	}
};

const rejectExerciseChange = async (req, res) => {
	try {
		const equipment = await adminService.rejectExerciseChange(req.params.id);
		if (equipment.exercise_submitted_by) {
			try {
				await createNotification(equipment.exercise_submitted_by, 'equipment_rejected', equipment.id, 'Your exercise mapping change was rejected');
			} catch (notifyErr) {
				console.error('REJECT EXERCISE CHANGE NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: equipment });
	} catch (err) {
		if (err.message === 'Pending exercise change not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT EXERCISE CHANGE ERROR:', err);
		res.status(500).json({ error: 'Failed to reject exercise change' });
	}
};

const approveGymInstagram = async (req, res) => {
	try {
		const gym = await adminService.approveGymInstagram(req.params.id);
		if (gym.instagram_submitted_by) {
			try {
				await createNotification(gym.instagram_submitted_by, 'gym_approved', gym.id, 'Your gym Instagram suggestion was approved');
			} catch (notifyErr) {
				console.error('APPROVE GYM INSTAGRAM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		if (err.message === 'Pending Instagram not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE GYM INSTAGRAM ERROR:', err);
		res.status(500).json({ error: 'Failed to approve Instagram' });
	}
};

const rejectGymInstagram = async (req, res) => {
	try {
		const gym = await adminService.rejectGymInstagram(req.params.id);
		if (gym.instagram_submitted_by) {
			try {
				await createNotification(gym.instagram_submitted_by, 'gym_rejected', gym.id, 'Your gym Instagram suggestion was not approved');
			} catch (notifyErr) {
				console.error('REJECT GYM INSTAGRAM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: gym });
	} catch (err) {
		if (err.message === 'Pending Instagram not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT GYM INSTAGRAM ERROR:', err);
		res.status(500).json({ error: 'Failed to reject Instagram' });
	}
};

const approveFreeWeights = async (req, res) => {
	try {
		const freeWeights = await adminService.approveFreeWeights(req.params.id, req.user.id);
		if (freeWeights.submitted_by) {
			try {
				await createNotification(freeWeights.submitted_by, 'gym_approved', freeWeights.gym_id, 'Your free weights update was approved');
			} catch (notifyErr) {
				console.error('APPROVE FREE WEIGHTS NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: freeWeights });
	} catch (err) {
		if (err.message === 'Pending free weights update not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('APPROVE FREE WEIGHTS ERROR:', err);
		res.status(500).json({ error: 'Failed to approve free weights update' });
	}
};

const rejectFreeWeights = async (req, res) => {
	try {
		const freeWeights = await adminService.rejectFreeWeights(req.params.id);
		if (freeWeights.submitted_by) {
			try {
				await createNotification(freeWeights.submitted_by, 'gym_rejected', freeWeights.gym_id, 'Your free weights update was not approved');
			} catch (notifyErr) {
				console.error('REJECT FREE WEIGHTS NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: freeWeights });
	} catch (err) {
		if (err.message === 'Pending free weights update not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('REJECT FREE WEIGHTS ERROR:', err);
		res.status(500).json({ error: 'Failed to reject free weights update' });
	}
};

const makeAdmin = async (req, res) => {
	try {
		const user = await adminService.makeAdmin(req.params.userId);
		res.json({ data: user });
	} catch (err) {
		if (err.message === 'User not found or not a plain user') {
			return res.status(404).json({ error: err.message });
		}
		console.error('MAKE ADMIN ERROR:', err);
		res.status(500).json({ error: 'Failed to update role' });
	}
};

const promoteSuper = async (req, res) => {
	try {
		const user = await adminService.promoteSuper(req.params.userId);
		res.json({ data: user });
	} catch (err) {
		if (err.message === 'User not found or not an admin') {
			return res.status(404).json({ error: err.message });
		}
		console.error('PROMOTE SUPER ERROR:', err);
		res.status(500).json({ error: 'Failed to update role' });
	}
};

const demote = async (req, res) => {
	try {
		const { userId } = req.params;
		const result = await adminService.demote(req.user.id, userId);
		res.json({ data: result });
	} catch (err) {
		if (err.message === 'User not found') {
			return res.status(404).json({ error: err.message });
		}
		if (err.message === 'User is already at the lowest role') {
			return res.status(400).json({ error: err.message });
		}
		if (err.message === 'Only the owner can demote a super admin' || err.message === 'The owner cannot be demoted') {
			return res.status(403).json({ error: err.message });
		}
		console.error('DEMOTE ERROR:', err);
		res.status(500).json({ error: 'Failed to update role' });
	}
};

module.exports = {
	getUsers,
	getPending,
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
	approveFreeWeights,
	rejectFreeWeights,
	updateEquipment,
	approveExerciseChange,
	rejectExerciseChange,
	makeAdmin,
	promoteSuper,
	demote
};
