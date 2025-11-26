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
exports.login = exports.register = void 0;
const data_source_1 = require("../config/data-source");
const user_entity_1 = require("../entities/user.entity");
const company_entity_1 = require("../entities/company.entity");
const auth_service_1 = require("../services/auth.service");
const errors_1 = require("../utils/errors");
const bcrypt = __importStar(require("bcryptjs"));
const register = async (req, res, next) => {
    if (!req.body) {
        return next(new errors_1.BadRequestError('Missing request body'));
    }
    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    const userCount = await userRepository.count();
    const isFirstUser = userCount === 0;
    // companyName is required so we can associate the new user with a company.
    if (!companyName) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
        return next(new errors_1.BadRequestError('User with this email already exists'));
    }
    const companyRepository = data_source_1.AppDataSource.getRepository(company_entity_1.Company);
    // find or create the company by name
    let company = await companyRepository.findOne({ where: { name: companyName } });
    if (!company) {
        company = companyRepository.create({ name: companyName });
        await companyRepository.save(company);
    }
    // If this is the first user for this company, promote them to SUPER_ADMIN
    const companyUserCount = await userRepository.count({ where: { companyId: company.id } });
    const isFirstForCompany = companyUserCount === 0;
    const passwordHash = await bcrypt.hash(password, 10);
    const role = isFirstForCompany ? user_entity_1.UserRole.SUPER_ADMIN : user_entity_1.UserRole.DEVELOPER;
    const newUser = userRepository.create({
        name,
        email,
        passwordHash,
        companyId: company.id,
        role,
    });
    const saved = await userRepository.save(newUser);
    // Sign a token so the frontend can auto-login after registering the first admin
    const token = (0, auth_service_1.signToken)(saved);
    const { passwordHash: _ph, ...userToSend } = saved;
    res.status(201).json({ token, user: userToSend });
};
exports.register = register;
const login = async (req, res, next) => {
    if (!req.body) {
        return next(new errors_1.BadRequestError('Missing request body'));
    }
    const { email, password } = req.body || {};
    if (!email || !password) {
        return next(new errors_1.BadRequestError('Missing email or password'));
    }
    const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
        return next(new errors_1.BadRequestError('Invalid credentials'));
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return next(new errors_1.BadRequestError('Invalid credentials'));
    }
    const token = (0, auth_service_1.signToken)(user);
    const { passwordHash, ...userToSend } = user;
    res.json({ token, user: userToSend });
};
exports.login = login;
