'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy,
  Timer,
  Circle,
  Goal,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { matchService } from '@/lib/services/match';
import { cn } from '@/lib/utils';

interface MatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MatchDetailPage({ params }: MatchDetailPageProps) {
  const resolvedParams = use(params);
  console.log('Resolved params:', resolvedParams);

  const { data: matchResponse, isLoading } = useQuery({
    queryKey: ['match', resolvedParams.id],
    queryFn: async () => {
      const response = await matchService.getById(resolvedParams.id);
      console.log('Match response:', response);
      return response;
    },
  });

  const match = matchResponse?.data;
  console.log('Match data:', match);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Maç bulunamadı</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'in_progress':
        return 'Devam Ediyor';
      default:
        return 'Planlandı';
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Maç Detayı</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>{match.tournament.name}</span>
            </div>
          </div>
        </div>
        <Badge className={cn("px-4 py-1", getStatusColor(match.status))}>
          <Circle className={cn(
            "h-2 w-2 mr-2 fill-current",
            match.status === 'in_progress' && "animate-pulse"
          )} />
          {getStatusText(match.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Takımlar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{match.homeTeam.name}</div>
                <div className="text-sm text-muted-foreground">Ev Sahibi</div>
              </div>
              <div className="text-center space-y-2">
                {match.score ? (
                  <div className="text-4xl font-bold tabular-nums">
                    {match.score.homeTeam} - {match.score.awayTeam}
                  </div>
                ) : (
                  <div className="text-xl text-muted-foreground">vs</div>
                )}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {match.group}
                </Badge>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{match.awayTeam.name}</div>
                <div className="text-sm text-muted-foreground">Deplasman</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Maç Bilgileri</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Tarih & Saat</div>
                  <div className="font-medium">
                    {new Date(match.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm font-medium">
                    {new Date(match.date).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Saha</div>
                  <div className="font-medium">Saha {match.field}</div>
                </div>
              </div>
            </div>

            {match.score?.scorers && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Goal className="h-4 w-4 text-primary" />
                  <div className="font-semibold">Gol Detayları</div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {match.homeTeam.name}
                    </div>
                    {match.score.scorers.homeTeam.length > 0 ? (
                      <ul className="space-y-2">
                        {match.score.scorers.homeTeam.map((scorer, index) => {
                          const player = match.homeTeam.players.find(p => p._id === scorer.player);
                          return (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <Timer className="h-3 w-3 text-muted-foreground" />
                              {player ? (
                                <>
                                  <span className="font-medium">{player.name}</span>
                                  <span className="text-muted-foreground">({scorer.minute}&apos;)</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Bilinmeyen oyuncu</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">Gol kaydı yok</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {match.awayTeam.name}
                    </div>
                    {match.score.scorers.awayTeam.length > 0 ? (
                      <ul className="space-y-2">
                        {match.score.scorers.awayTeam.map((scorer, index) => {
                          const player = match.awayTeam.players.find(p => p._id === scorer.player);
                          return (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <Timer className="h-3 w-3 text-muted-foreground" />
                              {player ? (
                                <>
                                  <span className="font-medium">{player.name}</span>
                                  <span className="text-muted-foreground">({scorer.minute}&apos;)</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Bilinmeyen oyuncu</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">Gol kaydı yok</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}