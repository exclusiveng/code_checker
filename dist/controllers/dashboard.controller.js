"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
/**
 * @desc    Get current logged-in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    // The user object is attached by the `protect` middleware.
    // We can be confident it exists here, but this check satisfies TypeScript.
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, user: req.user });
};
exports.getMe = getMe;
