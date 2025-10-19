import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getUserAnalytics,
  searchUsers
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes are protected and admin-only
router.use(authenticate);
router.use(authorize(['admin']));

// User management routes
router.get('/', getUsers);
router.get('/search', searchUsers);
router.get('/stats', getDashboardStats);
router.get('/analytics', getUserAnalytics);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;