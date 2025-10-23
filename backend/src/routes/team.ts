import express from 'express';
import { 
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayer,
  updatePlayer,
  removePlayer,
  seedTeams
} from '../controllers/team';
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public routes (accessible to everyone)
router.get('/', optionalAuth, getAllTeams);
router.get('/:id', optionalAuth, getTeamById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, createTeam);
router.put('/:id', authenticate, isAdmin, updateTeam);
router.delete('/:id', authenticate, isAdmin, deleteTeam);
router.post('/:id/players', authenticate, isAdmin, addPlayer);
router.put('/:id/players/:playerId', authenticate, isAdmin, updatePlayer);
router.delete('/:id/players/:playerId', authenticate, isAdmin, removePlayer);

// Seed teams (admin only)
router.get('/seed', authenticate, isAdmin, seedTeams);

export default router;