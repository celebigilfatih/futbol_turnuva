'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { tournamentService } from '@/lib/services/tournament';
import type { Tournament } from '@/types/api';
import { ArrowLeft } from 'lucide-react';

interface TournamentInput {
  name: string;
  startDate: string;
  endDate: string;
  numberOfFields: number;
  matchDuration: number;
  breakDuration: number;
  teamsPerGroup: number;
  startTime: string;
  endTime: string;
  lunchBreakStart: string;
  lunchBreakDuration: number;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

export default function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TournamentInput>({
    name: '',
    startDate: '',
    endDate: '',
    numberOfFields: 1,
    matchDuration: 30,
    breakDuration: 5,
    teamsPerGroup: 4,
    startTime: '09:00',
    endTime: '17:00',
    lunchBreakStart: '12:00',
    lunchBreakDuration: 60,
    extraTimeEnabled: true,
    penaltyShootoutEnabled: true,
  });

  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: ['tournament', resolvedParams.id],
    queryFn: async () => {
      const response = await tournamentService.getById(resolvedParams.id);
      return response.data;
    },
  });

  useEffect(() => {
    if (tournament) {
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString);
          return date instanceof Date && !isNaN(date.getTime()) 
            ? date.toISOString().split('T')[0]
            : '';
        } catch {
          return '';
        }
      };

      setFormData({
        name: tournament.name || '',
        startDate: formatDate(tournament.startDate),
        endDate: formatDate(tournament.endDate),
        numberOfFields: tournament.numberOfFields || 1,
        matchDuration: tournament.matchDuration || 30,
        breakDuration: tournament.breakDuration || 5,
        teamsPerGroup: tournament.teamsPerGroup || 4,
        startTime: tournament.startTime || '09:00',
        endTime: tournament.endTime || '17:00',
        lunchBreakStart: tournament.lunchBreakStart || '12:00',
        lunchBreakDuration: tournament.lunchBreakDuration || 60,
        extraTimeEnabled: tournament.extraTimeEnabled ?? true,
        penaltyShootoutEnabled: tournament.penaltyShootoutEnabled ?? true,
      });
    }
  }, [tournament]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tournament>) =>
      tournamentService.update(resolvedParams.id, data),
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Turnuva başarıyla güncellendi.',
      });
      queryClient.invalidateQueries({ queryKey: ['tournament', resolvedParams.id] });
      router.push(`/tournaments/${resolvedParams.id}`);
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Turnuva güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (value ? Number(value) : 0) : (value || '');
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
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
          <Link href={`/tournaments/${resolvedParams.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Turnuva Düzenle</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/tournaments/${resolvedParams.id}`}>
            <Button variant="outline">İptal</Button>
          </Link>
          <Button type="submit" form="tournament-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      <form id="tournament-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="name">Turnuva Adı</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maç Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfFields">Saha Sayısı</Label>
                <Input
                  id="numberOfFields"
                  name="numberOfFields"
                  type="number"
                  min="1"
                  value={formData.numberOfFields}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamsPerGroup">Grup Başına Takım</Label>
                <Input
                  id="teamsPerGroup"
                  name="teamsPerGroup"
                  type="number"
                  min="2"
                  value={formData.teamsPerGroup}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchDuration">Maç Süresi (dk)</Label>
                <Input
                  id="matchDuration"
                  name="matchDuration"
                  type="number"
                  min="10"
                  value={formData.matchDuration}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakDuration">Mola Süresi (dk)</Label>
                <Input
                  id="breakDuration"
                  name="breakDuration"
                  type="number"
                  min="1"
                  value={formData.breakDuration}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">İlk Maç Saati</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Son Maç Saati</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchBreakStart">Öğle Arası Başlangıç</Label>
                <Input
                  id="lunchBreakStart"
                  name="lunchBreakStart"
                  type="time"
                  value={formData.lunchBreakStart}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchBreakDuration">Öğle Arası Süresi (dk)</Label>
                <Input
                  id="lunchBreakDuration"
                  name="lunchBreakDuration"
                  type="number"
                  min="0"
                  value={formData.lunchBreakDuration}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
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
      </form>
    </div>
  );
} 