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

const router = express.Router();

// Takımları listele
router.get('/', getAllTeams);

// Tek takım getir
router.get('/:id', getTeamById);

// Yeni takım oluştur
router.post('/', createTeam);

// Takım güncelle
router.put('/:id', updateTeam);

// Takım sil
router.delete('/:id', deleteTeam);

// Oyuncu ekle
router.post('/:id/players', addPlayer);

// Oyuncu güncelle
router.put('/:id/players/:playerId', updatePlayer);

// Oyuncu sil
router.delete('/:id/players/:playerId', removePlayer);

// Seed teams
router.get('/seed', seedTeams);

export default router;