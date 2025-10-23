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
import { useToast } from '@/components/ui/use-toast';
import { teamService } from '@/lib/services/team';
import type { Team, Player } from '@/types/api';
import type { UpdateTeamData } from '@/lib/services/team';

interface PlayerInput {
  id?: string;
  _id?: string;
  name: string;
  number: number;
  position?: string;
  team?: string;
  tournament?: string;
}

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Takım verilerini çek
  const { data: team, isLoading: isLoadingTeam } = useQuery<Team>({
    queryKey: ['team', resolvedParams.id],
    queryFn: async () => {
      const response = await teamService.getById(resolvedParams.id);
      return response.data;
    },
  });

  // Form state'i
  const [formData, setFormData] = useState<{
    name: string;
    players: PlayerInput[];
  }>({
    name: '',
    players: [],
  });

  // Takım verisi geldiğinde form state'ini güncelle
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        players: team.players.map(player => ({
          _id: player._id,
          name: player.name,
          number: player.number,
          position: player.position,
        })),
      });
    }
  }, [team]);

  // Güncelleme mutation'ı
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTeamData) => teamService.update(resolvedParams.id, data),
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Takım başarıyla güncellendi.',
      });
      queryClient.invalidateQueries({ queryKey: ['team', resolvedParams.id] });
      router.push(`/teams/${resolvedParams.id}`);
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Takım güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Boş oyuncuları filtrele
    const validPlayers = formData.players?.filter(player => player.name.trim() !== '') || [];
    if (validPlayers.length < 2) {
      toast({
        title: 'Hata',
        description: 'En az 2 oyuncu eklemelisiniz.',
        variant: 'destructive',
      });
      return;
    }
    
    // UpdateTeamData formatına dönüştür
    const updateData: UpdateTeamData = {
      name: formData.name,
      players: validPlayers.map(player => ({
        name: player.name,
        number: player.number,
        position: player.position,
      })),
    };
    
    updateMutation.mutate(updateData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlayerChange = (index: number, field: keyof PlayerInput, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      players: (prev.players || []).map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      ),
    }));
  };

  const addPlayer = () => {
    setFormData((prev) => ({
      ...prev,
      players: [
        ...(prev.players || []),
        { name: '', number: (prev.players?.length || 0) + 1 },
      ],
    }));
  };

  const removePlayer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      players: (prev.players || []).filter((_, i) => i !== index),
    }));
  };

  if (isLoadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
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
        <h1 className="text-3xl font-bold tracking-tight">Takımı Düzenle</h1>
        <div className="space-x-2">
          <Link href={`/teams/${resolvedParams.id}`}>
            <Button variant="outline">Geri Dön</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Takım Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Takım Adı</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Yıldızlar SK"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label>Oyuncular</Label>
                <div className="space-y-4 mt-2">
                  {(formData.players || []).map((player, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-3 items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`player-${index}-name`}>
                          {index + 1}. Oyuncu Adı
                        </Label>
                        <Input
                          id={`player-${index}-name`}
                          value={player.name}
                          onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                          placeholder="Ahmet Yılmaz"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`player-${index}-number`}>
                          Forma Numarası
                        </Label>
                        <Input
                          id={`player-${index}-number`}
                          type="number"
                          min="1"
                          value={player.number}
                          onChange={(e) => handlePlayerChange(index, 'number', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`player-${index}-position`}>
                          Mevki (Opsiyonel)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={`player-${index}-position`}
                            value={player.position || ''}
                            onChange={(e) => handlePlayerChange(index, 'position', e.target.value)}
                            placeholder="Forvet"
                          />
                          {index >= 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => removePlayer(index)}
                            >
                              Sil
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addPlayer}
                  >
                    + Yeni Oyuncu Ekle
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}