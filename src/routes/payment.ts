import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPayments
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/', authenticate, getPayments);

export default router;