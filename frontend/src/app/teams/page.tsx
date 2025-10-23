'use client';

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { teamService } from '@/lib/services/team'
import type { Team } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Goal, ChevronRight, Shield, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function TeamsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: teamService.delete,
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Takım başarıyla silindi.',
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Hata',
        description: ('response' in error && error.response?.data?.message) || 'Takım silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu takımı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Takım silme hatası:', error);
      }
    }
  };

  const { data: teamsResponse, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamService.getAll(1, 50);
      return response;
    },
  });

  const teams = teamsResponse?.data;

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Takımlar</h1>
          <p className="text-muted-foreground">Turnuvalara katılan tüm takımlar</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Takımlar</SelectItem>
              <SelectItem value="points">Puana Göre</SelectItem>
              <SelectItem value="goals">Gol Sayısına Göre</SelectItem>
              <SelectItem value="wins">Galibiyete Göre</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Link href="/teams/create" className="w-full sm:w-auto">
              <Button className="w-full">Yeni Takım Oluştur</Button>
            </Link>
          )}
        </div>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team._id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>{team.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    {team.players.length} Oyuncu
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">Galibiyet</span>
                      </div>
                      <div className="text-2xl font-bold">{team.groupStats.won}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Goal className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm font-medium">Gol</span>
                      </div>
                      <div className="text-2xl font-bold">{team.groupStats.goalsFor}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm font-medium">Puan</span>
                      </div>
                      <div className="text-2xl font-bold">{team.groupStats.points}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>Maç: {team.groupStats.played}</span>
                    <span>•</span>
                    <span>Beraberlik: {team.groupStats.drawn}</span>
                    <span>•</span>
                    <span>Mağlubiyet: {team.groupStats.lost}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Link href={`/teams/${team._id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full space-x-2">
                      <span>Detaylar</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href={`/teams/${team._id}/edit`} className="w-full sm:w-auto">
                      <Button size="sm" className="w-full">Düzenle</Button>
                    </Link>
                  )}
                </div>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(team._id)}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 bg-red-100 dark:bg-red-900/20 text-destructive hover:text-destructive-foreground hover:bg-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-xl font-semibold mb-2">Henüz takım bulunmuyor</div>
          <div className="text-muted-foreground mb-6">
            Turnuvaya katılacak takımları oluşturmak için yeni takım ekleyin.
          </div>
          {isAdmin && (
            <Link href="/teams/create">
              <Button>İlk Takımı Oluştur</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}