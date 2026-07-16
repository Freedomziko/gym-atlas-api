const gymService = require('../services/gymService');
const gymRepo = require('../repositories/gymRepository');
const pool = require('../db');
const { createNotification } = require('../routes/notificationsRoutes');

const getGyms = async (req, res) => {
	try {
		const userId = req.user?.id || null;
		const gyms = await gymService.getGyms(userId);
		res.json({ data: gyms });
	} catch (err) {
		console.error('getGyms error:', err); 
		res.status(500).json({ error: 'Failed to fetch gyms' });
	}
};

// GET /gyms/:id/equipment
const getGymEquipment = async (req, res) => {
	try {
		const gymId = req.params.id;
		const data = await gymService.getGymEquipment(gymId);

		res.json({ data });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to fetch gym equipment' });
	}
};

// POST gym
const createGym = async (req, res) => {
	try {
		const { name, latitude, longitude, address, city, country, instagram } = req.body;
		if (!name) return res.status(400).json({ error: 'Name is required' });
		const createdBy = req.user?.id || null; 
		const gym = await gymRepo.createGym(
			name,
			latitude,
			longitude,
			address,
			city,
			country,
			instagram,
			createdBy
		);
		if (createdBy) {
			try {
				await createNotification(pool, createdBy, 'submission_received', gym.id, 'Your gym submission is under review');
			} catch (notifyErr) {
				console.error('GYM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.status(201).json({ data: gym });
	} catch (err) {
		console.error('CREATE GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to create gym' });
	}
};

// PATCH /gyms/:id/instagram — suggest an Instagram handle for admin review
const updateInstagram = async (req, res) => {
	try {
		const submittedBy = req.user?.id || null;
		const { instagram } = req.body;
		const result = await gymService.updateInstagram(req.params.id, instagram, submittedBy);
		if (!result) return res.status(404).json({ error: 'Gym not found' });
		if (submittedBy) {
			try {
				await createNotification(pool, submittedBy, 'submission_received', req.params.id, 'Your gym Instagram suggestion is under review');
			} catch (notifyErr) {
				console.error('GYM INSTAGRAM NOTIFICATION ERROR:', notifyErr);
			}
		}
		res.json({ data: result });
	} catch (err) {
		if (err.message === 'Instagram handle is required' || err.message === 'Invalid Instagram handle') {
			return res.status(400).json({ error: err.message });
		}
		console.error('UPDATE GYM INSTAGRAM ERROR:', err);
		res.status(500).json({ error: 'Failed to update Instagram' });
	}
};

// POST /gyms/:gymId/equipment
const addGymEquipment = async (req, res) => {
	try {
		const { gymId } = req.params;
		const { equipment_id, quantity, notes } = req.body;
		const isSuperAdmin = req.user?.role === 'super_admin';
		const status = isSuperAdmin ? 'approved' : 'pending';
		const createdBy = req.user?.id || null;

		const result = await gymService.addGymEquipment(
			gymId,
			equipment_id,
			quantity,
			notes,
			status,
			createdBy
		);
		res.json({ data: result });
	} catch (err) {
		console.error('POST ERROR:', err);
		res.status(500).json({ error: 'Failed to add gym equipment' });
	}
};

// GET /gyms/stats
const getGymStats = async (req, res) => {
	try {
		const stats = await gymService.getGymStats();

		res.json({ data: stats });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'failed to fetch gym stats' });
	}
};

// DELETE /gyms/:gymId/equipment/:equipmentId
const removeGymEquipment = async (req, res) => {
	try {
		const { gymId, equipmentId } = req.params;

		const result = await gymService.removeGymEquipment(Number(gymId), Number(equipmentId));

		if (!result) {
			return res.status(404).json({ error: 'Equipment not found in gym' });
		}

		return res.json({ data: result.row });
	} catch (err) {
		console.error('DELETE ERROR:', err);
		res.status(500).json({ error: 'Failed to remove equipment' });
	}
};

const getGymById = async (req, res) => {
	const userId = req.user?.id || null;
	const gym = await gymRepo.getGymById(req.params.id, userId);
	if (!gym) return res.status(404).json({ error: 'Gym not found' });
	res.json({ data: gym });
};
const rateGym = async (req, res) => {
	try {
		const { id } = req.params;
		const { rating } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: 'No user found' });
		}

		if (!rating || rating < 1 || rating > 5) {
			return res.status(400).json({ error: 'Rating must be between 1 and 5' });
		}

		const result = await gymService.rateGym(userId, id, rating);
		res.json({ data: result });
	} catch (err) {
		console.error('RATE GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to rate gym' });
	}
};

const favouriteGym = async (req, res) => {
	try {
		const gymId = req.params.id;

		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: 'No user found' });
		}

		const result = await gymService.favouriteGym(userId, gymId);

		res.json({ data: result });
	} catch (err) {
		console.error('FAVOURITE GYM ERROR:', err);
		res.status(500).json({ error: 'Failed to favourite gym' });
	}
};

const getFavouriteGyms = async (req, res) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: 'No user found' });
		}

		const favouriteGyms = await gymService.getFavouriteGyms(userId);

		res.json({ data: favouriteGyms });
	} catch (err) {
		console.error('GET FAVOURITE GYMS ERROR:', err);
		res.status(500).json({ error: 'Failed to get favourites' });
	}
};

const removeFavouriteGym = async (req, res) => {
	try {
		const gymId = req.params.id;

		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: 'No user found' });
		}

		const result = await gymService.removeFavouriteGym(userId, gymId);
		res.json({ data: result });
	} catch (err) {
		console.error('REMOVE FAVOURITE ERROR:', err);
		res.status(500).json({ error: 'Failed to remove favourite' });
	}
};
const searchGyms = async (req, res) => {
	try {
		const { machines, brand_id } = req.body;

		const gyms = brand_id
			? await gymService.searchGymsByBrand(brand_id)
			: await gymService.searchGymsByMachines(machines);

		res.json({ data: gyms });
	} catch (err) {
		console.error('SEARCH GYMS ERROR:', err);
		res.status(500).json({ error: 'Failed to search gyms' });
	}
};

module.exports = {
	getGyms,
	getGymById,
	getGymEquipment,
	addGymEquipment,
	getGymStats,
	removeGymEquipment,
	createGym,
	updateInstagram,
	rateGym,
	favouriteGym,
	removeFavouriteGym,
	searchGyms,
	getFavouriteGyms
};
