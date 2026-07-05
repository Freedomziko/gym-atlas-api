const { DataType, newDb } = require('pg-mem');
const equipmentData = require('./seed-data/equipment.json');
const gymsData = require('./seed-data/gyms.json');

const db = newDb({ autoCreateForeignKeyIndices: true });

db.public.registerFunction({
	name: 'round',
	args: [DataType.float, DataType.integer],
	returns: DataType.float,
	implementation: (value, places) => {
		if (value === null || value === undefined) return null;
		const factor = 10 ** places;
		return Math.round(Number(value) * factor) / factor;
	}
});

db.public.registerFunction({
	name: 'round',
	args: [DataType.integer, DataType.integer],
	returns: DataType.float,
	implementation: (value, places) => {
		if (value === null || value === undefined) return null;
		const factor = 10 ** places;
		return Math.round(Number(value) * factor) / factor;
	}
});

db.public.none(`
	CREATE TABLE profiles (
		id uuid PRIMARY KEY,
		email text NOT NULL UNIQUE,
		username varchar(50) UNIQUE,
		role text NOT NULL DEFAULT 'user',
		created_at timestamp DEFAULT now()
	);

	CREATE TABLE brands (
		id serial PRIMARY KEY,
		name text NOT NULL UNIQUE,
		slug text NOT NULL UNIQUE,
		logo_url text,
		created_at timestamp DEFAULT now()
	);

	CREATE TABLE exercises (
		id serial PRIMARY KEY,
		name text NOT NULL,
		category text NOT NULL DEFAULT 'machine'
	);

	CREATE TABLE equipment (
		id serial PRIMARY KEY,
		brand text NOT NULL,
		brand_id integer REFERENCES brands(id),
		name text NOT NULL,
		slug text NOT NULL UNIQUE,
		type text,
		created_at timestamp DEFAULT now(),
		series text,
		exercise_id integer,
		secondary_exercise_id integer,
		image_url text,
		status text NOT NULL DEFAULT 'approved',
		created_by uuid,
		resistance_profile text DEFAULT 'constant',
		resistance_curve jsonb,
		pending_image_url text,
		photo_status text,
		photo_uploaded_by uuid,
		photo_uploaded_at timestamp,
		weight_stack integer,
		pending_weight_stack integer,
		weight_stack_status text,
		weight_stack_submitted_by uuid
	);

	CREATE TABLE gyms (
		id serial PRIMARY KEY,
		name text NOT NULL,
		slug text NOT NULL UNIQUE,
		address text,
		city text,
		country text,
		latitude double precision,
		longitude double precision,
		opening_hours jsonb,
		hours_updated_at timestamp,
		created_at timestamp DEFAULT now(),
		instagram varchar(255),
		pending_instagram text,
		instagram_status text,
		instagram_submitted_by uuid,
		image_url text,
		status text NOT NULL DEFAULT 'approved',
		created_by uuid,
		pending_image_url text,
		photo_status text,
		photo_uploaded_by uuid,
		photo_uploaded_at timestamp
	);

	CREATE TABLE gym_equipment (
		id serial PRIMARY KEY,
		gym_id integer NOT NULL,
		equipment_id integer NOT NULL,
		quantity integer DEFAULT 1,
		notes text,
		created_at timestamp DEFAULT now(),
		status text DEFAULT 'approved',
		created_by uuid,
		UNIQUE (gym_id, equipment_id)
	);

	CREATE TABLE equipment_variants (
		id serial PRIMARY KEY,
		equipment_id integer NOT NULL,
		label text NOT NULL,
		variation_type text NOT NULL,
		is_default boolean DEFAULT false,
		status text DEFAULT 'approved',
		created_by uuid,
		created_at timestamp DEFAULT now()
	);

	CREATE TABLE equipment_favourites (
		user_id uuid,
		equipment_id integer NOT NULL,
		created_at timestamp DEFAULT now(),
		UNIQUE (user_id, equipment_id)
	);

	CREATE TABLE equipment_ratings (
		user_id uuid,
		equipment_id integer NOT NULL,
		rating integer,
		created_at timestamp DEFAULT now(),
		UNIQUE (user_id, equipment_id)
	);

	CREATE TABLE gym_favourites (
		user_id uuid,
		gym_id integer NOT NULL,
		created_at timestamp DEFAULT now()
	);

	CREATE TABLE gym_ratings (
		user_id uuid,
		gym_id integer NOT NULL,
		rating integer,
		created_at timestamp DEFAULT now()
	);

	CREATE TABLE equipment_categories (
		id serial PRIMARY KEY,
		name text NOT NULL,
		slug text NOT NULL UNIQUE,
		type text NOT NULL
	);

	CREATE TABLE user_best_in_class (
		id serial PRIMARY KEY,
		user_id uuid,
		category_id integer,
		equipment_id integer,
		created_at timestamp DEFAULT now(),
		UNIQUE (user_id, category_id)
	);

	CREATE TABLE notifications (
		id serial PRIMARY KEY,
		user_id uuid,
		type text NOT NULL,
		message text NOT NULL,
		related_id integer,
		read boolean DEFAULT false,
		created_at timestamp DEFAULT now()
	);
`);

const { Pool } = db.adapters.createPg();
const pool = new Pool();
const query = pool.query.bind(pool);
const devUserId = process.env.DEV_AUTH_USER_ID || 'b2c3a47c-582a-4a6e-9015-eb9ff2e40e2f';
const slugify = (value) =>
	value
		.toLowerCase()
		.replace(/[\/\\]/g, '-')
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
const orderedEquipmentData = [...equipmentData].sort((a, b) => {
	if (a.slug === 'matrix-aura-chest-press') return -1;
	if (b.slug === 'matrix-aura-chest-press') return 1;
	return 0;
});

const ready = (async () => {
	await query(
		`INSERT INTO profiles (id, email, username, role)
		 VALUES ($1, $2, $3, 'admin')
		 ON CONFLICT (id) DO UPDATE SET role = 'admin'`,
		[devUserId, process.env.DEV_AUTH_EMAIL || 'local-admin@gymatlas.local', process.env.DEV_AUTH_USERNAME || 'notty']
	);

	const brandIds = new Map();
	for (const brand of [...new Set(orderedEquipmentData.map((item) => item.brand).filter(Boolean))]) {
		const result = await query(
			`INSERT INTO brands (name, slug)
			 VALUES ($1, $2)
			 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			 RETURNING id`,
			[brand, slugify(brand)]
		);
		brandIds.set(brand, result.rows[0].id);
	}

	for (const name of [...new Set(orderedEquipmentData.map((item) => item.name).filter(Boolean))]) {
		await query(
			`INSERT INTO exercises (name, category)
			 VALUES ($1, 'machine')`,
			[name]
		);
	}

	for (const item of orderedEquipmentData) {
		await query(
			`INSERT INTO equipment (brand, brand_id, series, name, slug, type, image_url, status, resistance_profile)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'constant')
			 ON CONFLICT (slug) DO NOTHING`,
			[
				item.brand,
				brandIds.get(item.brand) || null,
				item.series || null,
				item.name,
				item.slug,
				item.type,
				item.image_url || null,
				item.status || 'approved'
			]
		);
	}

	for (const gym of gymsData) {
		await query(
			`INSERT INTO gyms (name, slug, address, city, country, latitude, longitude, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
			 ON CONFLICT (slug) DO NOTHING`,
			[
				gym.name,
				gym.slug,
				gym.address || null,
				gym.city || null,
				gym.country || null,
				gym.latitude || null,
				gym.longitude || null
			]
		);
	}

	const gyms = await query('SELECT id FROM gyms ORDER BY id LIMIT 4');
	const equipment = await query('SELECT id FROM equipment ORDER BY id LIMIT 8');
	for (const gym of gyms.rows) {
		for (const item of equipment.rows.slice(0, 4)) {
			await query(
				`INSERT INTO gym_equipment (gym_id, equipment_id, quantity, status)
				 VALUES ($1, $2, 1, 'approved')
				 ON CONFLICT (gym_id, equipment_id) DO NOTHING`,
				[gym.id, item.id]
			);
		}
	}

	await query(
		`INSERT INTO equipment_ratings (user_id, equipment_id, rating)
		 VALUES ($1, 1, 3), ($1, 4, 4)
		 ON CONFLICT (user_id, equipment_id) DO UPDATE SET rating = EXCLUDED.rating`,
		[devUserId]
	);
})();

pool.query = (...args) => ready.then(() => query(...args));

module.exports = pool;
