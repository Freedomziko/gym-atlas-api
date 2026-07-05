const brandRepo = require('../repositories/brandRepository');

const toSlug = (str) =>
	str
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

const getBrands = async () => brandRepo.getBrands();

const getSeriesByBrandId = async (brandId) => {
	if (!brandId) throw new Error('brandId is required');
	return brandRepo.getSeriesByBrandId(brandId);
};

const createBrand = async (name) => {
	if (!name || !name.trim()) throw new Error('name is required');
	const slug = toSlug(name.trim());
	return brandRepo.createBrand(name.trim(), slug);
};

const uploadBrandLogo = async (id, fileBuffer, mimeType) => {
	if (!fileBuffer) throw new Error('No image provided');
	const brand = await brandRepo.getBrandById(id);
	if (!brand) throw new Error('Brand not found');
	return brandRepo.uploadBrandLogo(id, fileBuffer, mimeType);
};

module.exports = { getBrands, getSeriesByBrandId, createBrand, uploadBrandLogo };
