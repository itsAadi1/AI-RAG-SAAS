import { Router } from "express";
import { askAI } from "../controllers/rag.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// RAG routes require authentication
router.use(authMiddleware);

router.post("/ask", askAI);

export default router;
