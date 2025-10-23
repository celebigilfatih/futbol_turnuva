import express from 'express';
import { getTopScorers, updatePlayerStats, updatePlayerStatsFromMatch } from '../controllers/player';

const router = express.Router();

// Gol krallığı sıralamasını getir
router.get('/tournaments/:tournamentId/top-scorers', getTopScorers);

// Oyuncu istatistiklerini güncelle
router.patch('/:playerId/stats', updatePlayerStats);

// Maç sonucuna göre oyuncu istatistiklerini güncelle
router.post('/matches/:matchId/update-stats', updatePlayerStatsFromMatch);

export default router; 