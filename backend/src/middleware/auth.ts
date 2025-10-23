import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error();
    }

    // @ts-ignore
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Lütfen giriş yapın.' });
  }
}; 