"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
/**
 * @desc    Get current logged-in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, user: req.user });
};
exports.getMe = getMe;
