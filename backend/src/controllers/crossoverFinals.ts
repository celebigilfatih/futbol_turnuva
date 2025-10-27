import { Request, Response } from 'express';
import Tournament from '../models/Tournament';
import Match from '../models/Match';
import Team from '../models/Team';
import mongoose from 'mongoose';

interface GroupStanding {
  team: {
    id: string;
    name: string;
  };
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
}

interface CrossoverMatchConfig {
  stage: 'gold_final' | 'silver_final' | 'bronze_final' | 'prestige_final';
  label: string;
  homeTeam: {
    teamId: string;
    rank: number;
    group: string;
  };
  awayTeam: {
    teamId: string;
    rank: number;
    group: string;
  };
  date: Date;
  field: number;
}

// Get group standings for crossover configuration
export const getGroupStandings = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId).populate('groups.teams');
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const matches = await Match.find({
      tournament: tournamentId,
      stage: 'group',
      status: 'completed'
    }).populate('homeTeam awayTeam');

    const standings: GroupStanding[] = [];

    for (const group of tournament.groups) {
      const groupMatches = matches.filter(m => m.group === group.name);
      const teamStats = new Map();

      // Initialize team stats
      for (const teamId of group.teams) {
        const team = await Team.findById(teamId);
        if (team) {
          teamStats.set(teamId.toString(), {
            team: { id: team._id.toString(), name: team.name },
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
        }
      }

      // Calculate stats from matches
      for (const match of groupMatches) {
        if (!match.score) continue;

        const homeId = match.homeTeam._id.toString();
        const awayId = match.awayTeam._id.toString();
        const homeStats = teamStats.get(homeId);
        const awayStats = teamStats.get(awayId);

        if (!homeStats || !awayStats) continue;

        homeStats.played++;
        awayStats.played++;
        homeStats.goalsFor += match.score.homeTeam;
        homeStats.goalsAgainst += match.score.awayTeam;
        awayStats.goalsFor += match.score.awayTeam;
        awayStats.goalsAgainst += match.score.homeTeam;

        if (match.score.homeTeam > match.score.awayTeam) {
          homeStats.won++;
          homeStats.points += 3;
          awayStats.lost++;
        } else if (match.score.homeTeam < match.score.awayTeam) {
          awayStats.won++;
          awayStats.points += 3;
          homeStats.lost++;
        } else {
          homeStats.drawn++;
          awayStats.drawn++;
          homeStats.points++;
          awayStats.points++;
        }

        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
      }

      // Sort teams in group and assign ranks
      const groupStandings = Array.from(teamStats.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      groupStandings.forEach((standing, index) => {
        standing.rank = index + 1;
        standings.push(standing);
      });
    }

    res.json({ data: standings });
  } catch (error) {
    console.error('Error getting group standings:', error);
    res.status(500).json({ message: 'Error fetching group standings' });
  }
};

// Create crossover final matches
export const createCrossoverFinals = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const { matches }: { matches: CrossoverMatchConfig[] } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Delete existing final matches
    await Match.deleteMany({
      tournament: tournamentId,
      stage: { $in: ['gold_final', 'silver_final', 'bronze_final', 'prestige_final'] }
    });

    // Create new crossover matches
    const createdMatches = [];
    for (const matchConfig of matches) {
      const match = new Match({
        tournament: tournamentId,
        homeTeam: matchConfig.homeTeam.teamId,
        awayTeam: matchConfig.awayTeam.teamId,
        date: matchConfig.date,
        field: matchConfig.field,
        stage: matchConfig.stage,
        finalStageLabel: matchConfig.label,
        status: 'scheduled',
        extraTimeEnabled: tournament.extraTimeEnabled,
        penaltyShootoutEnabled: tournament.penaltyShootoutEnabled,
        crossoverInfo: {
          homeTeamRank: matchConfig.homeTeam.rank,
          awayTeamRank: matchConfig.awayTeam.rank,
          homeTeamGroup: matchConfig.homeTeam.group,
          awayTeamGroup: matchConfig.awayTeam.group
        }
      });

      await match.save();
      createdMatches.push(match);
    }

    // Update tournament status
    await Tournament.findByIdAndUpdate(tournamentId, {
      status: 'knockout_stage'
    });

    res.json({
      message: 'Crossover finals created successfully',
      data: createdMatches
    });
  } catch (error) {
    console.error('Error creating crossover finals:', error);
    res.status(500).json({ message: 'Error creating crossover finals' });
  }
};

// Get crossover finals configuration
export const getCrossoverFinals = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({
      tournament: tournamentId,
      stage: { $in: ['gold_final', 'silver_final', 'bronze_final', 'prestige_final'] }
    }).populate('homeTeam awayTeam');

    res.json({ data: matches });
  } catch (error) {
    console.error('Error getting crossover finals:', error);
    res.status(500).json({ message: 'Error fetching crossover finals' });
  }
};

// Update crossover match
export const updateCrossoverMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const updateData = req.body;

    const match = await Match.findByIdAndUpdate(
      matchId,
      { $set: updateData },
      { new: true }
    ).populate('homeTeam awayTeam');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json({ data: match });
  } catch (error) {
    console.error('Error updating crossover match:', error);
    res.status(500).json({ message: 'Error updating crossover match' });
  }
};

// Delete crossover finals
export const deleteCrossoverFinals = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    const result = await Match.deleteMany({
      tournament: tournamentId,
      stage: { $in: ['gold_final', 'silver_final', 'bronze_final', 'prestige_final'] }
    });

    res.json({
      message: 'Crossover finals deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting crossover finals:', error);
    res.status(500).json({ message: 'Error deleting crossover finals' });
  }
};
