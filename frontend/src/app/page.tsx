'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Activity,
  Timer,
  Goal,
  Medal,
  ChevronRight,
  Table
} from 'lucide-react';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import { cn } from '@/lib/utils';
import { TopScorers } from '@/components/TopScorers';

export default function DashboardPage() {
  // Aktif turnuvaları getir
  const { data: tournamentsResponse } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await tournamentService.getAll();
      return response;
    },
  });

  // Yaklaşan maçları getir
  const { data: matchesResponse } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const response = await matchService.getAll();
      return response;
    },
  });

  const tournaments = tournamentsResponse?.data || [];
  const matches = matchesResponse?.data || [];

  // Aktif turnuva sayısı
  const activeTournaments = tournaments.filter(t => t.status !== 'completed').length;
  
  // Toplam takım sayısı
  const totalTeams = tournaments.reduce((acc, t) => acc + t.groups.reduce((sum, g) => sum + g.teams.length, 0), 0);
  
  // Bugünkü maç sayısı
  const today = new Date().toISOString().split('T')[0];
  const todayMatches = matches.filter(m => m.date.split('T')[0] === today).length;

  // Yaklaşan maçlar (en fazla 5 tane)
  const upcomingMatches = matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Aktif turnuvalar (en fazla 3 tane)
  const activeTourn = tournaments
    .filter(t => t.status !== 'completed')
    .slice(0, 3);

  // Puan durumu için yeni query
  const { data: standingsResponse } = useQuery({
    queryKey: ['standings', activeTourn?.[0]?._id],
    queryFn: async () => {
      if (!activeTourn?.[0]?._id) return { data: [] };
      return matchService.getStandings(activeTourn[0]._id);
    },
    enabled: !!activeTourn?.[0]?._id
  });

  const standings = standingsResponse?.data || [];

  // Grupları ayır
  const groupedStandings = standings.reduce((acc, standing) => {
    if (!acc[standing.group]) {
      acc[standing.group] = [];
    }
    acc[standing.group].push(standing);
    return acc;
  }, {} as Record<string, typeof standings>);

  const activeTournament = tournaments.find(t => t.status === 'group_stage' || t.status === 'knockout_stage');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Turnuva yönetim sistemine hoş geldiniz
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktif Turnuvalar</p>
                  <p className="text-2xl font-bold">{activeTournaments}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Takım</p>
                  <p className="text-2xl font-bold">{totalTeams}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bugünkü Maçlar</p>
                  <p className="text-2xl font-bold">{todayMatches}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Medal className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tamamlanan Maçlar</p>
                  <p className="text-2xl font-bold">{matches.filter(m => m.status === 'completed').length}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ana İçerik Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Yaklaşan Maçlar */}
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Yaklaşan Maçlar</CardTitle>
            <Link href="/matches/fixtures">
              <Button variant="ghost" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match._id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="grid gap-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(match.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="font-medium">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(match.date).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {match.group}
                  </Badge>
                </div>
              ))}
              {upcomingMatches.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Yaklaşan maç bulunmuyor
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aktif Turnuvalar */}
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Aktif Turnuvalar</CardTitle>
            <Link href="/tournaments">
              <Button variant="ghost" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTourn.map((tournament) => (
                <div
                  key={tournament._id}
                  className="flex items-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{tournament.name}</p>
                    <div className="text-sm text-muted-foreground">
                      {new Date(tournament.startDate).toLocaleDateString('tr-TR')} - {new Date(tournament.endDate).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "ml-2",
                      tournament.status === 'group_stage'
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : tournament.status === 'knockout_stage'
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-green-100 text-green-800 border-green-300"
                    )}
                  >
                    {tournament.status === 'group_stage'
                      ? 'Grup Aşaması'
                      : tournament.status === 'knockout_stage'
                      ? 'Eleme Aşaması'
                      : 'Tamamlandı'}
                  </Badge>
                </div>
              ))}
              {activeTourn.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aktif turnuva bulunmuyor
                </div>
              )}
        </div>
          </CardContent>
        </Card>

        {/* Gol Krallığı */}
        {activeTournament && (
          <div className="md:col-span-2 lg:col-span-1">
            <TopScorers tournamentId={activeTournament._id} limit={5} />
          </div>
        )}
      </div>

      {/* Puan Durumu */}
      {activeTourn?.[0] && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Table className="h-5 w-5 text-primary" />
                Puan Durumu
              </CardTitle>
              <p className="text-sm text-muted-foreground">{activeTourn[0].name}</p>
            </div>
            <Link href={`/matches/standings?tournamentId=${activeTourn[0]._id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                Tümünü Gör
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedStandings).map(([groupName, groupStandings]) => (
                <div key={`group-${groupName}`} className="space-y-2">
                  <Badge variant="outline" className="mb-2 bg-muted">
                    {groupName}
                  </Badge>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th key="position-header" className="w-10 text-center p-2 text-sm font-medium">#</th>
                            <th key="team-header" className="text-left p-2 text-sm font-medium">Takım</th>
                            <th key="played-header" className="w-10 p-2 text-sm font-medium text-center">O</th>
                            <th key="won-header" className="w-10 p-2 text-sm font-medium text-center">G</th>
                            <th key="drawn-header" className="w-10 p-2 text-sm font-medium text-center">B</th>
                            <th key="lost-header" className="w-10 p-2 text-sm font-medium text-center">M</th>
                            <th key="goalDiff-header" className="w-12 p-2 text-sm font-medium text-center">AV</th>
                            <th key="points-header" className="w-12 p-2 text-sm font-medium text-center">P</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupStandings
                            .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
                            .map((standing, index) => (
                              <tr 
                                key={`${groupName}-team-${standing.team.id}`}
                                className={cn(
                                  "border-t transition-colors",
                                  index < 2 ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50" : "hover:bg-muted/50"
                                )}
                              >
                                <td className="p-2 text-sm text-center font-medium">
                                  {index + 1}
                                </td>
                                <td className="p-2 text-sm font-medium">
                                  {standing.team.name}
                                </td>
                                <td className="p-2 text-sm text-center tabular-nums">
                                  {standing.played}
                                </td>
                                <td className="p-2 text-sm text-center tabular-nums">
                                  {standing.won}
                                </td>
                                <td className="p-2 text-sm text-center tabular-nums">
                                  {standing.drawn}
                                </td>
                                <td className="p-2 text-sm text-center tabular-nums">
                                  {standing.lost}
                                </td>
                                <td className={cn(
                                  "p-2 text-sm text-center font-medium tabular-nums",
                                  standing.goalDifference > 0 ? "text-green-600" : 
                                  standing.goalDifference < 0 ? "text-red-600" : ""
                                )}>
                                  {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                                </td>
                                <td className="p-2 text-sm text-center font-bold tabular-nums">
                                  {standing.points}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                  </div>
                  </div>
                </div>
              ))}
              {Object.keys(groupedStandings).length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Bu turnuva için henüz puan durumu bulunmuyor
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
