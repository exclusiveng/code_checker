"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submission_controller_1 = require("../controllers/submission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_entity_1 = require("../entities/user.entity");
const review_routes_1 = __importDefault(require("./review.routes"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, submission_controller_1.getSubmissions);
router.post('/upload', auth_middleware_1.protect, submission_controller_1.uploadSubmission);
router.get('/:id/status', auth_middleware_1.protect, submission_controller_1.getSubmissionStatus);
router.use('/:id/reviews', review_routes_1.default);
router.post('/:id/push', auth_middleware_1.protect, (0, auth_middleware_1.roleMiddleware)([user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN]), submission_controller_1.pushToGithub);
exports.default = router;
