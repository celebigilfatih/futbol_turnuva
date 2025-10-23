import type { Match, ApiResponse, UpdateMatchStatusResponse, PaginatedResponse, TeamStanding, ScoreInput } from '@/types/api';
import { get, post, put, del, getPaginated } from './api';

export interface CreateMatchData extends Record<string, unknown> {
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  field: number;
  stage: Match['stage'];
  group?: string;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

export interface UpdateMatchData extends Partial<CreateMatchData> {
  status?: Match['status'];
}

export interface UpdateStatsData extends Record<string, unknown> {
  homeTeam: {
    shots: number;
    possession: number;
  };
  awayTeam: {
    shots: number;
    possession: number;
  };
}

const ENDPOINT = '/matches';

export const matchService = {
  // Maçları listele
  getAll: async (page?: number, limit?: number): Promise<PaginatedResponse<Match>> => {
    return getPaginated<Match>(ENDPOINT, page, limit);
  },

  // Turnuvaya göre maçları listele
  getByTournament: async (tournamentId: string, page?: number, limit?: number): Promise<PaginatedResponse<Match>> => {
    return getPaginated<Match>(`${ENDPOINT}/tournament/${tournamentId}`, page, limit);
  },

  // Tek maç getir
  getById: async (id: string): Promise<ApiResponse<Match>> => {
    return get<Match>(`${ENDPOINT}/${id}`);
  },

  // Yeni maç oluştur
  create: async (data: CreateMatchData): Promise<ApiResponse<Match>> => {
    return post<Match>(ENDPOINT, data);
  },

  // Maç güncelle
  update: async (id: string, data: Partial<CreateMatchData>): Promise<ApiResponse<Match>> => {
    return put<Match>(`${ENDPOINT}/${id}`, data);
  },

  // Maç sil
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return del<void>(`${ENDPOINT}/${id}`);
  },

  // Maç durumunu güncelle
  updateStatus: async (id: string, status: Match['status']): Promise<ApiResponse<UpdateMatchStatusResponse>> => {
    return put<UpdateMatchStatusResponse>(`${ENDPOINT}/${id}/status`, { status });
  },

  // Maç skoru güncelle
  updateScore: async (id: string, score: ScoreInput): Promise<ApiResponse<Match>> => {
    const requestBody = {
      homeTeamScore: Number(score.homeTeamScore),
      awayTeamScore: Number(score.awayTeamScore),
      scorers: {
        homeTeam: score.scorers.homeTeam.map(scorer => ({
          player: scorer.player,
          minute: Number(scorer.minute)
        })),
        awayTeam: score.scorers.awayTeam.map(scorer => ({
          player: scorer.player,
          minute: Number(scorer.minute)
        }))
      }
    };

    console.log('Score update request:', {
      url: `${ENDPOINT}/${id}/score`,
      method: 'PUT',
      body: JSON.stringify(requestBody, null, 2)
    });

    try {
      const response = await put<Match>(`${ENDPOINT}/${id}/score`, requestBody);
      console.log('Score update response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('Score update error:', error);
      throw error;
    }
  },

  // İstatistikleri güncelle
  updateStats: async (id: string, stats: UpdateStatsData): Promise<ApiResponse<Match>> => {
    return put<Match>(`${ENDPOINT}/${id}/stats`, stats);
  },

  // Maçı başlat
  start: async (id: string): Promise<ApiResponse<Match>> => {
    return put<Match>(`${ENDPOINT}/${id}/start`, {});
  },

  // Maçı bitir
  end: async (id: string): Promise<ApiResponse<Match>> => {
    return put<Match>(`${ENDPOINT}/${id}/end`, {});
  },

  // Maçı iptal et
  cancel: async (id: string): Promise<ApiResponse<Match>> => {
    return put<Match>(`${ENDPOINT}/${id}/cancel`, {});
  },

  // Aktif maçları getir
  getActive: async (): Promise<ApiResponse<Match[]>> => {
    return get<Match[]>(`${ENDPOINT}/active`);
  },

  // Günlük maç programını getir
  getDailySchedule: async (date: string): Promise<ApiResponse<Match[]>> => {
    return get<Match[]>(`${ENDPOINT}/schedule/${date}`);
  },

  // Turnuva maçlarını getir
  getTournamentMatches: async (tournamentId: string, page?: number, limit?: number): Promise<PaginatedResponse<Match>> => {
    return getPaginated<Match>(`${ENDPOINT}/tournament/${tournamentId}`, page, limit);
  },

  // Puan durumu getir
  getStandings: async (tournamentId: string): Promise<ApiResponse<TeamStanding[]>> => {
    console.log('Fetching standings for tournament:', tournamentId);
    try {
      const response = await get<TeamStanding[]>(`${ENDPOINT}/standings/${tournamentId}`);
      console.log('Standings response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  }
};