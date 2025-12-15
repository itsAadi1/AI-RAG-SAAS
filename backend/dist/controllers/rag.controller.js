"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAI = void 0;
const rag_service_1 = require("../services/rag.service");
const askAI = async (req, res) => {
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ error: "Question is required" });
    }
    const response = await (0, rag_service_1.answerWithRAG)(question);
    return res.json(response);
};
exports.askAI = askAI;
//# sourceMappingURL=rag.controller.js.map