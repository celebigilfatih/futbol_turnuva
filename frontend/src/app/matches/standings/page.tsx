'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
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
import { Suspense } from 'react';

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

function StandingsContent() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');

  // Tüm turnuvaları getir
  const { data: tournamentsResponse } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      return tournamentService.getAll();
    },
  });

  const tournaments = tournamentsResponse?.data || [];
  const activeTournaments = tournaments.filter(t => t.status !== 'completed');

  // Seçili turnuvanın puan durumunu getir
  const { data: standingsResponse, isLoading, error } = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: async () => {
      if (!tournamentId) {
        return { data: [] as TeamStanding[] };
      }
      return matchService.getStandings(tournamentId);
    },
    enabled: Boolean(tournamentId)
  });

  const standings = standingsResponse?.data || [];
  const selectedTournament = tournaments.find(t => t._id === tournamentId);
  
  // Grupları ayır
  const groupedStandings = standings.reduce((acc, standing) => {
    if (!acc[standing.group]) {
      acc[standing.group] = [];
    }
    acc[standing.group].push(standing);
    return acc;
  }, {} as Record<string, TeamStanding[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold">Puan Durumu</h1>
        <p className="text-red-500">Veriler yüklenirken bir hata oluştu: {String(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Puan Durumu</h1>
            {selectedTournament && (
              <p className="text-muted-foreground">{selectedTournament.name}</p>
            )}
          </div>
        </div>
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
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(groupedStandings).map(([groupName, groupStandings]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="text-lg font-medium">{groupName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th key="team-header" className="text-left p-2 text-sm font-medium">Takım</th>
                          <th key="played-header" className="p-2 text-sm font-medium text-center">O</th>
                          <th key="won-header" className="p-2 text-sm font-medium text-center">G</th>
                          <th key="drawn-header" className="p-2 text-sm font-medium text-center">B</th>
                          <th key="lost-header" className="p-2 text-sm font-medium text-center">M</th>
                          <th key="goalsFor-header" className="p-2 text-sm font-medium text-center">AG</th>
                          <th key="goalsAgainst-header" className="p-2 text-sm font-medium text-center">YG</th>
                          <th key="goalDiff-header" className="p-2 text-sm font-medium text-center">AV</th>
                          <th key="points-header" className="p-2 text-sm font-medium text-center">P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings
                          .sort((a, b) => {
                            if (b.points !== a.points) return b.points - a.points;
                            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                            return b.goalsFor - a.goalsFor;
                          })
                          .map((standing, index) => (
                            <tr 
                              key={`${groupName}-team-${standing.team.id}`}
                              className={cn(
                                "border-t transition-colors",
                                index < 2 ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50" : "hover:bg-muted/50"
                              )}
                            >
                              <td className="p-2 text-sm font-medium">{standing.team.name}</td>
                              <td className="p-2 text-sm text-center">{standing.played}</td>
                              <td className="p-2 text-sm text-center">{standing.won}</td>
                              <td className="p-2 text-sm text-center">{standing.drawn}</td>
                              <td className="p-2 text-sm text-center">{standing.lost}</td>
                              <td className="p-2 text-sm text-center">{standing.goalsFor}</td>
                              <td className="p-2 text-sm text-center">{standing.goalsAgainst}</td>
                              <td className="p-2 text-sm text-center font-medium">{standing.goalDifference}</td>
                              <td className="p-2 text-sm text-center font-bold">{standing.points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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