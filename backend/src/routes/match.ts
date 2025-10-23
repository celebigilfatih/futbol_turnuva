import express from 'express';
import {
  getAllMatches,
  getMatchById,
  getMatchesByTournament,
  createMatch,
  updateMatch,
  deleteMatch,
  updateMatchStatus,
  updateMatchScore,
  updateMatchStats,
  getStandings
} from '../controllers/match';
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public routes (accessible to everyone)
router.get('/', optionalAuth, getAllMatches);
router.get('/tournament/:tournamentId', optionalAuth, getMatchesByTournament);
router.get('/standings/:tournamentId', optionalAuth, getStandings);
router.get('/:id', optionalAuth, getMatchById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, createMatch);
router.put('/:id', authenticate, isAdmin, updateMatch);
router.delete('/:id', authenticate, isAdmin, deleteMatch);
router.put('/:id/status', authenticate, isAdmin, updateMatchStatus);
router.put('/:id/score', authenticate, isAdmin, updateMatchScore);
router.put('/:id/stats', authenticate, isAdmin, updateMatchStats);

export default router; 