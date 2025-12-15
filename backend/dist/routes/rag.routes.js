"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rag_controller_1 = require("../controllers/rag.controller");
const router = (0, express_1.Router)();
router.post("/ask", rag_controller_1.askAI);
exports.default = router;
//# sourceMappingURL=rag.routes.js.map