'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import type { Match } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScoreInput {
  homeTeamScore: number;
  awayTeamScore: number;
  scorers: {
    homeTeam: Array<{ player: string; minute: number }>;
    awayTeam: Array<{ player: string; minute: number }>;
  };
}

export default function ScoreEntryPage() {
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score, setScore] = useState<ScoreInput>({
    homeTeamScore: 0,
    awayTeamScore: 0,
    scorers: {
      homeTeam: [],
      awayTeam: []
    }
  });

  const { data: matchesResponse, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const response = await matchService.getAll();
      return response;
    },
  });

  const matches = matchesResponse?.data || [];
  const pendingMatches = matches.filter(match => match.status === 'scheduled');

  const queryClient = useQueryClient();

  const updateScoreMutation = useMutation({
    mutationFn: async (data: { matchId: string; score: ScoreInput }) => {
      const result = await matchService.updateScore(data.matchId, data.score);
      const match = matches.find(m => m._id === data.matchId);
      if (match && match.stage === 'group' && typeof match.tournament === 'object') {
        const groupMatches = matches.filter(m => m.stage === 'group' && m.tournament._id === match.tournament._id);
        if (groupMatches.every(m => m.status === 'completed' || m._id === data.matchId)) {
          try {
            await tournamentService.updateKnockoutTeamsWithQualified(match.tournament._id);
          } catch (error) {
            console.log('Knockout update skipped');
          }
        }
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Maç sonucu başarıyla kaydedildi.',
      });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setSelectedMatch(null);
      setScore({
        homeTeamScore: 0,
        awayTeamScore: 0,
        scorers: {
          homeTeam: [],
          awayTeam: []
        }
      });
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Maç sonucu kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    updateScoreMutation.mutate({
      matchId: selectedMatch._id,
      score
    });
  };

  const addScorer = (team: 'homeTeam' | 'awayTeam') => {
    setScore(prev => ({
      ...prev,
      scorers: {
        ...prev.scorers,
        [team]: [...prev.scorers[team], { player: '', minute: 0 }]
      }
    }));
  };

  const removeScorer = (team: 'homeTeam' | 'awayTeam', index: number) => {
    setScore(prev => ({
      ...prev,
      scorers: {
        ...prev.scorers,
        [team]: prev.scorers[team].filter((_, i) => i !== index)
      }
    }));
  };

  const updateScorer = (team: 'homeTeam' | 'awayTeam', index: number, field: 'player' | 'minute', value: string | number) => {
    setScore(prev => ({
      ...prev,
      scorers: {
        ...prev.scorers,
        [team]: prev.scorers[team].map((scorer, i) => 
          i === index ? { ...scorer, [field]: value } : scorer
        )
      }
    }));
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold tracking-tight">Skor Girişi</h1>
            <p className="text-muted-foreground">Maç sonuçlarını girin</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bekleyen Maçlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMatches.map((match, index) => (
                <div
                  key={match._id || index}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMatch?._id === match._id
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-700">
                      {match.group}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(match.date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{match.homeTeam.name}</span>
                    <span className="text-sm text-muted-foreground">vs</span>
                    <span className="font-medium">{match.awayTeam.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedMatch && (
          <Card>
            <CardHeader>
              <CardTitle>Skor Girişi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="homeTeamScore">{selectedMatch.homeTeam.name}</Label>
                    <Input
                      id="homeTeamScore"
                      type="number"
                      min={0}
                      value={score.homeTeamScore}
                      onChange={(e) => setScore(prev => ({ ...prev, homeTeamScore: parseInt(e.target.value) || 0 }))}
                      required
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Gol Atanlar</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => addScorer('homeTeam')}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Gol Ekle
                        </Button>
                      </div>
                      {score.scorers.homeTeam.map((scorer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={scorer.player}
                            onValueChange={(value) => updateScorer('homeTeam', index, 'player', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Oyuncu seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedMatch.homeTeam.players.map((player) => (
                                <SelectItem key={player._id} value={player._id}>
                                  {player.name} ({player.number})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            placeholder="Dk"
                            className="w-20"
                            value={scorer.minute}
                            onChange={(e) => updateScorer('homeTeam', index, 'minute', parseInt(e.target.value) || 0)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeScorer('homeTeam', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center h-full pt-8">
                    <span className="text-xl font-bold">-</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="awayTeamScore">{selectedMatch.awayTeam.name}</Label>
                    <Input
                      id="awayTeamScore"
                      type="number"
                      min={0}
                      value={score.awayTeamScore}
                      onChange={(e) => setScore(prev => ({ ...prev, awayTeamScore: parseInt(e.target.value) || 0 }))}
                      required
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Gol Atanlar</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => addScorer('awayTeam')}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Gol Ekle
                        </Button>
                      </div>
                      {score.scorers.awayTeam.map((scorer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={scorer.player}
                            onValueChange={(value) => updateScorer('awayTeam', index, 'player', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Oyuncu seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedMatch.awayTeam.players.map((player) => (
                                <SelectItem key={player._id} value={player._id}>
                                  {player.name} ({player.number})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            placeholder="Dk"
                            className="w-20"
                            value={scorer.minute}
                            onChange={(e) => updateScorer('awayTeam', index, 'minute', parseInt(e.target.value) || 0)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeScorer('awayTeam', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateScoreMutation.isPending}
                >
                  {updateScoreMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Kaydediliyor</span>
                    </div>
                  ) : (
                    'Kaydet'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 