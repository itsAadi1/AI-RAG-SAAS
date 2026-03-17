import { PrismaClient } from '@prisma/client';
import { Request, Response} from "express";
const prisma = new PrismaClient();

export const healthController = async (req:Request, res:Response) => {
  const timestamp = new Date().toISOString();
  let databaseStatus = 'unknown';

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = 'connected';
  } catch (e) {
    databaseStatus = 'disconnected';
  }

  const status = databaseStatus === 'connected' ? 'ok' : 'degraded';

  res.json({
    status,
    database: databaseStatus,
    timestamp,
  });
};