import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { RequestWithUser, Order } from '../types';

export const createOrder = async (req: RequestWithUser, res: Response) => {
  try {
    const {
      service_type,
      quantity,
      pickup_address,
      delivery_address,
      scheduled_pickup,
      scheduled_delivery,
      special_instructions
    } = req.body;

    const userId = req.user!.id;

    const { data: priceData, error: priceError } = await supabase
      .from('service_prices')
      .select('price_per_unit')
      .eq('service_type', service_type)
      .eq('is_active', true)
      .single();

    if (priceError || !priceData) {
      return res.status(400).json({ error: 'Invalid service type or pricing not available' });
    }

    const total_amount = quantity * priceData.price_per_unit;

    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          service_type,
          quantity,
          total_amount,
          pickup_address,
          delivery_address,
          scheduled_pickup,
          scheduled_delivery,
          special_instructions
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create order error:', error);
      return res.status(400).json({ error: 'Failed to create order' });
    }

    res.status(201).json({
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrders = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (userRole === 'customer') {
      query = query.eq('user_id', userId);
    }

    const { data: orders, error } = await query;

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch orders' });
    }

    res.json({ data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrder = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query = supabase
      .from('orders')
      .select(`
        *,
        users (email, full_name, phone),
        payments (*)
      `)
      .eq('id', id);

    if (userRole === 'customer') {
      query = query.eq('user_id', userId);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'picked_up', 'washing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to update order status' });
    }

    res.json({
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};