import { Request, Response } from 'express';
import prisma from '../prisma/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

const generateToken=(userId:string)=>{
   return jwt.sign(
    {userId},
    process.env.JWT_SECRET!,
    {
        expiresIn:'1d'
    }
   )
}
export const registerUser = async (req: Request, res: Response) => {
  try {
    console.log('Register endpoint called');
    const { email, password } = req.body;
    console.log('Received data:', { email, hasPassword: !!password });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    console.log('User created successfully:', user.id);
    return res.status(201).json({ message: 'User created' });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
  
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token=generateToken(user.id);
      return res.status(200).json({token});
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };