"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Test route to verify router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working' });
});
router.post('/register', auth_controller_1.registerUser);
router.post('/login', auth_controller_1.loginUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map