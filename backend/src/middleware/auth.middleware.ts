import jwt from 'jsonwebtoken';
import { NextFunction, Request,Response } from 'express';
export const authMiddleware = (req:Request, res:Response, next:NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.user = decoded;
    next();
  } catch {
    return res.sendStatus(401);
  }
};
