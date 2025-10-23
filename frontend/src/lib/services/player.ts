import { axiosInstance } from '../axios';
import { Player, ApiResponse } from '@/types/api';

interface TopScorer extends Player {
  goalsPerMatch: string;
  minutesPerGoal: string;
}

interface TopScorersResponse {
  data: TopScorer[];
}

export const playerService = {
  getTopScorers: async (tournamentId: string, limit?: number): Promise<TopScorer[]> => {
    const { data } = await axiosInstance.get<TopScorersResponse>(
      `/players/tournaments/${tournamentId}/top-scorers${limit ? `?limit=${limit}` : ''}`
    );
    return data.data;
  },

  updateStats: async (playerId: string, stats: { goals?: number; assists?: number; minutesPlayed?: number }): Promise<Player> => {
    const { data } = await axiosInstance.patch<ApiResponse<Player>>(`/players/${playerId}/stats`, stats);
    return data.data;
  },

  updateStatsFromMatch: async (matchId: string): Promise<ApiResponse<void>> => {
    const { data } = await axiosInstance.post<ApiResponse<void>>(`/players/matches/${matchId}/update-stats`);
    return data;
  }
}; 