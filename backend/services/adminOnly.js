import User from '../models/user.model.js';

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ status: 401, message: 'Authentication required' });
        }

        const user = await User.findById(req.session.userId).select('admin role');
        if (!user || (!user.admin && user.role !== 'admin')) {
            return res.status(403).json({ status: 403, message: 'Admin access required' });
        }

        req.adminUser = user;
        return next();
    } catch (err) {
        console.error('Error verifying admin access:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export default requireAdmin;