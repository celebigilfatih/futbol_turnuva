// Turnuva tipleri
export interface Tournament {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  numberOfFields: number;
  matchDuration: number;
  breakDuration: number;
  teamsPerGroup: number;
  startTime: string;
  endTime: string;
  lunchBreakStart: string;
  lunchBreakDuration: number;
  groups: TournamentGroup[];
  status: 'pending' | 'group_stage' | 'knockout_stage' | 'completed';
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
  location: string;
  description: string;
  maxTeams: number;
  registrationDeadline: string;
  organizerName: string;
  organizerContact: string;
  rules: string[];
}

export interface TournamentGroup {
  _id: string;
  name: string;
  teams: Team[];
}

// Takım tipleri
export interface Team {
  _id: string;
  name: string;
  logo?: string;
  players: Player[];
  groupStats: TeamStats;
}

export interface Player {
  _id: string;
  name: string;
  number: number;
  position?: string;
  team: Team;
  tournament: Tournament;
  goals: number;
  assists: number;
  matches: number;
  minutesPlayed: number;
}

export interface Scorer {
  player: string;
  minute: number;
}

export interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

// Maç tipleri
export interface Match {
  _id: string;
  tournament: Tournament;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  field: number;
  stage: 'group' | 'quarter_final' | 'semi_final' | 'final' | 'gold_final' | 'silver_final' | 'bronze_final' | 'prestige_final';
  group?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: {
    homeTeam: number;
    awayTeam: number;
    scorers: {
      homeTeam: Scorer[];
      awayTeam: Scorer[];
    };
  };
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
  winner?: Team;
  finalStageLabel?: string;
  crossoverInfo?: {
    homeTeamRank: number;
    awayTeamRank: number;
    homeTeamGroup: string;
    awayTeamGroup: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MatchScore {
  homeTeam: number;
  awayTeam: number;
  penalties?: {
    homeTeam: number;
    awayTeam: number;
  };
}

// API yanıt tipleri
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fikstür yanıt tipleri
export interface GenerateFixtureResponse {
  message: string;
  matches: number;
}

export interface DeleteFixtureResponse {
  message: string;
  deletedMatches: number;
}

// Turnuva yanıt tipleri
export interface DeleteTournamentResponse {
  message: string;
  deletedData: {
    tournament: number;
    teams: number;
    matches: number;
  };
}

// Takım yanıt tipleri
export interface AddTeamResponse {
  message: string;
  team: Team;
}

export interface RemoveTeamResponse {
  message: string;
  teamId: string;
}

// Maç yanıt tipleri
export interface UpdateMatchScoreResponse {
  message: string;
  match: Match;
}

export interface UpdateMatchStatusResponse {
  message: string;
  match: Match;
}

export interface TeamStanding {
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
}

/* Adding ScoreInput interface if it doesn't exist */
export interface ScoreInput {
  homeTeamScore: number;
  awayTeamScore: number;
  scorers: {
    homeTeam: Array<{ player: string; minute: number }>;
    awayTeam: Array<{ player: string; minute: number }>;
  };
}