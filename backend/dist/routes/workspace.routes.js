"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workspace_controller_1 = require("../controllers/workspace.controller");
const router = (0, express_1.Router)();
// All workspace routes require authentication
router.use(auth_middleware_1.authMiddleware);
router.post('/', workspace_controller_1.createWorkspace);
router.get('/', workspace_controller_1.getWorkspaces);
router.get('/:id', workspace_controller_1.getWorkspace);
router.put('/:id', workspace_controller_1.updateWorkspace);
router.delete('/:id', workspace_controller_1.deleteWorkspace);
exports.default = router;
//# sourceMappingURL=workspace.routes.js.map