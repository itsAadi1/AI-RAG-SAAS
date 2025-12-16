"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const auth_controller_1 = require("../controllers/auth.controller");
router.post('/register', auth_controller_1.registerUser);
router.post('/login', auth_controller_1.loginUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map