'use client';

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { tournamentService } from '@/lib/services/tournament'
import { Tournament } from '@/types/api'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Calendar, Clock, MapPin, Swords } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'

export default function TournamentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: tournamentsResponse, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await tournamentService.getAll();
      return response || { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tournamentService.delete,
    onSuccess: (response) => {
      toast({
        title: 'Başarılı',
        description: response.data ? 
          `Turnuva ve ilişkili maçlar silindi:
          ${response.data.deletedData?.matches || 0} maç silindi.` :
          'Turnuva başarıyla silindi.',
      });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Hata',
        description: ('response' in error && error.response?.data?.message) || 'Turnuva silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu turnuvayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve turnuvaya ait tüm maçlar silinecektir.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Turnuva silme hatası:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Planlanıyor</Badge>;
      case 'group_stage':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Grup Aşaması</Badge>;
      case 'knockout_stage':
        return <Badge variant="outline" className="text-purple-500 border-purple-500">Eleme Aşaması</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Tamamlandı</Badge>;
      default:
        return null;
    }
  };

  const tournaments = tournamentsResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Turnuvalar</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Durum Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Planlanıyor</SelectItem>
              <SelectItem value="group_stage">Grup Aşaması</SelectItem>
              <SelectItem value="knockout_stage">Eleme Aşaması</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Link href="/tournaments/create" className="w-full sm:w-auto">
              <Button className="w-full">Yeni Turnuva Oluştur</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.length > 0 ? (
          tournaments.map((tournament: Tournament) => (
            <Card key={tournament._id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                  </div>
                  {getStatusBadge(tournament.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        {tournament.groups.reduce((total: number, group) => total + group.teams.length, 0)} Takım
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Swords className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">{tournament.groups.length} Grup</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{tournament.matchDuration} dk Maç</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{tournament.numberOfFields} Saha</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString('tr-TR')} - {new Date(tournament.endDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Link href={`/tournaments/${tournament._id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full">Detaylar</Button>
                </Link>
                {isAdmin && (
                  <>
                    <Link href={`/tournaments/${tournament._id}/edit`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full">Düzenle</Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(tournament._id)}
                      disabled={deleteMutation.isPending}
                      className="w-full sm:w-auto text-destructive hover:text-destructive"
                    >
                      Sil
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-xl font-semibold mb-2">Henüz turnuva bulunmuyor</div>
            <div className="text-muted-foreground mb-6">
              {isAdmin ? 'İlk turnuvanızı oluşturarak başlayın' : 'Henüz hiç turnuva oluşturulmamış'}
            </div>
            {isAdmin && (
              <Link href="/tournaments/create">
                <Button>İlk Turnuvayı Oluştur</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}