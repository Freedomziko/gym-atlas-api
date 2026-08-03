jest.mock('../middleware/auth', () => ({
	authMiddleware: (req, res, next) => {
		if (!req.headers.authorization) return res.status(401).json({ error: 'No token' });
		req.user = {
			id: 'current-user-id',
			email: 'current@example.com',
			role: req.headers['x-test-role'] || 'user'
		};
		next();
	},
	optionalAuth: (_req, _res, next) => next(),
	adminMiddleware: (req, res, next) => {
		if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
			return res.status(403).json({ error: 'Forbidden' });
		}
		next();
	},
	superAdminMiddleware: (_req, _res, next) => next(),
	invalidateProfileCache: jest.fn()
}));

jest.mock('../services/gymService', () => ({
	submitFreeWeights: jest.fn()
}));

jest.mock('../services/adminService', () => ({
	approveFreeWeights: jest.fn(),
	rejectFreeWeights: jest.fn()
}));

jest.mock('../services/notificationService', () => ({
	createNotification: jest.fn()
}));

const request = require('supertest');
const app = require('../app');
const gymService = require('../services/gymService');
const adminService = require('../services/adminService');
const { createNotification } = require('../services/notificationService');

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

describe('free weights routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('requires authentication to submit an update', async () => {
		const res = await request(app).patch('/gyms/15/free-weights').send(validInput);

		expect(res.statusCode).toBe(401);
		expect(gymService.submitFreeWeights).not.toHaveBeenCalled();
	});

	it('submits an authenticated update for review', async () => {
		gymService.submitFreeWeights.mockResolvedValue({ id: 4, gym_id: 15, status: 'pending' });

		const res = await request(app)
			.patch('/gyms/15/free-weights')
			.set('Authorization', 'Bearer test-token')
			.send(validInput);

		expect(res.statusCode).toBe(201);
		expect(res.body.data).toMatchObject({ id: 4, gym_id: 15, status: 'pending' });
		expect(gymService.submitFreeWeights).toHaveBeenCalledWith('15', validInput, 'current-user-id');
		expect(createNotification).toHaveBeenCalledWith(
			'current-user-id',
			'submission_received',
			'15',
			'Your free weights update is under review'
		);
	});

	it('keeps approval routes admin-only', async () => {
		const res = await request(app)
			.post('/admin/approve/free-weights/4')
			.set('Authorization', 'Bearer test-token');

		expect(res.statusCode).toBe(403);
		expect(adminService.approveFreeWeights).not.toHaveBeenCalled();
	});

	it('lets an admin approve a pending update', async () => {
		adminService.approveFreeWeights.mockResolvedValue({
			gym_id: 15,
			submitted_by: 'submitter-id',
			verified: true
		});

		const res = await request(app)
			.post('/admin/approve/free-weights/4')
			.set('Authorization', 'Bearer test-token')
			.set('X-Test-Role', 'admin');

		expect(res.statusCode).toBe(200);
		expect(adminService.approveFreeWeights).toHaveBeenCalledWith('4', 'current-user-id');
		expect(createNotification).toHaveBeenCalledWith(
			'submitter-id',
			'gym_approved',
			15,
			'Your free weights update was approved'
		);
	});
});
