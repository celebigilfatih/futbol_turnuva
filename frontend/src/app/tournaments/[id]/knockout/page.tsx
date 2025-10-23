'use client';

import { use } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';

interface KnockoutMatchForm {
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  field: number;
  stage: 'quarter_final' | 'semi_final' | 'final';
}

export default function KnockoutStagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { toast } = useToast();
  const [matches, setMatches] = useState<KnockoutMatchForm[]>([]);

  // Turnuva bilgilerini getir
  const { data: tournamentResponse } = useQuery({
    queryKey: ['tournament', resolvedParams.id],
    queryFn: () => tournamentService.getById(resolvedParams.id),
    enabled: !!resolvedParams.id,
  });

  // Puan durumunu getir
  const { data: standingsResponse } = useQuery({
    queryKey: ['standings', resolvedParams.id],
    queryFn: async () => {
      return matchService.getStandings(resolvedParams.id);
    },
  });

  const tournament = tournamentResponse?.data;
  const standings = standingsResponse?.data || [];

  // Grupları ayır ve her gruptan ilk iki takımı al
  const qualifiedTeams = Object.entries(standings.reduce((acc, standing) => {
    if (!acc[standing.group]) {
      acc[standing.group] = [];
    }
    acc[standing.group].push(standing);
    return acc;
  }, {} as Record<string, typeof standings>))
  .map(([group, groupStandings]) => ({
    group,
    teams: groupStandings
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
      .slice(0, 2)
  }))
  .flatMap(group => group.teams.map(team => ({
    id: team.team.id,
    name: team.team.name,
    group: group.group,
    position: group.teams.indexOf(team) + 1
  })));

  // Yeni maç ekle
  const addMatch = (stage: KnockoutMatchForm['stage']) => {
    setMatches([...matches, {
      homeTeam: '',
      awayTeam: '',
      date: '',
      time: '',
      field: 1,
      stage
    }]);
  };

  // Maç bilgilerini güncelle
  const updateMatch = (index: number, field: keyof KnockoutMatchForm, value: string | number) => {
    const updatedMatches = [...matches];
    updatedMatches[index] = {
      ...updatedMatches[index],
      [field]: value
    };
    setMatches(updatedMatches);
  };

  // Maçları kaydet
  const createMatchMutation = useMutation({
    mutationFn: async (match: KnockoutMatchForm) => {
      if (!match.date || !match.time) {
        throw new Error('Tarih ve saat alanları zorunludur.');
      }

      // Ensure time has seconds
      const time = match.time.includes(':') ? 
        match.time.split(':').length === 2 ? `${match.time}:00` : match.time :
        `${match.time}:00:00`;

      const dateTime = new Date(`${match.date}T${time}`);
      
      // Validate the date is valid
      if (isNaN(dateTime.getTime())) {
        throw new Error('Geçersiz tarih veya saat.');
      }

      return matchService.create({
        tournament: resolvedParams.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        date: dateTime.toISOString(),
        field: match.field,
        stage: match.stage,
        extraTimeEnabled: true,
        penaltyShootoutEnabled: true
      });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Maçlar başarıyla oluşturuldu.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Maçlar oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all matches have required fields
    const invalidMatch = matches.find(match => 
      !match.homeTeam || 
      !match.awayTeam || 
      !match.date || 
      !match.time || 
      !match.field
    );

    if (invalidMatch) {
      toast({
        title: 'Hata',
        description: 'Lütfen tüm maç bilgilerini eksiksiz doldurun.',
        variant: 'destructive',
      });
      return;
    }

    // Tüm maçları sırayla oluştur
    try {
      for (const match of matches) {
        await createMatchMutation.mutateAsync(match);
      }
    } catch {
      // Error is already handled by mutation
      return;
    }
  };

  if (!tournament) {
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
          <Link href={`/tournaments/${resolvedParams.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eleme Aşaması</h1>
            <p className="text-muted-foreground">{tournament.name}</p>
          </div>
        </div>
      </div>

      {/* Gruplardan Çıkan Takımlar */}
      <Card>
        <CardHeader>
          <CardTitle>Gruplardan Çıkan Takımlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {qualifiedTeams.map((team) => (
              <div
                key={team.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="font-medium">{team.name}</div>
                <div className="text-sm text-muted-foreground">
                  {team.group} - {team.position}. sıra
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maç Oluşturma Formu */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Çeyrek Final */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Çeyrek Final</CardTitle>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => addMatch('quarter_final')}
            >
              Maç Ekle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches
                .filter(m => m.stage === 'quarter_final')
                .map((match, index) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-5">
                    <div>
                      <Label>Ev Sahibi</Label>
                      <Select
                        value={match.homeTeam}
                        onValueChange={(value) => updateMatch(index, 'homeTeam', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Takım seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifiedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Deplasman</Label>
                      <Select
                        value={match.awayTeam}
                        onValueChange={(value) => updateMatch(index, 'awayTeam', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Takım seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifiedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tarih</Label>
                      <Input
                        type="date"
                        value={match.date}
                        onChange={(e) => updateMatch(index, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saat</Label>
                      <Input
                        type="time"
                        value={match.time}
                        onChange={(e) => updateMatch(index, 'time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saha</Label>
                      <Input
                        type="number"
                        min={1}
                        value={match.field}
                        onChange={(e) => updateMatch(index, 'field', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Yarı Final */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Yarı Final</CardTitle>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => addMatch('semi_final')}
            >
              Maç Ekle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches
                .filter(m => m.stage === 'semi_final')
                .map((match, index) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-5">
                    <div>
                      <Label>Ev Sahibi</Label>
                      <Select
                        value={match.homeTeam}
                        onValueChange={(value) => updateMatch(index, 'homeTeam', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Takım seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifiedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Deplasman</Label>
                      <Select
                        value={match.awayTeam}
                        onValueChange={(value) => updateMatch(index, 'awayTeam', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Takım seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifiedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tarih</Label>
                      <Input
                        type="date"
                        value={match.date}
                        onChange={(e) => updateMatch(index, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saat</Label>
                      <Input
                        type="time"
                        value={match.time}
                        onChange={(e) => updateMatch(index, 'time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saha</Label>
                      <Input
                        type="number"
                        min={1}
                        value={match.field}
                        onChange={(e) => updateMatch(index, 'field', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Final */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Final</CardTitle>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => addMatch('final')}
            >
              Maç Ekle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches
                .filter(m => m.stage === 'final')
                .map((match, index) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-5">
                    <div>
                      <Label>Ev Sahibi</Label>
                      <Select
                        value={match.homeTeam}
                        onValueChange={(value) => updateMatch(index, 'homeTeam', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Takım seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifiedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Deplasman</Label>
                      <Select
                        value={match.awayTeam}
                        onValueChange={(value) => updateMatch(index, 'awayTeam', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Takım seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifiedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tarih</Label>
                      <Input
                        type="date"
                        value={match.date}
                        onChange={(e) => updateMatch(index, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saat</Label>
                      <Input
                        type="time"
                        value={match.time}
                        onChange={(e) => updateMatch(index, 'time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saha</Label>
                      <Input
                        type="number"
                        min={1}
                        value={match.field}
                        onChange={(e) => updateMatch(index, 'field', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={matches.length === 0 || createMatchMutation.isPending}
          >
            {createMatchMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Kaydediliyor</span>
              </div>
            ) : (
              'Maçları Oluştur'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}