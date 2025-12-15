"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const documents_controller_1 = require("../controllers/documents.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)();
router.post('/upload', upload.single('file'), documents_controller_1.uploadDocument);
exports.default = router;
//# sourceMappingURL=documents.routes.js.map