jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../config/cloudinary', () => ({ uploadToCloudinary: jest.fn() }));
jest.mock('../config/supabase', () => ({
	auth: { getUser: jest.fn() }
}));

const express = require('express');
const request = require('supertest');
const pool = require('../db');
const supabase = require('../config/supabase');
const { invalidateProfileCache } = require('../middleware/auth');
const repo = require('../repositories/equipmentRepository');
const service = require('../services/equipmentService');
const app = express();
app.use(express.json());
app.use('/admin', require('../routes/adminRoutes'));
app.use('/equipment', require('../routes/equipmentRoutes'));

beforeEach(() => {
	jest.clearAllMocks();
	invalidateProfileCache('admin-test');
	supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-test' } } });
	pool.query.mockImplementation(async (sql, values) => {
		if (sql.includes('SELECT username, role')) return { rows: [{ username: 'tester', role: 'admin' }] };
		if (sql.includes('UPDATE equipment')) return { rows: [{ id: 1, resistance_profile: values[5], resistance_curve: values[6] }] };
		return { rows: [] };
	});
});

const details = { brand: 'Matrix', series: 'Aura', name: 'Press', type: 'pin_loaded' };

test('admin endpoint saves a custom curve through the current controller and repository', async () => {
	const response = await request(app).patch('/admin/equipment/1')
		.set('Authorization', 'Bearer test').send({ ...details, resistance_profile: 'custom', resistance_curve: [1, 2, 3] });
	expect(response.status).toBe(200);
	expect(response.body.data.resistance_profile).toBe('custom');
	expect(JSON.parse(response.body.data.resistance_curve)).toEqual([1, 2, 3]);
	expect(pool.query.mock.calls.filter(([sql]) => sql.includes('UPDATE equipment'))).toHaveLength(1);
});

test('admin endpoint clears a custom curve when selecting a standard profile', async () => {
	const response = await request(app).patch('/admin/equipment/1')
		.set('Authorization', 'Bearer test').send({ ...details, resistance_profile: 'ascending', resistance_curve: [1, 2] });
	expect(response.status).toBe(200);
	expect(response.body.data.resistance_curve).toBeNull();
});

test('admin endpoint still requires authentication', async () => {
	expect((await request(app).patch('/admin/equipment/1').send(details)).status).toBe(401);
	expect(pool.query).not.toHaveBeenCalled();
});

test('ordinary users cannot edit equipment', async () => {
	pool.query.mockResolvedValue({ rows: [{ username: 'tester', role: 'user' }] });
	expect((await request(app).patch('/admin/equipment/1').set('Authorization', 'Bearer test').send(details)).status).toBe(403);
});

test.each([
	{ resistance_profile: 'invented' },
	{ resistance_profile: 'custom', resistance_curve: 'bad' },
	{ resistance_profile: 'custom', resistance_curve: [1, '2'] }
])('rejects invalid resistance data: %j', async fields => {
	const response = await request(app).patch('/admin/equipment/1')
		.set('Authorization', 'Bearer test').send({ ...details, ...fields });
	expect(response.status).toBe(400);
	expect(pool.query.mock.calls.some(([sql]) => sql.includes('UPDATE equipment'))).toBe(false);
});

test('equipment creation passes profile and curve to the insert', async () => {
	await service.createEquipment('Matrix', 'Aura', 'Press', 'pin_loaded', null, null, null, null, 'custom', [1, 2]);
	const [sql, values] = pool.query.mock.calls[0];
	expect(sql).toContain('resistance_profile, resistance_curve');
	expect(values.slice(-2)).toEqual(['custom', '[1,2]']);
});

test('existing create callers retain the constant default', async () => {
	await service.createEquipment('Matrix', null, 'Press', 'pin_loaded');
	expect(pool.query.mock.calls[0][1].slice(-2)).toEqual(['constant', null]);
});

test.each([repo.getAllEquipment, repo.getEquipmentById])('equipment reads select resistance fields and retain exercise/category joins', async read => {
	await read(1);
	const sql = pool.query.mock.calls[0][0];
	expect(sql).toContain('e.resistance_profile, e.resistance_curve');
	expect(sql).toContain('AS secondary_exercise');
	expect(sql).toContain('LEFT JOIN equipment_categories');
	expect(sql).toContain('AS variants');
});

test('exercise mapping review still stages admin edits', async () => {
	await service.updateExerciseMapping(1, 'primary', null, false, 'admin-test');
	expect(pool.query.mock.calls[0][0]).toContain('pending_exercise_id = $1');
	expect(pool.query.mock.calls[0][1]).toEqual(['primary', null, 'admin-test', 1]);
});

test('super admin exercise mapping still applies directly', async () => {
	await service.updateExerciseMapping(1, 'primary', null, true);
	expect(pool.query.mock.calls[0][0]).toContain('pending_exercise_id = NULL');
	expect(pool.query.mock.calls[0][1]).toEqual(['primary', null, 1]);
});
