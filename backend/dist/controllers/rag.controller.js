"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAI = void 0;
const rag_service_1 = require("../services/rag.service");
const prisma_1 = __importDefault(require("../prisma/prisma"));
const askAI = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { question, workspaceId } = req.body;
        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }
        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }
        // Validate that the workspace belongs to the user
        const workspace = await prisma_1.default.workspace.findFirst({
            where: {
                id: workspaceId,
                ownerId: userId,
            },
        });
        if (!workspace) {
            return res.status(403).json({ error: "Workspace not found or access denied" });
        }
        const response = await (0, rag_service_1.answerWithRAG)(question, workspaceId);
        return res.json(response);
    }
    catch (error) {
        console.error("RAG query error:", error);
        return res.status(500).json({ error: "Failed to process question", details: error.message });
    }
};
exports.askAI = askAI;
//# sourceMappingURL=rag.controller.js.map