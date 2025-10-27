'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { tournamentService } from '@/lib/services/tournament';
import { api } from '@/lib/services/api';
import { ArrowLeft, Trophy, Medal, Award, Star, Users, Calendar, MapPin, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Tournament, Team } from '@/types/api';

interface GroupStanding {
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
  rank: number;
}

interface TournamentGroup {
  _id: string;
  name: string;
  teams: Team[];
}

interface TournamentWithTeams extends Omit<Tournament, 'groups'> {
  groups: TournamentGroup[];
}

interface CrossoverMatch {
  stage: 'gold_final' | 'silver_final' | 'bronze_final' | 'prestige_final';
  label: string;
  homeTeam: {
    teamId: string;
    rank: number;
    group: string;
  };
  awayTeam: {
    teamId: string;
    rank: number;
    group: string;
  };
  date: string;
  field: number;
}

const finalStageConfig = [
  {
    stage: 'gold_final' as const,
    label: 'Gold Final',
    defaultLabel: '🥇 Altın Final',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    defaultRanks: { home: 1, away: 2 }
  },
  {
    stage: 'silver_final' as const,
    label: 'Silver Final',
    defaultLabel: '🥈 Gümüş Final',
    icon: Medal,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    defaultRanks: { home: 3, away: 4 }
  },
  {
    stage: 'bronze_final' as const,
    label: 'Bronze Final',
    defaultLabel: '🥉 Bronz Final',
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    defaultRanks: { home: 5, away: 6 }
  },
  {
    stage: 'prestige_final' as const,
    label: 'Prestige Final',
    defaultLabel: '⭐ Prestij Final',
    icon: Star,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    defaultRanks: { home: 7, away: 8 }
  }
];

export default function ScheduleMatchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'finals'>('select');
  const [includeFinals, setIncludeFinals] = useState(false);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [crossoverMatches, setCrossoverMatches] = useState<CrossoverMatch[]>([]);

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

  // Grup sıralamasını getir (puan durumuna göre)
  const { data: standingsResponse } = useQuery({
    queryKey: ['groupStandings', selectedTournament],
    queryFn: async (): Promise<{ data: GroupStanding[] }> => {
      if (!selectedTournament) return { data: [] };
      const response = await api.get<{ data: GroupStanding[] }>(`/crossover-finals/${selectedTournament}/standings`);
      return response.data as { data: GroupStanding[] };
    },
    enabled: !!selectedTournament && includeFinals,
  });

  const tournaments = tournamentsResponse?.data || [];
  const tournament = tournamentResponse?.data as TournamentWithTeams | undefined;
  const standings: GroupStanding[] = standingsResponse?.data || [];

  // Grup fikstürü oluşturma
  const generateGroupFixtureMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournament) {
        throw new Error('Turnuva seçilmelidir.');
      }
      return tournamentService.generateFixture(selectedTournament);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Grup maçları oluşturuldu.',
      });
      if (includeFinals && selectedStages.size > 0) {
        setCurrentStep('finals');
      } else {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        // Eğer final yok ise yine de bracket sayfasına yönlendir
        router.push('/matches/bracket');
      }
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Fikstür oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Crossover finals oluşturma
  const createCrossoverMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournament || crossoverMatches.length === 0) {
        throw new Error('Crossover maçları yapılandırılmalıdır.');
      }
      const response = await api.post(`/crossover-finals/${selectedTournament}`, {
        matches: crossoverMatches
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Tüm fikstür başarıyla oluşturuldu!',
      });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      // Fikstür oluşturulduktan sonra bracket sayfasına yönlendir
      router.push('/matches/bracket');
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: 'Crossover maçları oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages);
    if (newStages.has(stage)) {
      newStages.delete(stage);
      setCrossoverMatches(crossoverMatches.filter(m => m.stage !== stage));
    } else {
      newStages.add(stage);
      const config = finalStageConfig.find(f => f.stage === stage);
      if (config && tournament) {
        addCrossoverMatch(stage as any, config);
      }
    }
    setSelectedStages(newStages);
  };

  const addAnotherMatch = (stage: CrossoverMatch['stage']) => {
    const config = finalStageConfig.find(f => f.stage === stage);
    if (config && tournament) {
      addCrossoverMatch(stage, config);
    }
  };

  const removeMatch = (index: number) => {
    const match = crossoverMatches[index];
    const remainingMatches = crossoverMatches.filter((_, i) => i !== index);
    
    // If no more matches for this stage, remove from selected stages
    const hasMatchesForStage = remainingMatches.some(m => m.stage === match.stage);
    if (!hasMatchesForStage) {
      const newStages = new Set(selectedStages);
      newStages.delete(match.stage);
      setSelectedStages(newStages);
    }
    
    setCrossoverMatches(remainingMatches);
  };

  const getTeamIdByGroupAndRank = (groupName: string, rank: number): string => {
    if (!tournament) return '';
    
    // Puan durumuna göre takım ID'sini bul
    if (standings && standings.length > 0) {
      const teamStanding = standings.find(
        (s: any) => s.group === groupName && s.rank === rank
      );
      if (teamStanding) {
        return teamStanding.team.id;
      }
    }
    
    // Eğer puan durumu yoksa (henüz maç oynanmamışsa), grup dizisinden al
    const group = tournament.groups.find(g => g.name === groupName);
    if (!group || !group.teams || group.teams.length === 0) return '';
    
    const teamIndex = Math.min(rank - 1, group.teams.length - 1);
    return group.teams[teamIndex]?._id || '';
  };

  const addCrossoverMatch = (stage: CrossoverMatch['stage'], config: typeof finalStageConfig[0]) => {
    if (!tournament) return;
    
    const groups = tournament.groups.map(g => g.name).sort();
    const groupA = groups[0] || 'Grup A';
    const groupB = groups[1] || 'Grup B';

    // Otomatik çapraz eşleşme: İki maç oluştur
    const matches: CrossoverMatch[] = [
      // Maç 1: Grup A (düşük sıra) vs Grup B (yüksek sıra)
      {
        stage,
        label: `${config.defaultLabel} - Maç 1`,
        homeTeam: {
          teamId: getTeamIdByGroupAndRank(groupA, config.defaultRanks.home),
          rank: config.defaultRanks.home,
          group: groupA
        },
        awayTeam: {
          teamId: getTeamIdByGroupAndRank(groupB, config.defaultRanks.away),
          rank: config.defaultRanks.away,
          group: groupB
        },
        date: new Date().toISOString(),
        field: 1
      },
      // Maç 2: Grup B (düşük sıra) vs Grup A (yüksek sıra) - ÇAPRAZ EŞLEŞME
      {
        stage,
        label: `${config.defaultLabel} - Maç 2`,
        homeTeam: {
          teamId: getTeamIdByGroupAndRank(groupB, config.defaultRanks.home),
          rank: config.defaultRanks.home,
          group: groupB
        },
        awayTeam: {
          teamId: getTeamIdByGroupAndRank(groupA, config.defaultRanks.away),
          rank: config.defaultRanks.away,
          group: groupA
        },
        date: new Date().toISOString(),
        field: 1
      }
    ];

    setCrossoverMatches([...crossoverMatches, ...matches]);
  };

  const updateCrossoverMatch = (index: number, updates: Partial<CrossoverMatch>) => {
    const newMatches = [...crossoverMatches];
    const match = { ...newMatches[index], ...updates };
    
    // Auto-update teamId when group or rank changes
    if (updates.homeTeam) {
      match.homeTeam.teamId = getTeamIdByGroupAndRank(
        match.homeTeam.group,
        match.homeTeam.rank
      );
    }
    if (updates.awayTeam) {
      match.awayTeam.teamId = getTeamIdByGroupAndRank(
        match.awayTeam.group,
        match.awayTeam.rank
      );
    }
    
    newMatches[index] = match;
    setCrossoverMatches(newMatches);
  };

  const handleContinueToFinals = () => {
    if (!tournament) return;

    const totalTeams = tournament.groups.reduce((sum, group) => sum + group.teams.length, 0);
    if (totalTeams < 2) {
      toast({
        title: 'Hata',
        description: 'Fikstür oluşturmak için en az 2 takım gereklidir.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep('configure');
  };

  const handleGenerateComplete = async () => {
    // Validate crossover matches have valid team IDs
    if (includeFinals && crossoverMatches.length > 0) {
      const invalidMatches = crossoverMatches.filter(
        m => !m.homeTeam.teamId || !m.awayTeam.teamId
      );
      
      if (invalidMatches.length > 0) {
        toast({
          title: 'Hata',
          description: 'Bazı maçlarda takım bilgileri eksik. Lütfen tüm grup ve sıra seçimlerini kontrol edin.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      // İlk olarak grup maçlarını oluştur
      await generateGroupFixtureMutation.mutateAsync();
      
      // Eğer crossover maçlar varsa onları da oluştur
      if (includeFinals && crossoverMatches.length > 0) {
        await createCrossoverMutation.mutateAsync();
      }
    } catch (error) {
      console.error('Error creating fixture:', error);
    }
  };

  const handleSkipFinals = async () => {
    await generateGroupFixtureMutation.mutateAsync();
    // Bracket sayfasına yönlendir
    router.push('/matches/bracket');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fikstür Oluştur</h1>
            <p className="text-muted-foreground">
              Grup maçları ve final aşamalarını tek seferde planlayın
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
          currentStep === 'select' ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">1</div>
          <span className="font-medium">Turnuva Seç</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
          currentStep === 'configure' ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">2</div>
          <span className="font-medium">Final Ayarları</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
          currentStep === 'finals' ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">3</div>
          <span className="font-medium">Tamamla</span>
        </div>
      </div>

      {/* Step 1: Tournament Selection */}
      {currentStep === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>Turnuva Seçimi</CardTitle>
            <CardDescription>
              Fikstür oluşturmak istediğiniz turnuvayı seçin
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

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeFinals"
                      checked={includeFinals}
                      onChange={(e) => setIncludeFinals(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor="includeFinals" className="cursor-pointer">
                      Crossover Final Maçları da ekle (isteğe bağlı)
                    </Label>
                  </div>
                  <Button onClick={handleContinueToFinals}>
                    Devam Et
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Finals Configuration */}
      {currentStep === 'configure' && (
        <div className="space-y-6">
          {includeFinals ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Final Aşamalarını Seçin</CardTitle>
                  <CardDescription>
                    Grup maçlarından sonra oynanacak final aşamalarını belirleyin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {finalStageConfig.map((config) => {
                      const Icon = config.icon;
                      const isSelected = selectedStages.has(config.stage);
                      return (
                        <button
                          key={config.stage}
                          onClick={() => toggleStage(config.stage)}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all",
                            isSelected
                              ? `${config.bgColor} ${config.borderColor}`
                              : 'border-border bg-muted/30 hover:bg-muted/50'
                          )}
                        >
                          <Icon className={cn("h-8 w-8 mx-auto mb-2", isSelected ? config.color : 'text-muted-foreground')} />
                          <div className="text-sm font-semibold">{config.defaultLabel}</div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Puan Durumu Gösterimi */}
              {standings && standings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Mevcut Grup Sıralaması
                    </CardTitle>
                    <CardDescription>
                      Final eşleşmeleri bu sıralamaya göre belirlenir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(
                        standings.reduce((acc: any, standing: any) => {
                          if (!acc[standing.group]) acc[standing.group] = [];
                          acc[standing.group].push(standing);
                          return acc;
                        }, {})
                      ).map(([groupName, groupStandings]: [string, any]) => (
                        <div key={groupName} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{groupName}</h4>
                          <div className="space-y-2">
                            {groupStandings
                              .sort((a: any, b: any) => a.rank - b.rank)
                              .map((standing: any) => (
                                <div 
                                  key={standing.team.id}
                                  className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-muted-foreground w-6">{standing.rank}.</span>
                                    <span className="font-medium">{standing.team.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>P: {standing.points}</span>
                                    <span>A: {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}</span>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Group matches by stage for better organization */}
              {Array.from(selectedStages).map((selectedStage) => {
                const config = finalStageConfig.find(f => f.stage === selectedStage);
                if (!config) return null;
                const Icon = config.icon;
                const stageMatches = crossoverMatches.filter(m => m.stage === selectedStage);

                return (
                  <Card key={selectedStage} className={cn("border-2", config.borderColor)}>
                    <CardHeader className={config.bgColor}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-6 w-6", config.color)} />
                          <div>
                            <CardTitle>{config.defaultLabel}</CardTitle>
                            <CardDescription>
                              {stageMatches.length} maç tanımlandı
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addAnotherMatch(selectedStage as any)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Maç Ekle
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {stageMatches.map((match, matchIndex) => {
                        const actualIndex = crossoverMatches.indexOf(match);
                        const groups = tournament?.groups.map(g => g.name).sort() || [];
                        
                        return (
                          <div key={actualIndex} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  Maç {matchIndex + 1}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {match.homeTeam.group.replace('Grup ', '')} {match.homeTeam.rank}. vs {match.awayTeam.group.replace('Grup ', '')} {match.awayTeam.rank}.
                                </div>
                              </div>
                              {stageMatches.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMatch(actualIndex)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Ev Sahibi Grup</Label>
                                <Select
                                  value={match.homeTeam.group}
                                  onValueChange={(group) => updateCrossoverMatch(actualIndex, {
                                    homeTeam: { ...match.homeTeam, group }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {groups.map(group => (
                                      <SelectItem key={group} value={group}>
                                        {group}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Ev Sahibi Sıra</Label>
                                <Select
                                  value={match.homeTeam.rank.toString()}
                                  onValueChange={(rank) => updateCrossoverMatch(actualIndex, {
                                    homeTeam: { ...match.homeTeam, rank: parseInt(rank) }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                                      <SelectItem key={rank} value={rank.toString()}>
                                        {rank}. Sıra
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Deplasman Grup</Label>
                                <Select
                                  value={match.awayTeam.group}
                                  onValueChange={(group) => updateCrossoverMatch(actualIndex, {
                                    awayTeam: { ...match.awayTeam, group }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {groups.map(group => (
                                      <SelectItem key={group} value={group}>
                                        {group}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Deplasman Sıra</Label>
                                <Select
                                  value={match.awayTeam.rank.toString()}
                                  onValueChange={(rank) => updateCrossoverMatch(actualIndex, {
                                    awayTeam: { ...match.awayTeam, rank: parseInt(rank) }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                                      <SelectItem key={rank} value={rank.toString()}>
                                        {rank}. Sıra
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Maç Tarihi
                                </Label>
                                <Input
                                  type="datetime-local"
                                  value={match.date.slice(0, 16)}
                                  onChange={(e) => updateCrossoverMatch(actualIndex, {
                                    date: new Date(e.target.value).toISOString()
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Saha
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={match.field}
                                  onChange={(e) => updateCrossoverMatch(actualIndex, {
                                    field: parseInt(e.target.value)
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sadece Grup Maçları</h3>
                <p className="text-muted-foreground mb-4">
                  Grup maçları oluşturulacak, final maçları eklenmeyecek
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('select')}>
              Geri
            </Button>
            <div className="flex gap-2">
              {includeFinals && (
                <Button variant="outline" onClick={handleSkipFinals}>
                  Finalleri Atla
                </Button>
              )}
              <Button
                onClick={handleGenerateComplete}
                disabled={generateGroupFixtureMutation.isPending || createCrossoverMutation.isPending}
              >
                {generateGroupFixtureMutation.isPending || createCrossoverMutation.isPending
                  ? 'Oluşturuluyor...'
                  : 'Fikstürü Oluştur'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
