const pendingMethods = [
	'getPendingGyms',
	'getPendingEquipment',
	'getPendingSuggestions',
	'getPendingPhotos',
	'getPendingGymPhotos',
	'getPendingVariants',
	'getPendingWeightStacks',
	'getPendingGymInstagrams',
	'getPendingExerciseChanges',
	'getPendingFreeWeights'
];

jest.mock('../repositories/adminRepository', () => ({
	getPendingGyms: jest.fn(),
	getPendingEquipment: jest.fn(),
	getPendingSuggestions: jest.fn(),
	getPendingPhotos: jest.fn(),
	getPendingGymPhotos: jest.fn(),
	getPendingVariants: jest.fn(),
	getPendingWeightStacks: jest.fn(),
	getPendingGymInstagrams: jest.fn(),
	getPendingExerciseChanges: jest.fn(),
	getPendingFreeWeights: jest.fn(),
	approveFreeWeights: jest.fn(),
	rejectFreeWeights: jest.fn()
}));

const adminService = require('../services/adminService');
const adminRepo = require('../repositories/adminRepository');

describe('free weights admin service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		pendingMethods.forEach((method) => adminRepo[method].mockResolvedValue([]));
	});

	it('includes free weight suggestions in the pending payload', async () => {
		const freeWeights = [{ id: 4, gym_id: 15 }];
		adminRepo.getPendingFreeWeights.mockResolvedValue(freeWeights);

		await expect(adminService.getPendingSubmissions()).resolves.toMatchObject({ freeWeights });
	});

	it('passes the reviewing admin to an approval', async () => {
		adminRepo.approveFreeWeights.mockResolvedValue({ gym_id: 15, verified: true });

		await expect(adminService.approveFreeWeights(4, 'admin-id')).resolves.toMatchObject({
			gym_id: 15,
			verified: true
		});
		expect(adminRepo.approveFreeWeights).toHaveBeenCalledWith(4, 'admin-id');
	});
});
