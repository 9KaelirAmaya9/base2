/**
 * Role-Based Access Control Middleware
 * Protects routes based on user roles
 */

const protect = require('./auth');

/**
 * Middleware to check if user has required role(s)
 * @param {...string} allowedRoles - Roles that can access this route
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // First ensure user is authenticated
      await new Promise((resolve, reject) => {
        protect(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Check if user has a role
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No role assigned to user'
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Requires ${allowedRoles.join(' or ')} role`
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
  };
};

/**
 * Convenience middleware for admin-only routes
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Convenience middleware for kitchen staff routes
 */
const requireKitchen = requireRole('KITCHEN', 'ADMIN');

/**
 * Convenience middleware for cashier routes
 */
const requireCashier = requireRole('CASHIER', 'ADMIN');

module.exports = {
  requireRole,
  requireAdmin,
  requireKitchen,
  requireCashier
};
