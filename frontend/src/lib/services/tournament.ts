import type { Tournament, ApiResponse, GenerateFixtureResponse, DeleteFixtureResponse, DeleteTournamentResponse, PaginatedResponse, TournamentGroup } from '@/types/api';
import { get, post, put, del, getPaginated } from './api';

export interface CreateTournamentData extends Record<string, unknown> {
  name: string;
  startDate: string;
  endDate: string;
  numberOfFields: number;
  matchDuration: number;
  breakDuration: number;
  teamsPerGroup: number;
  numberOfGroups: number;
  startTime: string;
  endTime: string;
  lunchBreakStart: string;
  lunchBreakDuration: number;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

export interface UpdateTournamentData extends Partial<CreateTournamentData> {
  status?: Tournament['status'];
}

const ENDPOINT = '/tournaments';

export const tournamentService = {
  // Turnuvaları listele
  getAll: async (page?: number, limit?: number): Promise<PaginatedResponse<Tournament>> => {
    return getPaginated<Tournament>(ENDPOINT, page, limit);
  },

  // Tek turnuva getir
  getById: async (id: string): Promise<ApiResponse<Tournament>> => {
    return get<Tournament>(`${ENDPOINT}/${id}`);
  },

  // Yeni turnuva oluştur
  create: async (data: CreateTournamentData): Promise<ApiResponse<Tournament>> => {
    return post<Tournament>(ENDPOINT, data);
  },

  // Turnuva güncelle
  update: async (id: string, data: UpdateTournamentData): Promise<ApiResponse<Tournament>> => {
    return put<Tournament>(`${ENDPOINT}/${id}`, data);
  },

  // Turnuva sil
  delete: async (id: string): Promise<ApiResponse<DeleteTournamentResponse>> => {
    return del<DeleteTournamentResponse>(`${ENDPOINT}/${id}`);
  },

  // Turnuvaya takım ekle
  addTeam: async (tournamentId: string, teamId: string, groupId: string): Promise<ApiResponse<Tournament>> => {
    return post<Tournament>(`${ENDPOINT}/${tournamentId}/teams`, { teamId, groupId });
  },

  // Turnuvadan takım çıkar
  removeTeam: async (tournamentId: string, teamId: string): Promise<ApiResponse<Tournament>> => {
    return del<Tournament>(`${ENDPOINT}/${tournamentId}/teams/${teamId}`);
  },

  // Turnuva gruplarını getir
  getGroups: async (id: string): Promise<ApiResponse<TournamentGroup[]>> => {
    return get<TournamentGroup[]>(`${ENDPOINT}/${id}/groups`);
  },

  // Fikstür oluştur
  generateFixture: async (id: string): Promise<ApiResponse<GenerateFixtureResponse>> => {
    return post<GenerateFixtureResponse>(`${ENDPOINT}/${id}/fixture`, {});
  },

  // Fikstürü sil
  deleteFixture: async (id: string): Promise<ApiResponse<DeleteFixtureResponse>> => {
    return del<DeleteFixtureResponse>(`${ENDPOINT}/${id}/fixture`);
  },

  // Çeyrek final maçlarını oluştur
  generateQuarterFinals: async (id: string): Promise<ApiResponse<GenerateFixtureResponse>> => {
    return post<GenerateFixtureResponse>(`${ENDPOINT}/${id}/quarter-finals`, {});
  },

  // Yarı final maçlarını oluştur
  generateSemiFinals: async (id: string): Promise<ApiResponse<GenerateFixtureResponse>> => {
    return post<GenerateFixtureResponse>(`${ENDPOINT}/${id}/semi-finals`, {});
  },

  // Final maçını oluştur
  generateFinal: async (id: string): Promise<ApiResponse<GenerateFixtureResponse>> => {
    return post<GenerateFixtureResponse>(`${ENDPOINT}/${id}/final`, {});
  },

  // Knockout maçlarını nitelikli takımlarla güncelle
  updateKnockoutTeamsWithQualified: async (id: string): Promise<ApiResponse<any>> => {
    return put<any>(`${ENDPOINT}/${id}/knockout/update-teams`, {});
  }
}; 