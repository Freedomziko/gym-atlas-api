jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../middleware/auth', () => ({
	authMiddleware: (req, res, next) => {
		if (!req.headers.authorization) return res.status(401).json({ error: 'No token' });
		req.user = { id: 'current-user-id', email: 'current@example.com', role: 'user' };
		next();
	},
	optionalAuth: (_req, _res, next) => next(),
	adminMiddleware: (_req, _res, next) => next(),
	superAdminMiddleware: (_req, _res, next) => next(),
	invalidateProfileCache: jest.fn()
}));

const request = require('supertest');
const app = require('../app');
const pool = require('../db');
const { invalidateProfileCache } = require('../middleware/auth');

describe('PATCH /users/me/username', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('requires authentication', async () => {
		const res = await request(app).patch('/users/me/username').send({ username: 'new_name' });

		expect(res.statusCode).toBe(401);
	});

	it('rejects an invalid username before querying the database', async () => {
		const res = await request(app)
			.patch('/users/me/username')
			.set('Authorization', 'Bearer test-token')
			.send({ username: 'no spaces' });

		expect(res.statusCode).toBe(400);
		expect(pool.query).not.toHaveBeenCalled();
	});

	it('updates only the authenticated user and clears the profile cache', async () => {
		pool.query.mockResolvedValue({
			rows: [
				{
					id: 'current-user-id',
					username: 'new_name',
					email: 'current@example.com',
					role: 'user',
					created_at: '2026-01-01T00:00:00.000Z'
				}
			]
		});

		const res = await request(app)
			.patch('/users/me/username')
			.set('Authorization', 'Bearer test-token')
			.send({ username: 'new_name' });

		expect(res.statusCode).toBe(200);
		expect(res.body.data.username).toBe('new_name');
		expect(pool.query).toHaveBeenCalledWith(
			expect.stringContaining('UPDATE profiles'),
			['new_name', 'current-user-id']
		);
		expect(invalidateProfileCache).toHaveBeenCalledWith('current-user-id');
	});

	it('reports a duplicate username cleanly', async () => {
		pool.query.mockRejectedValue({ code: '23505' });

		const res = await request(app)
			.patch('/users/me/username')
			.set('Authorization', 'Bearer test-token')
			.send({ username: 'taken_name' });

		expect(res.statusCode).toBe(409);
		expect(res.body.error).toBe('Username already taken');
	});
});
