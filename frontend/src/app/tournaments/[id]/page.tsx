'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Users, UserPlus, Settings, Swords } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tournamentService } from '@/lib/services/tournament';
import { matchService } from '@/lib/services/match';
import { useAuth } from '@/contexts/AuthContext';


export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { isAdmin } = useAuth();

  // Turnuva verilerini getir
  const { data: tournament, isLoading: isTournamentLoading } = useQuery({
    queryKey: ['tournament', resolvedParams.id],
    queryFn: async () => {
      const response = await tournamentService.getById(resolvedParams.id);
      return response.data;
    },
  });

  // Maçları getir
  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: ['tournament-matches', resolvedParams.id],
    queryFn: async () => {
      const response = await matchService.getByTournament(resolvedParams.id);
      return response.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Planlanıyor</Badge>;
      case 'group_stage':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Grup Aşaması</Badge>;
      case 'knockout_stage':
        return <Badge variant="outline" className="text-purple-500 border-purple-500">Eleme Aşaması</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Tamamlandı</Badge>;
      default:
        return null;
    }
  };

  if (isTournamentLoading || isMatchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Turnuva bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst Kısım */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/tournaments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tournament?.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString('tr-TR') : '-'} - {tournament?.endDate ? new Date(tournament.endDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {getStatusBadge(tournament?.status)}
          {isAdmin && tournament?._id && (
            <>
              <Link href={`/tournaments/${tournament._id}/crossover`}>
                <Button variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-yellow-50 to-purple-50 dark:from-yellow-950/20 dark:to-purple-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:from-yellow-100 hover:to-purple-100">
                  <Trophy className="h-4 w-4" />
                  Crossover Finals
                </Button>
              </Link>
              <Link href={`/tournaments/${tournament._id}/teams`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Takımları Yönet
                </Button>
              </Link>
              <Link href={`/tournaments/${tournament._id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Düzenle
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Turnuva Bilgileri */}
      <div className="flex gap-4">
        <div className="flex-1 flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div className="text-sm font-medium text-muted-foreground">Toplam Takım</div>
          </div>
          <div className="text-2xl font-bold">
            {tournament?.groups?.reduce((total, group) => total + (group?.teams?.length || 0), 0) || 0}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div className="text-sm font-medium text-muted-foreground">Grup Sayısı</div>
          </div>
          <div className="text-2xl font-bold">{tournament?.groups?.length || 0}</div>
        </div>

        <div className="flex-1 flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            <div className="text-sm font-medium text-muted-foreground">Saha Sayısı</div>
          </div>
          <div className="text-2xl font-bold">{tournament?.numberOfFields || 0}</div>
        </div>

        <div className="flex-1 flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            <div className="text-sm font-medium text-muted-foreground">Maç Süresi</div>
          </div>
          <div className="text-2xl font-bold">{tournament?.matchDuration || 0} dk</div>
        </div>
      </div>

      {/* Gruplar ve Maçlar */}
      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups" className="gap-2">
            <Trophy className="h-4 w-4" />
            Gruplar
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-2">
            <Swords className="h-4 w-4" />
            Maçlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tournament?.groups?.map((group) => (
              <Card key={group._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{group.name}</span>
                    <Badge variant="outline">
                      {group.teams.length} / {tournament.teamsPerGroup} Takım
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.teams.map((team) => (
                      <div
                        key={team._id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium">{team.name}</span>
                      </div>
                    ))}
                    {group.teams.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Bu grupta henüz takım yok
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!tournament?.groups || tournament.groups.length === 0) && (
              <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-xl font-semibold mb-2">Henüz grup bulunmuyor</div>
                <div className="text-muted-foreground">
                  Turnuvaya henüz grup eklenmemiş
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {matches?.map((match) => (
              <Card key={match._id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {match?.homeTeam?.name} vs {match?.awayTeam?.name}
                  </CardTitle>
                  <CardDescription>
                    {match?.stage === 'group' ? 'Grup Maçı' : 'Eleme Maçı'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span>
                          {match?.date ? new Date(match.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          {match?.date ? new Date(match.date).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>Saha {match?.field || '-'}</span>
                      </div>
                    </div>
                    {match?.status === 'completed' && match?.score && (
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="text-2xl font-bold">
                          {match.score.homeTeam} - {match.score.awayTeam}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!matches || matches.length === 0) && (
              <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg">
                <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-xl font-semibold mb-2">Henüz maç bulunmuyor</div>
                <div className="text-muted-foreground">
                  Turnuva için maç programı oluşturulmamış
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}