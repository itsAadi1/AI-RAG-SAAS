import { Request, Response } from "express";
import { answerWithRAG } from "../services/rag.service";
import prisma from "../prisma/prisma";

export const askAI = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
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
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId,
      },
    });

    if (!workspace) {
      return res.status(403).json({ error: "Workspace not found or access denied" });
    }

    const response = await answerWithRAG(question, workspaceId);
    return res.json(response);
  } catch (error: any) {
    console.error("RAG query error:", error);
    return res.status(500).json({ error: "Failed to process question", details: error.message });
  }
};
