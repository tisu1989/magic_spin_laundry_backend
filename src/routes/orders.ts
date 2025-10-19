import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrder);
router.patch('/:id/status', authenticate, authorize(['admin']), updateOrderStatus);

export default router;