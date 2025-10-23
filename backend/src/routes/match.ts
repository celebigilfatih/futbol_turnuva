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

const router = express.Router();

// Tüm maçları listele
router.get('/', getAllMatches);

// Turnuvaya göre maçları listele
router.get('/tournament/:tournamentId', getMatchesByTournament);

// Tek maç getir
router.get('/:id', getMatchById);

// Yeni maç oluştur
router.post('/', createMatch);

// Maç güncelle
router.put('/:id', updateMatch);

// Maç sil
router.delete('/:id', deleteMatch);

// Maç durumunu güncelle
router.put('/:id/status', updateMatchStatus);

// Skor güncelle
router.put('/:id/score', updateMatchScore);

// İstatistikleri güncelle
router.put('/:id/stats', updateMatchStats);

// Turnuva durumu
router.get('/standings/:tournamentId', getStandings);

export default router; 