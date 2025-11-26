/**
 * Order Management Controller
 * Handles customer orders and order tracking
 */

const { query, getClient } = require('../config/database');

/**
 * Create new order
 * @route POST /api/orders
 * @access Public
 */
const createOrder = async (req, res) => {
  const client = await getClient();

  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      order_type = 'PICKUP',
      notes,
      pickup_time,
      items // Array of { menu_item_id, quantity, customizations }
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, and at least one item are required'
      });
    }

    await client.query('BEGIN');

    // Calculate total amount by fetching current prices
    let total_amount = 0;
    const itemsWithPrices = [];

    for (const item of items) {
      const menuItemResult = await client.query(
        'SELECT id, name, price, is_available FROM menu_items WHERE id = $1',
        [item.menu_item_id]
      );

      if (menuItemResult.rows.length === 0) {
        throw new Error(`Menu item ${item.menu_item_id} not found`);
      }

      const menuItem = menuItemResult.rows[0];

      if (!menuItem.is_available) {
        throw new Error(`${menuItem.name} is currently unavailable`);
      }

      const itemTotal = parseFloat(menuItem.price) * item.quantity;
      total_amount += itemTotal;

      itemsWithPrices.push({
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.name,
        quantity: item.quantity,
        unit_price: menuItem.price,
        customizations: item.customizations || null
      });
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders
       (customer_name, customer_phone, customer_email, order_type, status, notes, pickup_time, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        'NEW',
        notes,
        pickup_time,
        total_amount.toFixed(2)
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of itemsWithPrices) {
      await client.query(
        `INSERT INTO order_items
         (order_id, menu_item_id, menu_item_name, quantity, unit_price, customizations)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.menu_item_id,
          item.menu_item_name,
          item.quantity,
          item.unit_price,
          item.customizations
        ]
      );
    }

    await client.query('COMMIT');

    // Fetch complete order with items
    const completeOrder = await getOrderById(order.id);

    res.status(201).json({
      success: true,
      data: completeOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating order'
    });
  } finally {
    client.release();
  }
};

/**
 * Get all orders with optional filtering
 * @route GET /api/orders
 * @access Admin, Kitchen
 */
const getOrders = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      params.push(status);
      sql += ` AND status = $${paramCount++}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      result.rows.map(async order => {
        const itemsResult = await query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        return {
          ...order,
          items: itemsResult.rows
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithItems
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

/**
 * Get active orders (for kitchen dashboard)
 * @route GET /api/orders/active
 * @access Kitchen, Admin
 */
const getActiveOrders = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM orders
       WHERE status IN ('NEW', 'IN_PROGRESS')
       ORDER BY
         CASE status
           WHEN 'NEW' THEN 1
           WHEN 'IN_PROGRESS' THEN 2
         END,
         created_at ASC`
    );

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      result.rows.map(async order => {
        const itemsResult = await query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        return {
          ...order,
          items: itemsResult.rows
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithItems
    });
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active orders'
    });
  }
};

/**
 * Get single order by ID
 * @route GET /api/orders/:id
 * @access Public (customers can check their order)
 */
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

/**
 * Update order status
 * @route PATCH /api/orders/:id/status
 * @access Kitchen, Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = await getOrderById(id);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

/**
 * Update entire order
 * @route PUT /api/orders/:id
 * @access Admin only
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_phone, customer_email, notes, pickup_time, status } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (customer_name !== undefined) {
      params.push(customer_name);
      updates.push(`customer_name = $${paramCount++}`);
    }
    if (customer_phone !== undefined) {
      params.push(customer_phone);
      updates.push(`customer_phone = $${paramCount++}`);
    }
    if (customer_email !== undefined) {
      params.push(customer_email);
      updates.push(`customer_email = $${paramCount++}`);
    }
    if (notes !== undefined) {
      params.push(notes);
      updates.push(`notes = $${paramCount++}`);
    }
    if (pickup_time !== undefined) {
      params.push(pickup_time);
      updates.push(`pickup_time = $${paramCount++}`);
    }
    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${paramCount++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    const sql = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = await getOrderById(id);

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order'
    });
  }
};

/**
 * Delete order
 * @route DELETE /api/orders/:id
 * @access Admin only
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
};

/**
 * Helper function to get complete order with items
 */
async function getOrderById(orderId) {
  const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];

  const itemsResult = await query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows
  };
}

module.exports = {
  createOrder,
  getOrders,
  getActiveOrders,
  getOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder
};
