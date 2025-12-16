import { Request, Response } from 'express';
import prisma from '../prisma/prisma';
import fs from 'fs';
import path from 'path';
import { processDocumentForRAG } from "../services/rag.service";

async function parsePDF(buffer: Buffer) {
  // Dynamic import for pdf-parse v2 (ES module)
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result;
}

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const { workspaceId } = req.body;

    // Validate workspace ownership if workspaceId is provided
    let workspace;
    if (workspaceId) {
      workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          ownerId: userId,
        },
      });

      if (!workspace) {
        return res.status(403).json({ error: 'Workspace not found or access denied' });
      }
    } else {
      // Get user's first workspace or create a default one
      workspace = await prisma.workspace.findFirst({
        where: { ownerId: userId },
        orderBy: { createdAt: 'asc' },
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: { name: 'My Workspace', ownerId: userId },
        });
      }
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    const uploadPath = path.join(uploadDir, file.originalname);
    fs.writeFileSync(uploadPath, file.buffer);

    const parsed = await parsePDF(file.buffer);

    // pdf-parse v2 returns TextResult with .text property
    const text = parsed?.text || "";

    const document = await prisma.document.create({
      data: {
        title: file.originalname,
        fileUrl: uploadPath,
        textContent: text,
        workspaceId: workspace.id,
      },
    });

    await processDocumentForRAG(document.id, text);

    return res.json({ message: "Uploaded", document });

  } catch (error: any) {
    console.error("PDF parsing error:", error);
    return res.status(500).json({ error: "Upload failed", details: error.message });
  }
};
