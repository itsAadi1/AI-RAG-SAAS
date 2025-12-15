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
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const uploadDir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    const uploadPath = path.join(uploadDir, file.originalname);
    fs.writeFileSync(uploadPath, file.buffer);

    const parsed = await parsePDF(file.buffer);

    // pdf-parse v2 returns TextResult with .text property
    const text = parsed?.text || "";

    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: { email: 'default@example.com', name: 'Default User' },
        });
      }

      workspace = await prisma.workspace.create({
        data: { name: 'Default Workspace', ownerId: user.id },
      });
    }

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
