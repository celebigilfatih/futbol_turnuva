import type { Team, ApiResponse, AddTeamResponse, RemoveTeamResponse, PaginatedResponse } from '@/types/api';
import { get, post, put, del, getPaginated } from './api';

export interface CreateTeamData extends Record<string, unknown> {
  name: string;
  players: {
    name: string;
    number: number;
    position?: string;
  }[];
}

export interface UpdateTeamData extends Partial<CreateTeamData> {
  groupStats?: Team['groupStats'];
}

export interface AddPlayerData extends Record<string, unknown> {
  name: string;
  number: number;
}

const ENDPOINT = '/teams';

export const teamService = {
  // Takımları listele
  getAll: async (page?: number, limit?: number): Promise<PaginatedResponse<Team>> => {
    return getPaginated<Team>(ENDPOINT, page, limit);
  },

  // Tek takım getir
  getById: async (id: string): Promise<ApiResponse<Team>> => {
    return get<Team>(`${ENDPOINT}/${id}`);
  },

  // Yeni takım oluştur
  create: async (data: CreateTeamData): Promise<ApiResponse<Team>> => {
    return post<Team>(ENDPOINT, data);
  },

  // Takım güncelle
  update: async (id: string, data: UpdateTeamData): Promise<ApiResponse<Team>> => {
    return put<Team>(`${ENDPOINT}/${id}`, data);
  },

  // Takım sil
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return del<void>(`${ENDPOINT}/${id}`);
  },

  // Oyuncu ekle
  addPlayer: async (teamId: string, data: AddPlayerData): Promise<ApiResponse<AddTeamResponse>> => {
    return post<AddTeamResponse>(`${ENDPOINT}/${teamId}/players`, data);
  },

  // Oyuncu güncelle
  updatePlayer: async (teamId: string, playerId: string, data: Partial<AddPlayerData>): Promise<ApiResponse<Team>> => {
    return put<Team>(`${ENDPOINT}/${teamId}/players/${playerId}`, data);
  },

  // Oyuncu sil
  removePlayer: async (teamId: string, playerId: string): Promise<ApiResponse<RemoveTeamResponse>> => {
    return del<RemoveTeamResponse>(`${ENDPOINT}/${teamId}/players/${playerId}`);
  },

  // Takım istatistiklerini getir
  getStats: async (id: string): Promise<ApiResponse<Team['groupStats']>> => {
    return get<Team['groupStats']>(`${ENDPOINT}/${id}/stats`);
  }
};