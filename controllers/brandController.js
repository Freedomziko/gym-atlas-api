const brandService = require('../services/brandService');

const getBrands = async (req, res) => {
	try {
		const brands = await brandService.getBrands();
		res.json({ data: brands });
	} catch (err) {
		console.error('GET BRANDS ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch brands' });
	}
};

const getSeriesByBrand = async (req, res) => {
	try {
		const series = await brandService.getSeriesByBrandId(parseInt(req.params.id, 10));
		res.json({ data: series });
	} catch (err) {
		if (err.message === 'brandId is required') {
			return res.status(400).json({ error: err.message });
		}
		console.error('GET SERIES BY BRAND ERROR:', err);
		res.status(500).json({ error: 'Failed to fetch series' });
	}
};

const createBrand = async (req, res) => {
	try {
		const { name } = req.body;
		const brand = await brandService.createBrand(name);
		res.status(201).json({ data: brand });
	} catch (err) {
		if (err.message === 'name is required') {
			return res.status(400).json({ error: err.message });
		}
		console.error('CREATE BRAND ERROR:', err);
		res.status(500).json({ error: 'Failed to create brand' });
	}
};

const uploadBrandLogo = async (req, res) => {
	try {
		const brand = await brandService.uploadBrandLogo(
			parseInt(req.params.id, 10),
			req.file?.buffer,
			req.file?.mimetype
		);
		res.json({ data: brand });
	} catch (err) {
		if (err.message === 'No image provided') {
			return res.status(400).json({ error: err.message });
		}
		if (err.message === 'Brand not found') {
			return res.status(404).json({ error: err.message });
		}
		console.error('BRAND LOGO UPLOAD ERROR:', err);
		res.status(500).json({ error: 'Failed to upload logo' });
	}
};

module.exports = { getBrands, getSeriesByBrand, createBrand, uploadBrandLogo };
