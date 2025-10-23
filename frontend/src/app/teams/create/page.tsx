'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { teamService } from '@/lib/services/team';
import type { CreateTeamData } from '@/lib/services/team';

interface PlayerInput {
  name: string;
  number: number;
  position?: string;
}

export default function CreateTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    players: [
      { name: '', number: 1 },
      { name: '', number: 2 },
    ],
  });

  const createMutation = useMutation({
    mutationFn: teamService.create,
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Takım başarıyla oluşturuldu.',
      });
      router.push('/teams');
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: 'Takım oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Boş oyuncuları filtrele
    const validPlayers = formData.players.filter(player => player.name.trim() !== '');
    if (validPlayers.length < 2) {
      toast({
        title: 'Hata',
        description: 'En az 2 oyuncu eklemelisiniz.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate({
      ...formData,
      players: validPlayers,
    });
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
      players: prev.players.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      ),
    }));
  };

  const addPlayer = () => {
    setFormData((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { name: '', number: prev.players.length + 1 },
      ],
    }));
  };

  const removePlayer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Yeni Takım Oluştur</h1>
        <Link href="/teams">
          <Button variant="outline">Geri Dön</Button>
        </Link>
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
                  {formData.players.map((player, index) => (
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Oluşturuluyor...' : 'Takım Oluştur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 