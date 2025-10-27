import { Request, Response } from 'express';
import Match from '../models/Match';
import Tournament from '../models/Tournament';
import mongoose from 'mongoose';
import { Types } from 'mongoose';

// Tüm maçları getir
export const getAllMatches = async (req: Request, res: Response) => {
  try {
    const matches = await Match.find()
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('winner')
      .sort({ date: 1 });

    res.json({
      data: matches,
      total: matches.length,
      page: 1,
      limit: matches.length,
      totalPages: 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Maçlar getirilirken bir hata oluştu.' });
  }
};

// Turnuvaya göre maçları getir
export const getMatchesByTournament = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({ tournament: tournamentId })
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('winner')
      .sort({ date: 1 });

    res.json({
      data: matches,
      total: matches.length,
      page: 1,
      limit: matches.length,
      totalPages: 1
    });
  } catch (error) {
    res.status(500).json({ message: 'Maçlar getirilirken bir hata oluştu.' });
  }
};

// Tek maç getir
export const getMatchById = async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('winner');

    if (!match) {
      return res.status(404).json({ message: 'Maç bulunamadı.' });
    }

    res.json({ data: match });
  } catch (error) {
    res.status(500).json({ message: 'Maç getirilirken bir hata oluştu.' });
  }
};

// Yeni maç oluştur
export const createMatch = async (req: Request, res: Response) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.status(201).json({ data: match });
  } catch (error) {
    res.status(400).json({ message: 'Maç oluşturulurken bir hata oluştu.' });
  }
};

// Maç güncelle
export const updateMatch = async (req: Request, res: Response) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ message: 'Maç bulunamadı.' });
    }

    res.json({ data: match });
  } catch (error) {
    res.status(400).json({ message: 'Maç güncellenirken bir hata oluştu.' });
  }
};

// Maç sil
export const deleteMatch = async (req: Request, res: Response) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Maç bulunamadı.' });
    }
    res.json({ message: 'Maç başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Maç silinirken bir hata oluştu.' });
  }
};

// Maç durumunu güncelle
export const updateMatchStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ message: 'Maç bulunamadı.' });
    }

    res.json({ data: match });
  } catch (error) {
    res.status(400).json({ message: 'Maç durumu güncellenirken bir hata oluştu.' });
  }
};

// Maç skoru güncelle
export const updateMatchScore = async (req: Request, res: Response) => {
  try {
    console.log('Request params:', req.params);
    console.log('Request URL:', req.url);
    console.log('Request path:', req.path);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { id } = req.params; // Changed from matchId to id to match route parameter
    const { homeTeamScore, awayTeamScore, scorers } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        message: 'Geçersiz maç ID',
        receivedId: id
      });
    }

    // Validate score data
    if (homeTeamScore === undefined || awayTeamScore === undefined) {
      return res.status(400).json({ 
        message: 'Skor değerleri eksik',
        received: { homeTeamScore, awayTeamScore }
      });
    }

    // Convert score values to numbers
    const homeScore = Number(homeTeamScore);
    const awayScore = Number(awayTeamScore);

    if (isNaN(homeScore) || isNaN(awayScore)) {
      return res.status(400).json({ 
        message: 'Geçersiz skor değerleri - sayısal değer olmalı',
        received: { homeTeamScore, awayTeamScore },
        converted: { homeScore, awayScore }
      });
    }

    // Validate scorers
    if (!scorers || typeof scorers !== 'object') {
      return res.status(400).json({ 
        message: 'Geçersiz gol atanlar verisi',
        received: scorers
      });
    }

    // Create the score object
    const scoreUpdate = {
      homeTeam: homeScore,
      awayTeam: awayScore,
      scorers: {
        homeTeam: Array.isArray(scorers.homeTeam) ? scorers.homeTeam : [],
        awayTeam: Array.isArray(scorers.awayTeam) ? scorers.awayTeam : []
      }
    };

    console.log('Score update object:', JSON.stringify(scoreUpdate, null, 2));

    const match = await Match.findByIdAndUpdate(
      id,
      {
        $set: {
          score: scoreUpdate,
          status: 'completed'
        }
      },
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('tournament')
    .populate('homeTeam')
    .populate('awayTeam');

    if (!match) {
      return res.status(404).json({ 
        message: 'Maç bulunamadı',
        matchId: id
      });
    }

    console.log('Updated match:', JSON.stringify(match, null, 2));

    res.json({
      message: 'Maç skoru güncellendi',
      data: match
    });
  } catch (error) {
    console.error('Maç skoru güncellenirken hata:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası',
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error'
    });
  }
};

// İstatistikleri güncelle
export const updateMatchStats = async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { $set: { stats } },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({ message: 'Maç bulunamadı.' });
    }

    res.json({ data: match });
  } catch (error) {
    res.status(400).json({ message: 'İstatistikler güncellenirken bir hata oluştu.' });
  }
};

// Puan durumunu hesapla ve getir
export const getStandings = async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.tournamentId;
    console.log('Getting standings for tournament:', tournamentId);

    const tournament = await Tournament.findById(tournamentId).populate('groups.teams');
    console.log('Found tournament:', tournament ? 'Yes' : 'No');

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Turnuvadaki sadece grup maçlarını getir
    const matches = await Match.find({
      tournament: tournamentId,
      stage: 'group',
      status: 'completed'
    }).populate('homeTeam awayTeam');

    console.log('Found completed matches:', matches.length);

    // Takımların puan durumunu hesapla
    const standings = new Map();

    // Her takım için başlangıç değerlerini ayarla
    tournament.groups.forEach(group => {
      console.log('Processing group:', group.name, 'with teams:', group.teams.length);
      group.teams.forEach(team => {
        if (!team) {
          console.log('Invalid team found in group:', group.name);
          return;
        }

        const teamId = (team as any)._id?.toString() || team.toString();
        const teamName = (team as any).name || 'Unknown Team';
        console.log(`  - Adding team ${teamName} (${teamId}) to ${group.name}`);

        standings.set(teamId, {
          team: {
            id: teamId,
            name: teamName
          },
          group: group.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        });
      });
    });

    // Maç sonuçlarına göre puan durumunu güncelle (sadece grup maçları)
    matches.forEach(match => {
      if (!match.score) {
        console.log('Match without score found:', match._id);
        return;
      }

      // Sadece grup sahası maçlarını say
      if (match.stage !== 'group' || !match.group) {
        console.log('Skipping non-group match:', match._id);
        return;
      }

      const homeTeamId = match.homeTeam._id.toString();
      const awayTeamId = match.awayTeam._id.toString();
      const homeTeamStats = standings.get(homeTeamId);
      const awayTeamStats = standings.get(awayTeamId);

      if (!homeTeamStats || !awayTeamStats) {
        console.log('Team stats not found for match:', match._id);
        console.log('Home team:', homeTeamId, 'Away team:', awayTeamId);
        return;
      }

      // Maçın grubunun doğru olduğundan emin ol
      if (homeTeamStats.group !== match.group || awayTeamStats.group !== match.group) {
        console.log('Match group mismatch:', match._id, 'Match group:', match.group, 'Home team group:', homeTeamStats.group, 'Away team group:', awayTeamStats.group);
        return;
      }

      // Oynanan maç sayısını güncelle
      homeTeamStats.played++;
      awayTeamStats.played++;

      // Gol istatistiklerini güncelle
      homeTeamStats.goalsFor += match.score.homeTeam;
      homeTeamStats.goalsAgainst += match.score.awayTeam;
      awayTeamStats.goalsFor += match.score.awayTeam;
      awayTeamStats.goalsAgainst += match.score.homeTeam;

      // Galibiyet, beraberlik, mağlubiyet ve puanları güncelle
      if (match.score.homeTeam > match.score.awayTeam) {
        homeTeamStats.won++;
        homeTeamStats.points += 3;
        awayTeamStats.lost++;
      } else if (match.score.homeTeam < match.score.awayTeam) {
        awayTeamStats.won++;
        awayTeamStats.points += 3;
        homeTeamStats.lost++;
      } else {
        homeTeamStats.drawn++;
        awayTeamStats.drawn++;
        homeTeamStats.points += 1;
        awayTeamStats.points += 1;
      }

      // Averajları güncelle
      homeTeamStats.goalDifference = homeTeamStats.goalsFor - homeTeamStats.goalsAgainst;
      awayTeamStats.goalDifference = awayTeamStats.goalsFor - awayTeamStats.goalsAgainst;
    });

    const standingsArray = Array.from(standings.values());
    console.log('Final standings count:', standingsArray.length);
    console.log('Teams in standings:', standingsArray.map(s => `${s.team.name} (${s.group})`).join(', '));

    res.json({ 
      data: standingsArray
    });
  } catch (error) {
    console.error('Puan durumu hesaplama hatası:', error);
    res.status(500).json({ message: 'Puan durumu hesaplanırken bir hata oluştu.' });
  }
};