'use client';
'use client';

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { teamService } from '@/lib/services/team'
import { matchService } from '@/lib/services/match'
import type { Team } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Goal, ChevronRight, Shield, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useMemo } from 'react'

interface TeamWithStats extends Team {
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
}

export default function TeamsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'all' | 'points' | 'goals' | 'wins'>('all');

  const deleteMutation = useMutation({
    mutationFn: teamService.delete,
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Takım başarıyla silindi.',
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Hata',
        description: ('response' in error && error.response?.data?.message) || 'Takım silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu takımı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Takım silme hatası:', error);
      }
    }
  };

  // Fetch teams
  const { data: teamsResponse, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      return teamService.getAll(1, 100);
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch matches to calculate live statistics
  const { data: matchesResponse, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      return matchService.getAll();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const teams = teamsResponse?.data || [];
  const matches = matchesResponse?.data || [];

  // Calculate team statistics from completed matches
  const teamsWithStats = useMemo(() => {
    const teamStatsMap = new Map<string, TeamWithStats['stats']>();

    // Initialize stats for all teams
    teams.forEach(team => {
      teamStatsMap.set(team._id, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    });

    // Calculate from completed matches
    matches.forEach(match => {
      if (match.status !== 'completed' || !match.score) return;

      const homeTeamId = typeof match.homeTeam === 'string' ? match.homeTeam : match.homeTeam._id;
      const awayTeamId = typeof match.awayTeam === 'string' ? match.awayTeam : match.awayTeam._id;

      const homeStats = teamStatsMap.get(homeTeamId);
      const awayStats = teamStatsMap.get(awayTeamId);

      if (!homeStats || !awayStats) return;

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
        homeStats.points += 1;
        awayStats.points += 1;
      }
    });

    return teams.map(team => ({
      ...team,
      stats: teamStatsMap.get(team._id) || {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      },
    }));
  }, [teams, matches]);

  // Sort teams based on selected criteria
  const sortedTeams = useMemo(() => {
    const sorted = [...teamsWithStats];
    switch (sortBy) {
      case 'points':
        return sorted.sort((a, b) => {
          if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
          return (b.stats.goalsFor - b.stats.goalsAgainst) - (a.stats.goalsFor - a.stats.goalsAgainst);
        });
      case 'goals':
        return sorted.sort((a, b) => b.stats.goalsFor - a.stats.goalsFor);
      case 'wins':
        return sorted.sort((a, b) => b.stats.won - a.stats.won);
      default:
        return sorted;
    }
  }, [teamsWithStats, sortBy]);

  const isLoading = teamsLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Takımlar</h1>
          <p className="text-muted-foreground">Turnuvalara katılan tüm takımlar</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Takımlar</SelectItem>
              <SelectItem value="points">Puana Göre</SelectItem>
              <SelectItem value="goals">Gol Sayısına Göre</SelectItem>
              <SelectItem value="wins">Galibiyete Göre</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Link href="/teams/create" className="w-full sm:w-auto">
              <Button className="w-full">Yeni Takım Oluştur</Button>
            </Link>
          )}
        </div>
      </div>

      {sortedTeams && sortedTeams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTeams.map((team: any) => (
            <Card key={team._id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>{team.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    {team.players.length} Oyuncu
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">Galibiyet</span>
                      </div>
                      <div className="text-2xl font-bold">{team.stats.won}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Goal className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm font-medium">Gol</span>
                      </div>
                      <div className="text-2xl font-bold">{team.stats.goalsFor}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm font-medium">Puan</span>
                      </div>
                      <div className="text-2xl font-bold">{team.stats.points}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>Maç: {team.stats.played}</span>
                    <span>•</span>
                    <span>Beraberlik: {team.stats.drawn}</span>
                    <span>•</span>
                    <span>Mağlubiyet: {team.stats.lost}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Link href={`/teams/${team._id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full space-x-2">
                      <span>Detaylar</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href={`/teams/${team._id}/edit`} className="w-full sm:w-auto">
                      <Button size="sm" className="w-full">Düzenle</Button>
                    </Link>
                  )}
                </div>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(team._id)}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 bg-red-100 dark:bg-red-900/20 text-destructive hover:text-destructive-foreground hover:bg-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-muted-foreground">Yüklen iyor...</div>
            </>
          ) : (
            <>
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-xl font-semibold mb-2">Henüz takım bulunmuyor</div>
              <div className="text-muted-foreground mb-6">
                Turnuvaya katılacak takımları oluşturmak için yeni takım ekleyin.
              </div>
              {isAdmin && (
                <Link href="/teams/create">
                  <Button>İlk Takımı Oluştur</Button>
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}