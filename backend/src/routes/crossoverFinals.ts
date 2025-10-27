import express from 'express';
import {
  getGroupStandings,
  createCrossoverFinals,
  getCrossoverFinals,
  updateCrossoverMatch,
  deleteCrossoverFinals
} from '../controllers/crossoverFinals';
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get group standings for crossover setup
router.get('/:tournamentId/standings', optionalAuth, getGroupStandings);

// Get existing crossover finals
router.get('/:tournamentId', optionalAuth, getCrossoverFinals);

// Create crossover finals
router.post('/:tournamentId', authenticate, isAdmin, createCrossoverFinals);

// Update specific crossover match
router.put('/match/:matchId', authenticate, isAdmin, updateCrossoverMatch);

// Delete all crossover finals for a tournament
router.delete('/:tournamentId', authenticate, isAdmin, deleteCrossoverFinals);

export default router;
