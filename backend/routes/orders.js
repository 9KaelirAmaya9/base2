/**
 * Order Routes
 * Handles order creation and management
 */

const express = require('express');
const router = express.Router();
const { requireAdmin, requireKitchen } = require('../middleware/roles');
const {
  createOrder,
  getOrders,
  getActiveOrders,
  getOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');

// Public routes
router.post('/', createOrder); // Anyone can place an order
router.get('/:id', getOrder); // Anyone can check order status

// Kitchen and Admin routes
router.get('/list/active', requireKitchen, getActiveOrders); // Kitchen dashboard
router.patch('/:id/status', requireKitchen, updateOrderStatus); // Update status

// Admin-only routes
router.get('/', requireAdmin, getOrders); // View all orders
router.put('/:id', requireAdmin, updateOrder); // Full order update
router.delete('/:id', requireAdmin, deleteOrder); // Delete order

module.exports = router;
