"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const documents_controller_1 = require("../controllers/documents.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)();
// Document upload requires authentication
router.post('/upload', auth_middleware_1.authMiddleware, upload.single('file'), documents_controller_1.uploadDocument);
exports.default = router;
//# sourceMappingURL=documents.routes.js.map