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

const router = express.Router();

// Turnuvaları listele
router.get('/', getAllTournaments);

// Tek turnuva getir
router.get('/:id', getTournamentById);

// Yeni turnuva oluştur
router.post('/', createTournament);

// Turnuva güncelle
router.put('/:id', updateTournament);

// Turnuva sil
router.delete('/:id', deleteTournament);

// Turnuva durumunu güncelle
router.put('/:id/status', updateTournamentStatus);

// Turnuvaya takım ekle
router.post('/:id/teams', addTeam);

// Turnuvadan takım çıkar
router.delete('/:id/teams/:teamId', removeTeam);

// Turnuva gruplarını getir
router.get('/:id/groups', getGroups);

// Turnuva fikstürünü oluştur
router.post('/:id/fixture', generateFixture);

// Turnuva fikstürünü sil
router.delete('/:id/fixture', deleteFixture);

export default router; 