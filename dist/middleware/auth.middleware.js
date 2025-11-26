"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = exports.protect = void 0;
const data_source_1 = require("../config/data-source");
const user_entity_1 = require("../entities/user.entity");
const errors_1 = require("../utils/errors");
const auth_service_1 = require("../services/auth.service");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = (0, auth_service_1.verifyToken)(token);
            if (!decoded || !decoded.id) {
                return next(new errors_1.AppError('Not authorized, token failed', 401));
            }
            const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
            const currentUser = await userRepository.findOneBy({ id: decoded.id });
            if (!currentUser) {
                return next(new errors_1.AppError('User belonging to this token does no longer exist.', 401));
            }
            req.user = currentUser;
            return next();
        }
        catch (error) {
            return next(new errors_1.AppError('Not authorized, token failed', 401));
        }
    }
    if (!token) {
        return next(new errors_1.AppError('Not authorized, no token', 401));
    }
};
exports.protect = protect;
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.AppError('Authentication error, user not found on request.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.AppError('You do not have permission to perform this action.', 403));
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
