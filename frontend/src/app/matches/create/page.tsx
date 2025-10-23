'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import { teamService } from '@/lib/services/team';
import { ArrowLeft } from 'lucide-react';

interface MatchInput {
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  field: number;
  stage: 'group' | 'quarter_final' | 'semi_final' | 'final';
  group?: string;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

export default function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<MatchInput>({
    tournament: '',
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    field: 1,
    stage: 'group',
    extraTimeEnabled: true,
    penaltyShootoutEnabled: true,
  });

  const { data: tournamentsResponse } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await tournamentService.getAll();
      return response;
    },
  });

  const { data: teamsResponse } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamService.getAll();
      return response;
    },
  });

  const { data: selectedTournament } = useQuery({
    queryKey: ['tournament', formData.tournament],
    queryFn: async () => {
      if (!formData.tournament) return null;
      const response = await tournamentService.getById(formData.tournament);
      return response.data;
    },
    enabled: !!formData.tournament,
  });

  const createMutation = useMutation({
    mutationFn: (data: MatchInput) => {
      const matchData = {
        ...data,
        date: `${data.date}T${data.time}:00`,
      };
      return matchService.create(matchData);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Maç başarıyla oluşturuldu.',
      });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      router.push('/matches');
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Maç oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const tournaments = tournamentsResponse?.data || [];
  const teams = teamsResponse?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Maç Oluştur</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/matches">
            <Button variant="outline">İptal</Button>
          </Link>
          <Button type="submit" form="match-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </div>
      </div>

      <form id="match-form" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Turnuva ve Takımlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Turnuva</Label>
                <Select value={formData.tournament} onValueChange={handleSelectChange('tournament')}>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ev Sahibi Takım</Label>
                  <Select value={formData.homeTeam} onValueChange={handleSelectChange('homeTeam')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Takım seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team._id} value={team._id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deplasman Takımı</Label>
                  <Select value={formData.awayTeam} onValueChange={handleSelectChange('awayTeam')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Takım seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team._id} value={team._id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maç Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Tarih</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Saat</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field">Saha Numarası</Label>
                  <Input
                    id="field"
                    name="field"
                    type="number"
                    min="1"
                    max={selectedTournament?.numberOfFields || 1}
                    value={formData.field}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aşama</Label>
                <Select value={formData.stage} onValueChange={handleSelectChange('stage')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aşama seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Grup Maçı</SelectItem>
                    <SelectItem value="knockout">Eleme Maçı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.stage === 'group' && selectedTournament && (
                <div className="space-y-2">
                  <Label>Grup</Label>
                  <Select value={formData.group} onValueChange={handleSelectChange('group')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grup seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTournament.groups.map((group) => (
                        <SelectItem key={group._id} value={group._id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ek Ayarlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Uzatma Süresi</Label>
                    <div className="text-sm text-muted-foreground">
                      Beraberlik durumunda uzatma devreleri oynanır
                    </div>
                  </div>
                  <Switch
                    checked={formData.extraTimeEnabled}
                    onCheckedChange={handleSwitchChange('extraTimeEnabled')}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Penaltı Atışları</Label>
                    <div className="text-sm text-muted-foreground">
                      Uzatmalarda da beraberlik bozulmazsa penaltı atışları yapılır
                    </div>
                  </div>
                  <Switch
                    checked={formData.penaltyShootoutEnabled}
                    onCheckedChange={handleSwitchChange('penaltyShootoutEnabled')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}