import { Router } from "express";
import { askAI } from "../controllers/rag.controller";

const router = Router();
router.post("/ask", askAI);

export default router;
