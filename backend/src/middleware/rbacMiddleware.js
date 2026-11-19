/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified allowed roles
 * Supported roles: 'admin', 'user', 'read-only'
 */

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User is not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access denied. Your role '${req.user.role}' does not have permission to perform this action.`,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Convenience guards for semantic route definition
 */
const requireAdmin = authorizeRoles('admin');
const requireWriteAccess = authorizeRoles('admin', 'user'); // blocks 'read-only'

module.exports = {
  authorizeRoles,
  requireAdmin,
  requireWriteAccess,
};
