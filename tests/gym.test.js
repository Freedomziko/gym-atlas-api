const request = require('supertest');
const app = require('../app');
const pool = require('../db');

afterAll(async () => {
	await pool.end();
});

describe('GET /gyms', () => {
	it('returns 200 and an array', async () => {
		const res = await request(app).get('/gyms');
		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});

describe('GET /gyms/stats', () => {
	it('returns 200 and a data array', async () => {
		const res = await request(app).get('/gyms/stats');
		expect(res.statusCode).toBe(200);
		expect(res.body).toHaveProperty('data');
		expect(Array.isArray(res.body.data)).toBe(true);
	});
});

describe('POST /gyms (auth required)', () => {
	it('returns 401 when no token provided', async () => {
		const res = await request(app)
			.post('/gyms')
			.send({ name: 'Test Gym', latitude: 55.95, longitude: -3.18 });
		expect(res.statusCode).toBe(401);
	});
});

describe('POST /gyms/:id/rate (auth required)', () => {
	it('returns 401 when no token provided', async () => {
		const res = await request(app).post('/gyms/1/rate').send({ rating: 4 });
		expect(res.statusCode).toBe(401);
	});
});

describe('POST /gyms/:id/favourite (auth required)', () => {
	it('returns 401 when no token provided', async () => {
		const res = await request(app).post('/gyms/1/favourite');
		expect(res.statusCode).toBe(401);
	});
});

describe('DELETE /gyms/:id/favourite (auth required)', () => {
	it('returns 401 when no token provided', async () => {
		const res = await request(app).delete('/gyms/1/favourite');
		expect(res.statusCode).toBe(401);
	});
});

describe('GET /gyms/:id', () => {
	it('returns 404 for a non-existent gym', async () => {
		const res = await request(app).get('/gyms/999999');
		expect(res.statusCode).toBe(404);
	});
});
