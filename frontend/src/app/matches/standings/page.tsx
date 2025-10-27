'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Suspense, useEffect, useState, useMemo } from 'react';

interface TeamStanding {
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

interface GroupStandings {
  [groupName: string]: TeamStanding[];
}

function StandingsContent() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Tüm turnuvaları getir
  const { data: tournamentsResponse } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      return tournamentService.getAll();
    },
  });

  const tournaments = tournamentsResponse?.data || [];
  const activeTournaments = tournaments.filter(t => t.status !== 'completed');

  // Seçili turnuvanın puan durumunu getir (auto-refresh every 5 seconds)
  const { data: standingsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: async () => {
      if (!tournamentId) {
        return { data: [] as TeamStanding[] };
      }
      const response = await matchService.getStandings(tournamentId);
      console.log('Standings response:', response);
      return response;
    },
    enabled: Boolean(tournamentId),
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  const standings = standingsResponse?.data || [];
  const selectedTournament = tournaments.find(t => t._id === tournamentId);
  
  // Debug log
  useEffect(() => {
    if (standings.length > 0) {
      const info = `Total teams: ${standings.length}, Groups: ${[...new Set(standings.map(s => s.group))].join(', ')}`;
      setDebugInfo(info);
      console.log('Standings data:', standings);
    }
  }, [standings]);
  
  // Grupları ayır ve sırala (with useMemo for stable sorting)
  const groupedStandings: GroupStandings = useMemo(() => {
    const grouped: GroupStandings = {};
    standings.forEach(standing => {
      const groupName = standing.group;
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(standing);
    });
    
    // Her grubu sırala
    Object.keys(grouped).forEach(groupName => {
      grouped[groupName].sort((a, b) => {
        // Önce puana göre
        if (b.points !== a.points) return b.points - a.points;
        // Eşitse averaja göre
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        // Hala eşitse atılan gole göre
        return b.goalsFor - a.goalsFor;
      });
    });
    
    return grouped;
  }, [standings]);

  // Debug: Log grouped standings
  useEffect(() => {
    if (Object.keys(groupedStandings).length > 0) {
      console.log('Grouped standings:', groupedStandings);
      Object.entries(groupedStandings).forEach(([group, teams]) => {
        console.log(`${group}: ${teams.map(t => `${t.team.name} (${t.points}pts)`).join(', ')}`);
      });
    }
  }, [standings]);

  if (isLoading && tournamentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Puan durumu yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold">Puan Durumu</h1>
        <p className="text-rose-600 mt-4">Veriler yüklenirken bir hata oluştu: {String(error)}</p>
        <Button onClick={() => refetch()} className="mt-4">Yeniden Dene</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-8 w-8 text-amber-500" />
              Puan Durumu
            </h1>
            {selectedTournament && (
              <p className="text-muted-foreground mt-1">{selectedTournament.name}</p>
            )}
          </div>
        </div>
        {debugInfo && (
          <div className="text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded flex items-center gap-4">
            <span>{debugInfo}</span>
            <span className="text-xs">| Backend teams: {standings.length}</span>
          </div>
        )}
      </div>

      {/* Turnuva Seçici */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Turnuva Seçin</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={tournamentId || ''}
            onValueChange={(value) => {
              const url = new URL(window.location.href);
              url.searchParams.set('tournamentId', value);
              window.history.pushState({}, '', url.toString());
              window.location.reload();
            }}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Turnuva seçin" />
            </SelectTrigger>
            <SelectContent>
              {activeTournaments.map((tournament) => (
                <SelectItem 
                  key={`tournament-${tournament._id}`} 
                  value={tournament._id}
                >
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Puan Durumu Tabloları */}
      {tournamentId ? (
        <div className="space-y-4">
          {standings.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-muted-foreground">
                  Bu turnuva için henüz tamamlanmış maç bulunmuyor.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(groupedStandings)
                .sort(([a], [b]) => a.localeCompare(b, 'tr'))
                .map(([groupName, groupStandings]) => (
                <Card key={groupName} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-950/30 dark:to-sky-950/30">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {groupName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 border-b">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">Sıra</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">Takım</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">O</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">G</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">B</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">M</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">AG</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">YG</th>
                            <th className="text-center px-2 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">AV</th>
                            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">P</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupStandings.map((standing, index) => {
                            const isQualified = index < 2;
                            const rank = index + 1;
                            return (
                              <tr 
                                key={`${groupName}-${standing.team.id}-${index}`}
                                className={cn(
                                  "border-b transition-colors",
                                  isQualified 
                                    ? "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50" 
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                              >
                                <td className="px-4 py-3">
                                  <div className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                    isQualified 
                                      ? "bg-teal-600 text-white" 
                                      : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                                  )}>
                                    {rank}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                      {standing.team.name}
                                    </span>
                                    {isQualified && (
                                      <Trophy className="h-3 w-3 text-amber-500" />
                                    )}
                                  </div>
                                </td>
                                <td className="text-center px-2 py-3 text-sm">{standing.played}</td>
                                <td className="text-center px-2 py-3 text-sm font-medium text-teal-700 dark:text-teal-400">{standing.won}</td>
                                <td className="text-center px-2 py-3 text-sm text-slate-600 dark:text-slate-400">{standing.drawn}</td>
                                <td className="text-center px-2 py-3 text-sm text-rose-600 dark:text-rose-400">{standing.lost}</td>
                                <td className="text-center px-2 py-3 text-sm">{standing.goalsFor}</td>
                                <td className="text-center px-2 py-3 text-sm">{standing.goalsAgainst}</td>
                                <td className={cn(
                                  "text-center px-2 py-3 text-sm font-semibold",
                                  standing.goalDifference > 0 ? "text-teal-600 dark:text-teal-400" :
                                  standing.goalDifference < 0 ? "text-rose-600 dark:text-rose-400" :
                                  "text-slate-600 dark:text-slate-400"
                                )}>
                                  {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                                </td>
                                <td className="text-center px-3 py-3">
                                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-bold text-white bg-indigo-600 rounded">
                                    {standing.points}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Puan durumunu görüntülemek için lütfen bir turnuva seçin
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <StandingsContent />
    </Suspense>
  );
}