'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  Target,
  TrendingUp,
  Shield,
  Flame,
  Star,
  Award
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

  // İstatistikler
  const activeTournaments = tournaments.filter(t => t.status !== 'completed').length;
  const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
  const totalTeams = tournaments.reduce((acc, t) => acc + t.groups.reduce((sum, g) => sum + g.teams.length, 0), 0);
  
  // Maç istatistikleri
  const today = new Date().toISOString().split('T')[0];
  const todayMatches = matches.filter(m => m.date.split('T')[0] === today).length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;
  const totalGoals = matches
    .filter(m => m.status === 'completed' && m.score)
    .reduce((acc, m) => acc + (m.score?.homeTeam || 0) + (m.score?.awayTeam || 0), 0);

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
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 border">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Turnuva yönetim sistemine hoş geldiniz
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <Trophy className="h-32 w-32" />
        </div>
      </div>

      {/* İstatistik Kartları - Enhanced */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktif Turnuvalar</p>
                  <p className="text-3xl font-bold">{activeTournaments}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedTournaments} tamamlandı
                  </p>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Takım</p>
                  <p className="text-3xl font-bold">{totalTeams}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tournaments.length} turnuvada
                  </p>
                </div>
              </div>
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bugünkü Maçlar</p>
                  <p className="text-3xl font-bold">{todayMatches}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scheduledMatches} bekliyor
                  </p>
                </div>
              </div>
              <Flame className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full -mr-10 -mt-10" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <Goal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Gol</p>
                  <p className="text-3xl font-bold">{totalGoals}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedMatches} maçta
                  </p>
                </div>
              </div>
              <Target className="h-4 w-4 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ana İçerik Grid - Enhanced */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Yaklaşan Maçlar */}
        <Card className="md:col-span-1 lg:col-span-1 border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Yaklaşan Maçlar
              </CardTitle>
              <CardDescription>Bugün ve yarın</CardDescription>
            </div>
            <Link href="/matches/fixtures">
              <Button variant="ghost" size="sm" className="gap-2 text-blue-600">
                Tümü
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMatches.map((match, index) => (
                <div
                  key={match._id}
                  className="group relative flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-card to-card hover:from-blue-50 hover:to-card dark:hover:from-blue-950/20 dark:hover:to-card transition-all duration-200 hover:shadow-md"
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="grid gap-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(match.date).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="font-semibold text-sm">
                      {match.homeTeam.name} <span className="text-muted-foreground font-normal">vs</span> {match.awayTeam.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-background">
                        {match.group}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingMatches.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Yaklaşan maç bulunmuyor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aktif Turnuvalar */}
        <Card className="md:col-span-1 lg:col-span-1 border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                Aktif Turnuvalar
              </CardTitle>
              <CardDescription>Devam eden organizasyonlar</CardDescription>
            </div>
            <Link href="/tournaments">
              <Button variant="ghost" size="sm" className="gap-2 text-purple-600">
                Tümü
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTourn.map((tournament) => (
                <Link key={tournament._id} href={`/tournaments/${tournament._id}`}>
                  <div className="group relative p-4 rounded-xl border bg-gradient-to-r from-card to-card hover:from-purple-50 hover:to-card dark:hover:from-purple-950/20 dark:hover:to-card transition-all duration-200 hover:shadow-md cursor-pointer">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-purple-500" />
                          <p className="font-semibold">{tournament.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(tournament.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(tournament.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                            <Users className="h-3 w-3" />
                            <span>{tournament.groups.reduce((sum, g) => sum + g.teams.length, 0)} takım</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                            <Shield className="h-3 w-3" />
                            <span>{tournament.groups.length} grup</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "ml-2 shadow-sm",
                          tournament.status === 'group_stage'
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : tournament.status === 'knockout_stage'
                            ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400"
                        )}
                      >
                        {tournament.status === 'group_stage'
                          ? 'Grup'
                          : tournament.status === 'knockout_stage'
                          ? 'Eleme'
                          : 'Bitti'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
              {activeTourn.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Aktif turnuva bulunmuyor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gol Krallığı */}
        {activeTournament && (
          <div className="md:col-span-2 lg:col-span-1">
            <Card className="border-t-4 border-t-amber-500 h-full">
              <CardHeader className="pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Gol Krallığı
                  </CardTitle>
                  <CardDescription>En skorer oyuncular</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <TopScorers tournamentId={activeTournament._id} limit={5} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Puan Durumu */}
      {activeTourn?.[0] && (
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Table className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Puan Durumu
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-3 w-3" />
                {activeTourn[0].name}
              </CardDescription>
            </div>
            <Link href={`/matches/standings?tournamentId=${activeTourn[0]._id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                Detaylı Tablo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedStandings).map(([groupName, groupStandings]) => (
                <div key={`group-${groupName}`} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-semibold">
                      {groupName}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="rounded-xl border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-muted/80 to-muted/40">
                            <th key="position-header" className="w-10 text-center p-3 text-xs font-semibold uppercase tracking-wide">#</th>
                            <th key="team-header" className="text-left p-3 text-xs font-semibold uppercase tracking-wide">Takım</th>
                            <th key="played-header" className="w-10 p-3 text-xs font-semibold uppercase tracking-wide text-center">O</th>
                            <th key="won-header" className="w-10 p-3 text-xs font-semibold uppercase tracking-wide text-center">G</th>
                            <th key="drawn-header" className="w-10 p-3 text-xs font-semibold uppercase tracking-wide text-center">B</th>
                            <th key="lost-header" className="w-10 p-3 text-xs font-semibold uppercase tracking-wide text-center">M</th>
                            <th key="goalDiff-header" className="w-12 p-3 text-xs font-semibold uppercase tracking-wide text-center">AV</th>
                            <th key="points-header" className="w-12 p-3 text-xs font-semibold uppercase tracking-wide text-center">P</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card">
                          {groupStandings
                            .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
                            .map((standing, index) => (
                              <tr 
                                key={`${groupName}-team-${standing.team.id}`}
                                className={cn(
                                  "border-t transition-all duration-200",
                                  index < 2 
                                    ? "bg-gradient-to-r from-emerald-50/50 to-transparent hover:from-emerald-100/60 dark:from-emerald-950/20 dark:hover:from-emerald-950/30" 
                                    : "hover:bg-muted/30"
                                )}
                              >
                                <td className="p-3 text-center relative">
                                  {index < 2 && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                                  )}
                                  <div className={cn(
                                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-950 shadow-sm" :
                                    index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900 shadow-sm" :
                                    index === 2 ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-950 shadow-sm" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{standing.team.name}</span>
                                    {index < 2 && (
                                      <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center tabular-nums font-medium">
                                  {standing.played}
                                </td>
                                <td className="p-3 text-center tabular-nums">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                                    {standing.won}
                                  </span>
                                </td>
                                <td className="p-3 text-center tabular-nums">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold">
                                    {standing.drawn}
                                  </span>
                                </td>
                                <td className="p-3 text-center tabular-nums">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                                    {standing.lost}
                                  </span>
                                </td>
                                <td className={cn(
                                  "p-3 text-center font-bold tabular-nums",
                                  standing.goalDifference > 0 ? "text-green-600 dark:text-green-400" : 
                                  standing.goalDifference < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                                )}>
                                  {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                                    {standing.points}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                  </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                      <span>Elemeye kalan takımlar</span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(groupedStandings).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Table className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Bu turnuva için henüz puan durumu bulunmuyor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
