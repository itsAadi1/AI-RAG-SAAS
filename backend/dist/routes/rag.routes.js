"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rag_controller_1 = require("../controllers/rag.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// RAG routes require authentication
router.use(auth_middleware_1.authMiddleware);
router.post("/ask", rag_controller_1.askAI);
exports.default = router;
//# sourceMappingURL=rag.routes.js.map