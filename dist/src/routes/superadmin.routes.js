"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const superadmin_controller_1 = require("../controllers/superadmin.controller");
const router = (0, express_1.Router)();
// Intentionally unprotected to bootstrap the first tenant; consider gating behind an env flag in production.
router.post('/', superadmin_controller_1.createSuperAdmin);
exports.default = router;
