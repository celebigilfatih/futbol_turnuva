import express from 'express';
import { register, login, getCurrentUser, createInitialAdmin } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/init-admin', createInitialAdmin);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;
