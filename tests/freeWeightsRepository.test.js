const mockClient = {
	query: jest.fn(),
	release: jest.fn()
};
const mockPoolQuery = jest.fn();
const mockPoolConnect = jest.fn();

jest.mock('../db', () => ({
	query: mockPoolQuery,
	connect: mockPoolConnect
}));

const adminRepo = require('../repositories/adminRepository');

describe('free weights approval repository', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPoolConnect.mockResolvedValue(mockClient);
	});

	it('commits the review status and live gym values together', async () => {
		mockClient.query
			.mockResolvedValueOnce({})
			.mockResolvedValueOnce({
				rows: [{
					id: 4,
					gym_id: 15,
					dumbbell_min_kg: 2,
					dumbbell_max_kg: 50,
					dumbbell_racks: 2,
					squat_racks: 4,
					flat_benches: 6,
					incline_benches: 2,
					platforms: 2,
					preacher_curl_stations: 1,
					submitted_by: 'submitter-id'
				}]
			})
			.mockResolvedValueOnce({ rows: [{ gym_id: 15, verified: true }] })
			.mockResolvedValueOnce({});

		await expect(adminRepo.approveFreeWeights(4, 'admin-id')).resolves.toEqual({
			gym_id: 15,
			verified: true,
			submitted_by: 'submitter-id'
		});
		expect(mockClient.query.mock.calls.map(([sql]) => sql.trim().split(/\s+/)[0])).toEqual([
			'BEGIN',
			'UPDATE',
			'INSERT',
			'COMMIT'
		]);
		expect(mockClient.release).toHaveBeenCalledTimes(1);
	});

	it('rolls back when writing the approved values fails', async () => {
		mockClient.query
			.mockResolvedValueOnce({})
			.mockResolvedValueOnce({
				rows: [{
					id: 4,
					gym_id: 15,
					dumbbell_min_kg: 2,
					dumbbell_max_kg: 50,
					dumbbell_racks: 2,
					squat_racks: 4,
					flat_benches: 6,
					incline_benches: 2,
					platforms: 2,
					preacher_curl_stations: 1,
					submitted_by: 'submitter-id'
				}]
			})
			.mockRejectedValueOnce(new Error('write failed'))
			.mockResolvedValueOnce({});

		await expect(adminRepo.approveFreeWeights(4, 'admin-id')).rejects.toThrow('write failed');
		expect(mockClient.query).toHaveBeenLastCalledWith('ROLLBACK');
		expect(mockClient.release).toHaveBeenCalledTimes(1);
	});
});
