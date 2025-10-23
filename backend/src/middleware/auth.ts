import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JwtPayload {
  userId: string;
  role: string;
  username: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme token bulunamadı.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // @ts-ignore
    req.user = {
      userId: user._id,
      role: user.role,
      username: (user as any).username
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const user = req.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli.' });
  }

  next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await User.findById(decoded.userId);

      if (user) {
        // @ts-ignore
        req.user = {
          userId: user._id,
          role: user.role,
          username: (user as any).username
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}; 