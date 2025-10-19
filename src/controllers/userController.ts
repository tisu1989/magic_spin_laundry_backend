import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { RequestWithUser, User } from '../types';

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = async (req: RequestWithUser, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_verified, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Get users error:', error);
      return res.status(400).json({ error: 'Failed to fetch users' });
    }

    res.json({
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, address, role, is_verified, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, phone, address, role, is_verified } = req.body;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (role) updateData.role = role;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, phone, address, role, is_verified, created_at, updated_at')
      .single();

    if (error) {
      console.error('Update user error:', error);
      return res.status(400).json({ error: 'Failed to update user' });
    }

    res.json({
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has orders (optional - depending on your business logic)
    const { data: userOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', id)
      .limit(1);

    if (userOrders && userOrders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing orders. Please archive instead.' 
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(400).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req: RequestWithUser, res: Response) => {
  try {
    // Get user statistics
    const { data: userStats, error: userError } = await supabase
      .from('users')
      .select('role, is_verified');

    // Get order statistics
    const { data: orderStats, error: orderError } = await supabase
      .from('orders')
      .select('status, total_amount, created_at');

    // Get payment statistics
    const { data: paymentStats, error: paymentError } = await supabase
      .from('payments')
      .select('status, amount, created_at');

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (userError || orderError || paymentError || recentOrdersError) {
      console.error('Stats fetch error:', { userError, orderError, paymentError, recentOrdersError });
      return res.status(400).json({ error: 'Failed to fetch statistics' });
    }

    // Calculate statistics
    const totalUsers = userStats?.length || 0;
    const verifiedUsers = userStats?.filter(user => user.is_verified).length || 0;
    const adminUsers = userStats?.filter(user => user.role === 'admin').length || 0;
    const customerUsers = userStats?.filter(user => user.role === 'customer').length || 0;

    const totalOrders = orderStats?.length || 0;
    const ordersByStatus = orderStats?.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const totalRevenue = paymentStats
      ?.filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;

    const recentOrdersCount = recentOrders?.length || 0;

    // Calculate revenue for current month
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyRevenue = paymentStats
      ?.filter(payment => 
        payment.status === 'completed' && 
        new Date(payment.created_at) >= firstDayOfMonth
      )
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;

    // Calculate growth percentages (mock data for demo)
    const userGrowth = totalUsers > 0 ? 12.5 : 0; // Mock growth percentage
    const revenueGrowth = totalRevenue > 0 ? 8.3 : 0; // Mock growth percentage
    const orderGrowth = totalOrders > 0 ? 15.7 : 0; // Mock growth percentage

    const stats = {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        admins: adminUsers,
        customers: customerUsers,
        growth: userGrowth
      },
      orders: {
        total: totalOrders,
        recent: recentOrdersCount,
        by_status: ordersByStatus,
        growth: orderGrowth
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        growth: revenueGrowth
      },
      overview: {
        active_orders: ordersByStatus.pending + (ordersByStatus.confirmed || 0) + (ordersByStatus.picked_up || 0) + (ordersByStatus.washing || 0),
        completed_orders: ordersByStatus.delivered || 0,
        pending_payments: paymentStats?.filter(p => p.status === 'pending').length || 0,
        conversion_rate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
      }
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Get user analytics
 * @route   GET /api/users/analytics
 * @access  Private/Admin
 */
export const getUserAnalytics = async (req: RequestWithUser, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get user registration trends
    const { data: userRegistrations, error: usersError } = await supabase
      .from('users')
      .select('created_at, role')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    // Get order trends
    const { data: orderTrends, error: ordersError } = await supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    if (usersError || ordersError) {
      console.error('Analytics fetch error:', { usersError, ordersError });
      return res.status(400).json({ error: 'Failed to fetch analytics' });
    }

    // Process user registration data
    const userTrends = processTimeSeriesData(userRegistrations || [], startDate, endDate, 'users');
    const orderTrendsData = processTimeSeriesData(orderTrends || [], startDate, endDate, 'orders');

    // Calculate additional metrics
    const activeUsers = await getActiveUsersCount(startDate, endDate);
    const avgOrderValue = orderTrends && orderTrends.length > 0 
      ? orderTrends.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) / orderTrends.length
      : 0;

    const analytics = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: period
      },
      trends: {
        users: userTrends,
        orders: orderTrendsData
      },
      metrics: {
        active_users: activeUsers,
        average_order_value: avgOrderValue,
        user_retention: calculateRetentionRate(userRegistrations || [])
      }
    };

    res.json({ data: analytics });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private/Admin
 */
export const searchUsers = async (req: RequestWithUser, res: Response) => {
  try {
    const { q, field = 'all' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_verified, created_at')
      .limit(20);

    // Apply search based on field
    if (field === 'all' || field === 'email') {
      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`);
    } else if (field === 'email') {
      query = query.ilike('email', `%${q}%`);
    } else if (field === 'name') {
      query = query.ilike('full_name', `%${q}%`);
    } else if (field === 'phone') {
      query = query.ilike('phone', `%${q}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Search users error:', error);
      return res.status(400).json({ error: 'Failed to search users' });
    }

    res.json({ data: users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions

/**
 * Process time series data for analytics
 */
const processTimeSeriesData = (data: any[], startDate: Date, endDate: Date, type: 'users' | 'orders') => {
  const result: { [key: string]: number } = {};
  const currentDate = new Date(startDate);
  
  // Initialize all dates in range with 0
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    result[dateKey] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill with actual data
  data.forEach(item => {
    const dateKey = item.created_at.split('T')[0];
    if (result[dateKey] !== undefined) {
      result[dateKey]++;
    }
  });

  // Convert to array format for charts
  return Object.entries(result).map(([date, count]) => ({
    date,
    count,
    [type]: count
  }));
};

/**
 * Get count of active users (users with orders in period)
 */
const getActiveUsersCount = async (startDate: Date, endDate: Date): Promise<number> => {
  const { data, error } = await supabase
    .from('orders')
    .select('user_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) return 0;

  const uniqueUserIds = new Set(data.map(order => order.user_id));
  return uniqueUserIds.size;
};

/**
 * Calculate user retention rate (mock implementation)
 */
const calculateRetentionRate = (users: any[]): number => {
  // This is a simplified calculation
  // In a real app, you'd track user activity over time
  const totalUsers = users.length;
  const activeUsers = users.filter(user => {
    const createdAt = new Date(user.created_at);
    const daysSinceJoin = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceJoin <= 30; // Active if joined in last 30 days
  }).length;

  return totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
};