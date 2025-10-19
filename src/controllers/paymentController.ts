import { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase';
import { RequestWithUser } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export const createPaymentIntent = async (req: RequestWithUser, res: Response) => {
  try {
    const { order_id, payment_method } = req.body;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', req.user!.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for cancelled order' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: {
        order_id: order.id,
        user_id: req.user!.id
      }
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          order_id: order.id,
          amount: order.total_amount,
          payment_method,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (paymentError) {
      return res.status(400).json({ error: 'Failed to create payment record' });
    }

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_id: payment.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { payment_intent_id } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: paymentIntent.id
        })
        .eq('stripe_payment_intent_id', payment_intent_id);

      if (!paymentUpdateError) {
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', paymentIntent.metadata.order_id);
      }
    }

    res.json({ status: paymentIntent.status });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPayments = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query = supabase
      .from('payments')
      .select(`
        *,
        orders (*)
      `)
      .order('created_at', { ascending: false });

    if (userRole === 'customer') {
      query = query.eq('orders.user_id', userId);
    }

    const { data: payments, error } = await query;

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch payments' });
    }

    res.json({ data: payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};