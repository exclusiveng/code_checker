"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUsers = exports.createUser = void 0;
const data_source_1 = require("../config/data-source");
const user_entity_1 = require("../entities/user.entity");
const errors_1 = require("../utils/errors");
const bcrypt = __importStar(require("bcryptjs"));
const createUser = async (req, res, next) => {
    const body = (req.body || {});
    const { name, email, password, role, companyId } = body;
    if (!req.user)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    // Admins can only create users in their own company; super_admin can choose companyId
    const targetCompanyId = req.user.role === user_entity_1.UserRole.SUPER_ADMIN
        ? companyId || req.user.companyId
        : req.user.companyId;
    if (!targetCompanyId)
        return next(new errors_1.BadRequestError('Target company not determined'));
    if (req.user.role !== user_entity_1.UserRole.SUPER_ADMIN &&
        req.user.companyId !== targetCompanyId) {
        return next(new errors_1.ForbiddenError('Cannot create user for another company'));
    }
    if (!name || !email || !password) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    const existing = await userRepository.findOne({ where: { email } });
    if (existing)
        return next(new errors_1.BadRequestError('Email already in use'));
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = userRepository.create({
        name,
        email,
        passwordHash,
        role: role || user_entity_1.UserRole.DEVELOPER,
        companyId: targetCompanyId,
    });
    await userRepository.save(newUser);
    res.status(201).json(newUser);
};
exports.createUser = createUser;
const getUsers = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(new errors_1.BadRequestError('Authenticated user not found'));
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const qb = userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.company', 'company')
            .orderBy('user.createdAt', 'DESC')
            .take(limit)
            .skip(skip);
        // Both ADMIN and SUPER_ADMIN see only their own company's users
        if (req.user.role === user_entity_1.UserRole.ADMIN ||
            req.user.role === user_entity_1.UserRole.SUPER_ADMIN) {
            if (!req.user.companyId) {
                return next(new errors_1.BadRequestError('Authenticated user has no company'));
            }
            qb.where('user.companyId = :companyId', { companyId: req.user.companyId });
        }
        else {
            // Other roles cannot list users
            return next(new errors_1.ForbiddenError('Insufficient permissions.'));
        }
        const [users, total] = await qb.getManyAndCount();
        return res.json({
            users,
            pagination: { total, page, limit },
        });
    }
    catch (err) {
        return next(err);
    }
};
exports.getUsers = getUsers;
const updateUser = async (req, res, next) => {
    try {
        const { id: userIdToUpdate } = req.params;
        const { name, role } = req.body;
        const authenticatedUser = req.user;
        if (!authenticatedUser) {
            return next(new errors_1.ForbiddenError('Authentication required.'));
        }
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const userToUpdate = await userRepository.findOneBy({ id: userIdToUpdate });
        if (!userToUpdate) {
            return next(new errors_1.NotFoundError(`User with ID ${userIdToUpdate} not found.`));
        }
        // Permission checks
        if (authenticatedUser.role === user_entity_1.UserRole.ADMIN) {
            if (userToUpdate.companyId !== authenticatedUser.companyId || // Can't edit users outside their company
                userToUpdate.role === user_entity_1.UserRole.SUPER_ADMIN || // Can't edit a super_admin
                (userToUpdate.role === user_entity_1.UserRole.ADMIN && userToUpdate.id !== authenticatedUser.id) || // Can't edit other admins
                role === user_entity_1.UserRole.ADMIN || role === user_entity_1.UserRole.SUPER_ADMIN // Can't promote users to admin
            ) {
                return next(new errors_1.ForbiddenError('Insufficient permissions to edit this user or assign this role.'));
            }
        }
        else if (authenticatedUser.role !== user_entity_1.UserRole.SUPER_ADMIN) {
            return next(new errors_1.ForbiddenError('Insufficient permissions.'));
        }
        // Apply updates
        if (name)
            userToUpdate.name = name;
        if (role)
            userToUpdate.role = role;
        await userRepository.save(userToUpdate);
        // Omit passwordHash from the response
        const { passwordHash, ...userResponse } = userToUpdate;
        res.json(userResponse);
    }
    catch (err) {
        return next(err);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        const { id: userIdToDelete } = req.params;
        const authenticatedUser = req.user;
        if (!authenticatedUser) {
            return next(new errors_1.ForbiddenError('Authentication required.'));
        }
        if (userIdToDelete === authenticatedUser.id) {
            return next(new errors_1.ForbiddenError('You cannot delete your own account.'));
        }
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const userToDelete = await userRepository.findOneBy({ id: userIdToDelete });
        if (!userToDelete) {
            return next(new errors_1.NotFoundError(`User with ID ${userIdToDelete} not found.`));
        }
        // Permission check
        if (authenticatedUser.role === user_entity_1.UserRole.ADMIN) {
            // Admins can only delete non-admin users in their own company
            if (userToDelete.companyId !== authenticatedUser.companyId ||
                userToDelete.role === user_entity_1.UserRole.ADMIN ||
                userToDelete.role === user_entity_1.UserRole.SUPER_ADMIN) {
                return next(new errors_1.ForbiddenError('Insufficient permissions to delete this user.'));
            }
        }
        else if (authenticatedUser.role !== user_entity_1.UserRole.SUPER_ADMIN) {
            // Only admins and super_admins can delete users
            return next(new errors_1.ForbiddenError('Insufficient permissions.'));
        }
        await userRepository.remove(userToDelete);
        res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
};
exports.deleteUser = deleteUser;
