/**
 * Menu Routes
 * Handles menu browsing and management
 */

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/roles');
const {
  getCategories,
  getMenuItems,
  getFullMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  updateCategory
} = require('../controllers/menuController');

// Public routes - anyone can view the menu
router.get('/', getFullMenu);
router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/items/:id', getMenuItem);

// Admin-only routes - menu management
router.post('/items', requireAdmin, createMenuItem);
router.put('/items/:id', requireAdmin, updateMenuItem);
router.delete('/items/:id', requireAdmin, deleteMenuItem);

router.post('/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);

module.exports = router;
