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
exports.createUser = void 0;
const data_source_1 = require("../config/data-source");
const user_entity_1 = require("../entities/user.entity");
const errors_1 = require("../utils/errors");
const bcrypt = __importStar(require("bcryptjs"));
const createUser = async (req, res, next) => {
    const { name, email, password, role, companyId } = req.body;
    if (!req.user)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    // Admins can only create users in their own company; super_admin can choose companyId
    const targetCompanyId = req.user.role === user_entity_1.UserRole.SUPER_ADMIN ? (companyId || req.user.companyId) : req.user.companyId;
    if (!targetCompanyId)
        return next(new errors_1.BadRequestError('Target company not determined'));
    if (req.user.role !== user_entity_1.UserRole.SUPER_ADMIN && req.user.companyId !== targetCompanyId) {
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
