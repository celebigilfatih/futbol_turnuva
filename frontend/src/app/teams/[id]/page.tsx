'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { teamService } from '@/lib/services/team';
import type { Team } from '@/types/api';
import { Trophy, Users, ArrowLeft, Shield, Swords } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: team, isLoading, error } = useQuery<Team>({
    queryKey: ['team', resolvedParams.id],
    queryFn: async () => {
      const response = await teamService.getById(resolvedParams.id);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Bir hata oluştu. Lütfen tekrar deneyin.</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Takım bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/teams">
            <Button variant="outline" size="sm" className="space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Geri Dön</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span>{team.name}</span>
            </h1>
            <p className="text-muted-foreground">{team.players.length} Oyuncu</p>
          </div>
        </div>
        <Link href={`/teams/${resolvedParams.id}/edit`}>
          <Button>Düzenle</Button>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-12">
        {/* Sol Taraf - İstatistikler */}
        <Card className="col-span-12 md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Takım İstatistikleri</span>
            </CardTitle>
            <CardDescription>Turnuvalardaki performans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <div className="text-sm text-muted-foreground">Toplam Maç</div>
                  <div className="text-2xl font-bold">{team.groupStats.played}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <div className="text-sm text-muted-foreground">Puan</div>
                  <div className="text-2xl font-bold">{team.groupStats.points}</div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Galibiyet</span>
                  </div>
                  <div className="font-bold">{team.groupStats.won}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Swords className="h-4 w-4 text-blue-500" />
                    <span>Beraberlik</span>
                  </div>
                  <div className="font-bold">{team.groupStats.drawn}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span>Mağlubiyet</span>
                  </div>
                  <div className="font-bold">{team.groupStats.lost}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <div className="text-sm text-muted-foreground">Atılan Gol</div>
                  <div className="text-2xl font-bold text-green-500">{team.groupStats.goalsFor}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <div className="text-sm text-muted-foreground">Yenen Gol</div>
                  <div className="text-2xl font-bold text-red-500">{team.groupStats.goalsAgainst}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sağ Taraf - Oyuncu Kadrosu */}
        <Card className="col-span-12 md:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Oyuncu Kadrosu</span>
            </CardTitle>
            <CardDescription>Takım oyuncuları ve pozisyonları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {team.players.map((player) => (
                <div
                  key={`${player.number}-${player.name}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                      {player.number}
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">Oyuncu #{player.number}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    #{player.number}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 