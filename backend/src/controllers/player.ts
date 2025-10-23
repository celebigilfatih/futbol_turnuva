import { Request, Response } from 'express';
import Player from '../models/Player';
import Match from '../models/Match';
import mongoose from 'mongoose';

// Gol krallığı sıralamasını getir
export const getTopScorers = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const limit = Number(req.query.limit) || 10;

    console.log('Request received for top scorers:', {
      tournamentId,
      limit,
      params: req.params,
      query: req.query,
      url: req.url,
      method: req.method
    });

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      console.log('Invalid tournament ID:', tournamentId);
      return res.status(400).json({ message: 'Geçersiz turnuva ID' });
    }

    // MongoDB bağlantısını kontrol et
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB connection is not ready. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Veritabanı bağlantısı hazır değil' });
    }

    console.log('Executing Player.find query with:', {
      tournament: tournamentId,
      sort: { goals: -1, minutesPlayed: 1 },
      limit
    });

    // Önce turnuvada oyuncu var mı kontrol edelim
    const playerCount = await Player.countDocuments({ tournament: tournamentId });
    console.log('Player count for tournament:', playerCount);

    const topScorers = await Player.find({ tournament: tournamentId })
      .sort({ goals: -1, minutesPlayed: 1 })
      .limit(limit)
      .populate('team', 'name')
      .select('name number team goals assists matches minutesPlayed')
      .lean(); // Performans için lean() kullanıyoruz

    console.log('Raw query results:', JSON.stringify(topScorers, null, 2));

    const formattedScorers = topScorers.map(player => {
      console.log('Processing player:', player);
      const teamName = player.team ? (player.team as any).name : 'Unknown Team';
      return {
        id: player._id,
        name: player.name,
        number: player.number,
        team: { name: teamName },
        goals: player.goals || 0,
        assists: player.assists || 0,
        matches: player.matches || 0,
        minutesPlayed: player.minutesPlayed || 0,
        goalsPerMatch: player.matches ? (player.goals / player.matches).toFixed(2) : '0.00',
        minutesPerGoal: player.goals > 0 ? Math.floor(player.minutesPlayed / player.goals).toString() : '-'
      };
    });

    console.log('Sending response with formatted scorers:', {
      count: formattedScorers.length,
      sample: formattedScorers.slice(0, 2)
    });

    res.json({
      data: formattedScorers
    });
  } catch (error) {
    console.error('Detailed error in getTopScorers:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    res.status(500).json({ 
      message: 'Gol krallığı bilgileri getirilirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
};

// Oyuncu istatistiklerini güncelle
export const updatePlayerStats = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { goals, assists, minutesPlayed } = req.body;

    const player = await Player.findByIdAndUpdate(
      playerId,
      {
        $inc: {
          goals: goals || 0,
          assists: assists || 0,
          matches: 1,
          minutesPlayed: minutesPlayed || 0
        }
      },
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Oyuncu bulunamadı.' });
    }

    res.json({ data: player });
  } catch (error) {
    res.status(500).json({ message: 'Oyuncu istatistikleri güncellenirken bir hata oluştu.' });
  }
};

// Maç sonucuna göre oyuncu istatistiklerini güncelle
export const updatePlayerStatsFromMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId);

    if (!match || !match.score) {
      return res.status(404).json({ message: 'Maç bulunamadı veya henüz sonuçlanmamış.' });
    }

    // Gol atanların istatistiklerini güncelle
    for (const scorer of match.score.scorers.homeTeam) {
      await Player.findByIdAndUpdate(
        scorer.player,
        { $inc: { goals: 1, matches: 1 } }
      );
    }

    for (const scorer of match.score.scorers.awayTeam) {
      await Player.findByIdAndUpdate(
        scorer.player,
        { $inc: { goals: 1, matches: 1 } }
      );
    }

    res.json({ message: 'Oyuncu istatistikleri güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Oyuncu istatistikleri güncellenirken bir hata oluştu.' });
  }
}; 