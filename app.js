const express = require('express');
const cors = require('cors');

// Route imports
const adminRoutes = require('./routes/adminRoutes');
const gymRoutes = require('./routes/gymRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const userRoutes = require('./routes/userRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const { router: notificationsRoutes } = require('./routes/notificationsRoutes');
const bestInClassRoutes = require('./routes/bestInClassRoutes');
const brandRoutes = require('./routes/brandRoutes');
const exercisesRoutes = require('./routes/exercisesRoutes');

const app = express();

// CORS configuration
const corsOptions = {
	origin: function(origin, callback) {
	  const allowed = process.env.CORS_ORIGIN?.split(',') || [];
	  if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
		callback(null, true);
	  } else {
		callback(new Error('Not allowed by CORS'));
	  }
	}
  };

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check for Render cold-start polling
app.get('/health', (_req, res) => res.json({ ok: true }));

// Route definitions
app.use('/admin', adminRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/gyms', gymRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/best-in-class', bestInClassRoutes);
app.use('/brands', brandRoutes);
app.use('/exercises', exercisesRoutes);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
