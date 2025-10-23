'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { tournamentService } from '@/lib/services/tournament';
import { Trophy, Clock, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TournamentInput extends Record<string, unknown> {
  name: string;
  teamsPerGroup: number;
  numberOfGroups: number;
  numberOfFields: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  matchDuration: number;
  breakDuration: number;
  lunchBreakDuration: number;
  lunchBreakStart: string;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<TournamentInput>({
    name: '',
    teamsPerGroup: 4,
    numberOfGroups: 4,
    numberOfFields: 2,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    matchDuration: 30,
    breakDuration: 5,
    lunchBreakDuration: 15,
    lunchBreakStart: '12:00',
    extraTimeEnabled: true,
    penaltyShootoutEnabled: true,
  });

  const createMutation = useMutation({
    mutationFn: tournamentService.create,
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Turnuva başarıyla oluşturuldu.',
      });
      router.push('/tournaments');
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Turnuva oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    createMutation.mutate(formData);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: ['teamsPerGroup', 'numberOfGroups', 'numberOfFields', 'matchDuration', 'breakDuration', 'lunchBreakDuration'].includes(name) 
        ? Number(value) 
        : value,
    }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/tournaments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Yeni Turnuva Oluştur</h1>
            <p className="text-sm text-muted-foreground">Turnuva bilgilerini girerek yeni bir turnuva oluşturun</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle>Temel Bilgiler</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Turnuva Adı</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="2024 Yaz Turnuvası"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamsPerGroup">Grup Başına Takım</Label>
                <Input
                  id="teamsPerGroup"
                  name="teamsPerGroup"
                  type="number"
                  min={2}
                  max={8}
                  value={formData.teamsPerGroup}
                  onChange={(e) => handleInputChange('teamsPerGroup', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfGroups">Grup Sayısı</Label>
                <Input
                  id="numberOfGroups"
                  name="numberOfGroups"
                  type="number"
                  min={2}
                  max={8}
                  value={formData.numberOfGroups}
                  onChange={(e) => handleInputChange('numberOfGroups', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfFields">Saha Sayısı</Label>
                <Input
                  id="numberOfFields"
                  name="numberOfFields"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.numberOfFields}
                  onChange={(e) => handleInputChange('numberOfFields', e.target.value)}
                  required
                />
              </div>

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Maç Ayarları</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="startTime">Günlük Başlangıç Saati</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Son Maç Saati</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchDuration">Maç Süresi (dk)</Label>
                <Select
                  value={formData.matchDuration.toString()}
                  onValueChange={handleSelectChange('matchDuration')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Maç süresi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => 20 + i * 5).map((duration) => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} dakika
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakDuration">Devre Arası Süresi (dk)</Label>
                <Select
                  value={formData.breakDuration.toString()}
                  onValueChange={handleSelectChange('breakDuration')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Devre arası süresi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 3 }, (_, i) => 5 + i * 5).map((duration) => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} dakika
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchBreakStart">Öğle Arası Başlangıcı</Label>
                <Input
                  id="lunchBreakStart"
                  name="lunchBreakStart"
                  type="time"
                  value={formData.lunchBreakStart}
                  onChange={(e) => handleInputChange('lunchBreakStart', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchBreakDuration">Öğle Arası Süresi (dk)</Label>
                <Select
                  value={formData.lunchBreakDuration.toString()}
                  onValueChange={handleSelectChange('lunchBreakDuration')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Öğle arası süresi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => 15 + i * 15).map((duration) => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} dakika
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Uzatma Süresi</Label>
                  <p className="text-sm text-muted-foreground">
                    Berabere biten maçlarda uzatma devreleri oynanır
                  </p>
                </div>
                <Switch
                  checked={formData.extraTimeEnabled}
                  onCheckedChange={handleSwitchChange('extraTimeEnabled')}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Penaltı Atışları</Label>
                  <p className="text-sm text-muted-foreground">
                    Uzatmalarda da berabere biten maçlarda penaltı atışları yapılır
                  </p>
                </div>
                <Switch
                  checked={formData.penaltyShootoutEnabled}
                  onCheckedChange={handleSwitchChange('penaltyShootoutEnabled')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:space-x-4">
          <Link href="/tournaments" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">İptal</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={createMutation.isPending}
            className="w-full sm:w-auto min-w-[150px]"
          >
            {createMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Oluşturuluyor</span>
              </div>
            ) : (
              'Turnuva Oluştur'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}