"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = void 0;
const prisma_1 = __importDefault(require("../prisma/prisma"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rag_service_1 = require("../services/rag.service");
async function parsePDF(buffer) {
    // Dynamic import for pdf-parse v2 (ES module)
    const { PDFParse } = await Promise.resolve().then(() => __importStar(require('pdf-parse')));
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result;
}
const uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ error: "No file uploaded" });
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        const uploadPath = path_1.default.join(uploadDir, file.originalname);
        fs_1.default.writeFileSync(uploadPath, file.buffer);
        const parsed = await parsePDF(file.buffer);
        // pdf-parse v2 returns TextResult with .text property
        const text = (parsed === null || parsed === void 0 ? void 0 : parsed.text) || "";
        let workspace = await prisma_1.default.workspace.findFirst();
        if (!workspace) {
            let user = await prisma_1.default.user.findFirst();
            if (!user) {
                user = await prisma_1.default.user.create({
                    data: { email: 'default@example.com', name: 'Default User' },
                });
            }
            workspace = await prisma_1.default.workspace.create({
                data: { name: 'Default Workspace', ownerId: user.id },
            });
        }
        const document = await prisma_1.default.document.create({
            data: {
                title: file.originalname,
                fileUrl: uploadPath,
                textContent: text,
                workspaceId: workspace.id,
            },
        });
        await (0, rag_service_1.processDocumentForRAG)(document.id, text);
        return res.json({ message: "Uploaded", document });
    }
    catch (error) {
        console.error("PDF parsing error:", error);
        return res.status(500).json({ error: "Upload failed", details: error.message });
    }
};
exports.uploadDocument = uploadDocument;
//# sourceMappingURL=documents.controller.js.map