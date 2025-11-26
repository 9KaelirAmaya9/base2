/**
 * Menu Management Controller
 * Handles CRUD operations for menu categories and items
 */

const { query } = require('../config/database');

/**
 * Get all menu categories with their items
 * @route GET /api/menu/categories
 * @access Public
 */
const getCategories = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM menu_categories ORDER BY sort_order ASC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu categories'
    });
  }
};

/**
 * Get all menu items, optionally filtered by category
 * @route GET /api/menu/items
 * @access Public
 */
const getMenuItems = async (req, res) => {
  try {
    const { category_id, available_only } = req.query;

    let sql = `
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      params.push(category_id);
      sql += ` AND mi.category_id = $${params.length}`;
    }

    if (available_only === 'true') {
      sql += ` AND mi.is_available = true`;
    }

    sql += ' ORDER BY mc.sort_order, mi.name';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items'
    });
  }
};

/**
 * Get full menu with categories and items
 * @route GET /api/menu
 * @access Public
 */
const getFullMenu = async (req, res) => {
  try {
    const { available_only } = req.query;

    // Get all categories
    const categoriesResult = await query(
      'SELECT * FROM menu_categories ORDER BY sort_order ASC'
    );

    // Get all items
    let itemsSql = 'SELECT * FROM menu_items';
    if (available_only === 'true') {
      itemsSql += ' WHERE is_available = true';
    }
    itemsSql += ' ORDER BY name';

    const itemsResult = await query(itemsSql);

    // Group items by category
    const menu = categoriesResult.rows.map(category => ({
      ...category,
      items: itemsResult.rows.filter(item => item.category_id === category.id)
    }));

    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    console.error('Error fetching full menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu'
    });
  }
};

/**
 * Get single menu item
 * @route GET /api/menu/items/:id
 * @access Public
 */
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT mi.*, mc.name as category_name
       FROM menu_items mi
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item'
    });
  }
};

/**
 * Create new menu item
 * @route POST /api/menu/items
 * @access Admin only
 */
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      is_available = true,
      is_special = false,
      image_url
    } = req.body;

    // Validate required fields
    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required'
      });
    }

    const result = await query(
      `INSERT INTO menu_items
       (name, description, price, category_id, is_available, is_special, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, category_id, is_available, is_special, image_url]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item'
    });
  }
};

/**
 * Update menu item
 * @route PUT /api/menu/items/:id
 * @access Admin only
 */
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category_id,
      is_available,
      is_special,
      image_url
    } = req.body;

    // Check if item exists
    const checkResult = await query('SELECT id FROM menu_items WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${paramCount++}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${paramCount++}`);
    }
    if (price !== undefined) {
      params.push(price);
      updates.push(`price = $${paramCount++}`);
    }
    if (category_id !== undefined) {
      params.push(category_id);
      updates.push(`category_id = $${paramCount++}`);
    }
    if (is_available !== undefined) {
      params.push(is_available);
      updates.push(`is_available = $${paramCount++}`);
    }
    if (is_special !== undefined) {
      params.push(is_special);
      updates.push(`is_special = $${paramCount++}`);
    }
    if (image_url !== undefined) {
      params.push(image_url);
      updates.push(`image_url = $${paramCount++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    const sql = `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item'
    });
  }
};

/**
 * Delete menu item
 * @route DELETE /api/menu/items/:id
 * @access Admin only
 */
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM menu_items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item'
    });
  }
};

/**
 * Create new category
 * @route POST /api/menu/categories
 * @access Admin only
 */
const createCategory = async (req, res) => {
  try {
    const { name, sort_order = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const result = await query(
      'INSERT INTO menu_categories (name, sort_order) VALUES ($1, $2) RETURNING *',
      [name, sort_order]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
};

/**
 * Update category
 * @route PUT /api/menu/categories/:id
 * @access Admin only
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${paramCount++}`);
    }
    if (sort_order !== undefined) {
      params.push(sort_order);
      updates.push(`sort_order = $${paramCount++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    const sql = `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
};

module.exports = {
  getCategories,
  getMenuItems,
  getFullMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  updateCategory
};
