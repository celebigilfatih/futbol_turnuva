'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { tournamentService } from '@/lib/services/tournament';
import { ArrowLeft } from 'lucide-react';
import type { Tournament, Team } from '@/types/api';

interface TournamentGroup {
  _id: string;
  name: string;
  teams: Team[];
}

interface TournamentWithTeams extends Omit<Tournament, 'groups'> {
  groups: TournamentGroup[];
}

export default function ScheduleMatchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  // Turnuvaları getir
  const { data: tournamentsResponse, isLoading: isTournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await tournamentService.getAll();
      return response;
    },
  });

  // Seçili turnuvayı getir
  const { data: tournamentResponse, isLoading: isTournamentLoading } = useQuery({
    queryKey: ['tournament', selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return null;
      const response = await tournamentService.getById(selectedTournament);
      return response;
    },
    enabled: !!selectedTournament,
  });

  const tournaments = tournamentsResponse?.data || [];
  const tournament = tournamentResponse?.data as TournamentWithTeams | undefined;

  // Fikstür oluşturma mutation'ı
  const generateFixtureMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournament) {
        throw new Error('Turnuva seçilmelidir.');
      }
      return tournamentService.generateFixture(selectedTournament);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Fikstür başarıyla oluşturuldu.',
      });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      router.push('/matches');
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Fikstür oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateFixture = () => {
    if (!tournament) return;

    // Turnuvada yeterli takım yoksa uyarı ver
    const totalTeams = tournament.groups.reduce((sum, group) => sum + group.teams.length, 0);
    if (totalTeams < 2) {
      toast({
        title: 'Hata',
        description: 'Fikstür oluşturmak için en az 2 takım gereklidir.',
        variant: 'destructive',
      });
      return;
    }

    // Gruplarda eşit olmayan takım sayısı varsa uyarı ver
    const hasUnequalGroups = tournament.groups.some(
      group => group.teams.length !== tournament.teamsPerGroup
    );
    if (hasUnequalGroups) {
      toast({
        title: 'Uyarı',
        description: 'Bazı gruplarda eksik takım var. Fikstür oluşturmak istediğinize emin misiniz?',
        variant: 'destructive',
      });
      // Kullanıcı onayı alınabilir
    }

    generateFixtureMutation.mutate();
  };

  if (isTournamentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
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
            <h1 className="text-3xl font-bold tracking-tight">Fikstür Oluştur</h1>
            <p className="text-muted-foreground">Turnuva seçerek otomatik fikstür oluşturun</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turnuva Seçimi</CardTitle>
          <CardDescription>
            Seçilen turnuvanın ayarlarına göre tüm gruplar için fikstür oluşturulacak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Turnuva</Label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger>
                <SelectValue placeholder="Turnuva seçin" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament._id} value={tournament._id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tournament && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Toplam Grup</div>
                  <div className="text-2xl font-bold">{tournament.groups.length}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Toplam Takım</div>
                  <div className="text-2xl font-bold">
                    {tournament.groups.reduce((sum, group) => sum + group.teams.length, 0)}
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Maç Süresi</div>
                  <div className="text-2xl font-bold">{tournament.matchDuration} dk</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Saha Sayısı</div>
                  <div className="text-2xl font-bold">{tournament.numberOfFields}</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {tournament?.groups.map((group) => (
                  <div key={group._id} className="bg-muted/50 p-4 rounded-lg">
                    <div className="font-semibold mb-2">{group.name}</div>
                    <div className="space-y-1">
                      {group.teams && group.teams.length > 0 ? (
                        group.teams.map((team) => (
                          <div key={team._id} className="text-sm flex items-center justify-between">
                            <span>{team.name}</span>
                            <span className="text-muted-foreground">{team.players?.length || 0} Oyuncu</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Bu grupta henüz takım yok
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateFixture}
                  disabled={generateFixtureMutation.isPending}
                >
                  {generateFixtureMutation.isPending ? 'Oluşturuluyor...' : 'Fikstür Oluştur'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 