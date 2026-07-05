const pool = require('../db');
const { uploadToAzure } = require('../config/azureStorage');

const getBrands = async () => {
	const result = await pool.query(`
		SELECT b.id, b.name, b.slug, b.logo_url,
		       COUNT(e.id)::int AS equipment_count
		FROM brands b
		LEFT JOIN equipment e ON e.brand_id = b.id AND e.status = 'approved'
		GROUP BY b.id, b.name, b.slug, b.logo_url
		ORDER BY b.name ASC
	`);
	return result.rows;
};

const getBrandById = async (id) => {
	const result = await pool.query(`SELECT * FROM brands WHERE id = $1`, [id]);
	return result.rows[0] || null;
};

const getSeriesByBrandId = async (brandId) => {
	const result = await pool.query(
		`SELECT series AS name, COUNT(*)::int AS equipment_count
		FROM equipment
		WHERE brand_id = $1
		AND series IS NOT NULL
		AND status = 'approved'
		GROUP BY series
		ORDER BY series ASC`,
		[brandId]
	);
	return result.rows;
};

const createBrand = async (name, slug) => {
	const result = await pool.query(
		`INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING *`,
		[name, slug]
	);
	return result.rows[0];
};

const uploadBrandLogo = async (id, fileBuffer, mimeType) => {
	const url = await uploadToAzure(fileBuffer, mimeType, 'brands');
	const result = await pool.query(
		`UPDATE brands SET logo_url = $1 WHERE id = $2 RETURNING *`,
		[url, id]
	);
	return result.rows[0];
};

module.exports = { getBrands, getBrandById, getSeriesByBrandId, createBrand, uploadBrandLogo };
