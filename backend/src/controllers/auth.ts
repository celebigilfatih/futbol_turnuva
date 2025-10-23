import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Bu email veya kullanıcı adı zaten kullanılıyor.' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      name,
      role: 'user' // Default role
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Kayıt başarılı',
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      message: 'Kayıt sırasında bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Kullanıcı adı veya şifre hatalı.' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Kullanıcı adı veya şifre hatalı.' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Giriş sırasında bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.json({
      data: {
        id: user._id,
        username: (user as any).username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      message: 'Kullanıcı bilgileri alınırken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create initial admin user
export const createInitialAdmin = async (req: Request, res: Response) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({ 
        message: 'Admin kullanıcı zaten mevcut.' 
      });
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@futbol-turnuva.com',
      password: 'admin123', // Will be hashed automatically
      name: 'Administrator',
      role: 'admin'
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin kullanıcı oluşturuldu',
      data: {
        username: 'admin',
        password: 'admin123',
        warning: 'Lütfen şifrenizi değiştirin!'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      message: 'Admin oluşturulurken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
