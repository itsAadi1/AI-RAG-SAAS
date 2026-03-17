"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const health_controller_1 = require("../controllers/health.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', health_controller_1.healthController);
exports.default = router;
//# sourceMappingURL=health.routes.js.map