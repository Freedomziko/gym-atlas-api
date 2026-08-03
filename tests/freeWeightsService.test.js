jest.mock('../repositories/gymRepository', () => ({
	getGymById: jest.fn(),
	getFreeWeights: jest.fn(),
	submitFreeWeights: jest.fn()
}));

const gymService = require('../services/gymService');
const gymRepo = require('../repositories/gymRepository');

const validInput = {
	dumbbell_min_kg: 2,
	dumbbell_max_kg: 50,
	dumbbell_racks: 2,
	squat_racks: 4,
	flat_benches: 6,
	incline_benches: 2,
	platforms: 2,
	preacher_curl_stations: 1
};

describe('gym free weights service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('includes approved free weights in a gym response', async () => {
		gymRepo.getGymById.mockResolvedValue({ id: 15, name: 'Test Gym' });
		gymRepo.getFreeWeights.mockResolvedValue({ gym_id: 15, squat_racks: 4 });

		await expect(gymService.getGymById(15)).resolves.toEqual({
			id: 15,
			name: 'Test Gym',
			free_weights: { gym_id: 15, squat_racks: 4 }
		});
	});

	it('normalises and submits valid counts for the authenticated user', async () => {
		gymRepo.submitFreeWeights.mockResolvedValue({ id: 8, gym_id: 15, status: 'pending' });

		await expect(gymService.submitFreeWeights('15', validInput, 'user-1')).resolves.toMatchObject({
			id: 8,
			status: 'pending'
		});
		expect(gymRepo.submitFreeWeights).toHaveBeenCalledWith(15, validInput, 'user-1');
	});

	it('rejects negative or fractional counts before querying the database', async () => {
		await expect(
			gymService.submitFreeWeights(15, { ...validInput, squat_racks: -1 }, 'user-1')
		).rejects.toThrow('squat_racks must be a whole number between 0 and 999');
		await expect(
			gymService.submitFreeWeights(15, { ...validInput, flat_benches: 1.5 }, 'user-1')
		).rejects.toThrow('flat_benches must be a whole number between 0 and 999');
		expect(gymRepo.submitFreeWeights).not.toHaveBeenCalled();
	});

	it('rejects a reversed dumbbell range', async () => {
		await expect(
			gymService.submitFreeWeights(
				15,
				{ ...validInput, dumbbell_min_kg: 50, dumbbell_max_kg: 2 },
				'user-1'
			)
		).rejects.toThrow('dumbbell_max_kg must be greater than or equal to dumbbell_min_kg');
	});

	it('reports a missing gym when the insert-select returns no row', async () => {
		gymRepo.submitFreeWeights.mockResolvedValue(null);

		await expect(gymService.submitFreeWeights(999999, validInput, 'user-1')).rejects.toThrow('Gym not found');
	});
});
