const pool = require('../db');
const supabase = require('../config/supabase');

const PROFILE_CACHE_TTL_MS = 60_000;
const profileCache = new Map();

const invalidateProfileCache = (userId) => profileCache.delete(userId);

const getProfile = async (userId) => {
	const cached = profileCache.get(userId);
	if (cached && cached.expiresAt > Date.now()) return cached;

	const { rows } = await pool.query(
		'SELECT username, role FROM profiles WHERE id = $1',
		[userId]
	);
	const entry = {
		username: rows[0]?.username ?? '',
		role: rows[0]?.role ?? 'user',
		expiresAt: Date.now() + PROFILE_CACHE_TTL_MS
	};
	profileCache.set(userId, entry);
	return entry;
};

const verifyToken = async (token) => {
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data?.user) throw new Error('Invalid token');
	return data.user;
};

const authMiddleware = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({ error: 'No token' });

	const token = authHeader.split(' ')[1];
	let supabaseUser;
	try {
		supabaseUser = await verifyToken(token);
	} catch {
		return res.status(401).json({ error: 'Invalid token' });
	}

	const profile = await getProfile(supabaseUser.id);

	req.user = {
		id: supabaseUser.id,
		email: supabaseUser.email,
		username: profile.username,
		role: profile.role
	};

	next();
};

const optionalAuth = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return next();

	const token = authHeader.split(' ')[1];
	let supabaseUser;
	try {
		supabaseUser = await verifyToken(token);
	} catch {
		return next();
	}

	const profile = await getProfile(supabaseUser.id);
	req.user = {
		id: supabaseUser.id,
		email: supabaseUser.email,
		username: profile.username,
		role: profile.role
	};

	next();
};

const adminMiddleware = (req, res, next) => {
	if (!req.user) return res.status(401).json({ error: 'Unauthorised' });
	if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
		return res.status(403).json({ error: 'Forbidden' });
	}
	next();
};

const superAdminMiddleware = (req, res, next) => {
	if (!req.user) return res.status(401).json({ error: 'Unauthorised' });
	if (req.user.role !== 'super_admin') {
		return res.status(403).json({ error: 'Forbidden' });
	}
	next();
};

module.exports = { authMiddleware, optionalAuth, adminMiddleware, superAdminMiddleware, invalidateProfileCache };
