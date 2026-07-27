const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware, superAdminMiddleware } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /admin/users — super_admin only
router.get('/users', superAdminMiddleware, adminController.getUsers);

// GET /admin/pending — all pending submissions
router.get('/pending', adminController.getPending);

router.post('/approve/gym/:id', adminController.approveGym);
router.post('/reject/gym/:id', adminController.rejectGym);

router.post('/approve/suggestion/:id', adminController.approveSuggestion);
router.post('/reject/suggestion/:id', adminController.rejectSuggestion);

router.post('/approve/equipment/:id', adminController.approveEquipment);
router.post('/reject/equipment/:id', adminController.rejectEquipment);

router.post('/approve/photo/:id', adminController.approvePhoto);
router.post('/reject/photo/:id', adminController.rejectPhoto);

router.post('/approve/gym-photo/:id', adminController.approveGymPhoto);
router.post('/reject/gym-photo/:id', adminController.rejectGymPhoto);

router.post('/approve/variant/:id', adminController.approveVariant);
router.post('/reject/variant/:id', adminController.rejectVariant);

router.post('/approve/weight-stack/:id', adminController.approveWeightStack);
router.post('/reject/weight-stack/:id', adminController.rejectWeightStack);

router.post('/approve/gym-instagram/:id', adminController.approveGymInstagram);
router.post('/reject/gym-instagram/:id', adminController.rejectGymInstagram);

// Exercise mapping changes — super_admin only; admins may propose but not confirm
router.post('/approve/exercise-change/:id', superAdminMiddleware, adminController.approveExerciseChange);
router.post('/reject/exercise-change/:id', superAdminMiddleware, adminController.rejectExerciseChange);

// POST /admin/make-admin/:userId — super_admin only; promotes a user → admin
router.post('/make-admin/:userId', superAdminMiddleware, adminController.makeAdmin);

// POST /admin/promote-super/:userId — super_admin only; promotes an admin → super_admin
router.post('/promote-super/:userId', superAdminMiddleware, adminController.promoteSuper);

// POST /admin/demote/:userId — super_admin only
router.post('/demote/:userId', superAdminMiddleware, adminController.demote);

module.exports = router;
