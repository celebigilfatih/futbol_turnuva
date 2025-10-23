import express from 'express';
import {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  addTeam,
  removeTeam,
  getGroups,
  generateFixture,
  deleteFixture
} from '../controllers/tournament';
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public routes (accessible to everyone)
router.get('/', optionalAuth, getAllTournaments);
router.get('/:id', optionalAuth, getTournamentById);
router.get('/:id/groups', optionalAuth, getGroups);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, createTournament);
router.put('/:id', authenticate, isAdmin, updateTournament);
router.delete('/:id', authenticate, isAdmin, deleteTournament);
router.put('/:id/status', authenticate, isAdmin, updateTournamentStatus);
router.post('/:id/teams', authenticate, isAdmin, addTeam);
router.delete('/:id/teams/:teamId', authenticate, isAdmin, removeTeam);
router.post('/:id/fixture', authenticate, isAdmin, generateFixture);
router.delete('/:id/fixture', authenticate, isAdmin, deleteFixture);

export default router; 