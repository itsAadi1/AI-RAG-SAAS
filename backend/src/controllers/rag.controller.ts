import { Request, Response } from "express";
import { answerWithRAG } from "../services/rag.service";

export const askAI = async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const response = await answerWithRAG(question);
  return res.json(response);
};
