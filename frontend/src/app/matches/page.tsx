'use client';

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { matchService } from '@/lib/services/match'
import { tournamentService } from '@/lib/services/tournament'
import { Match } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Swords, Calendar, MapPin, ChevronRight, Trash2, PlusCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Maç durumu için tip tanımı
type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export default function MatchesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all');

  const { data: matchesResponse, isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const response = await matchService.getAll();
      return response;
    },
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await tournamentService.deleteFixture(tournamentId);
      if (!response.data) {
        throw new Error('Fikstür silinirken bir hata oluştu.');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: `Fikstür başarıyla silindi. ${data.deletedMatches} maç silindi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Fikstür silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteFixture = async (tournamentId: string) => {
    if (window.confirm('Fikstürü silmek istediğinize emin misiniz?')) {
      deleteFixtureMutation.mutate(tournamentId);
    }
  };

  // Maçları sırala ve filtrele
  const sortedAndFilteredMatches = useMemo(() => {
    if (!matchesResponse?.data) return [];

    let filteredMatches = [...matchesResponse.data];

    // Durum filtreleme
    if (statusFilter !== 'all') {
      filteredMatches = filteredMatches.filter(match => match.status === statusFilter);
    }

    // Maçları sırala:
    // 1. Turnuva adına göre
    // 2. Aşamaya göre (grup maçları -> çeyrek final -> yarı final -> final)
    // 3. Tarih ve saate göre
    return filteredMatches.sort((a, b) => {
      // Turnuva adına göre sırala
      const tournamentA = typeof a.tournament === 'string' ? '' : a.tournament.name;
      const tournamentB = typeof b.tournament === 'string' ? '' : b.tournament.name;
      if (tournamentA !== tournamentB) {
        return tournamentA.localeCompare(tournamentB);
      }

      // Aşamaya göre sırala
      const stageOrder = {
        'group': 0,
        'quarter_final': 1,
        'semi_final': 2,
        'final': 3
      };
      const stageA = stageOrder[a.stage as keyof typeof stageOrder] || 0;
      const stageB = stageOrder[b.stage as keyof typeof stageOrder] || 0;
      if (stageA !== stageB) {
        return stageA - stageB;
      }

      // Tarih ve saate göre sırala
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [matchesResponse?.data, statusFilter]);

  // Turnuvalara göre maçları grupla
  const matchesByTournament = useMemo(() => {
    const grouped = new Map<string, Match[]>();
    
    sortedAndFilteredMatches.forEach(match => {
      const tournamentId = typeof match.tournament === 'string' ? match.tournament : match.tournament._id;
      const tournamentName = typeof match.tournament === 'string' ? '' : match.tournament.name;
      const key = `${tournamentId}-${tournamentName}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(match);
    });
    
    return grouped;
  }, [sortedAndFilteredMatches]);

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

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Bekliyor</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Devam Ediyor</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-500">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-500 border-red-500">İptal Edildi</Badge>;
      default:
        return null;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'group':
        return <Badge variant="secondary">Grup Maçı</Badge>;
      case 'quarter_final':
        return <Badge variant="secondary">Çeyrek Final</Badge>;
      case 'semi_final':
        return <Badge variant="secondary">Yarı Final</Badge>;
      case 'final':
        return <Badge variant="secondary">Final</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Maçlar</h1>
          <p className="text-muted-foreground">Turnuva maç programı</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select 
            value={statusFilter} 
            onValueChange={(value: 'all' | MatchStatus) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Maçlar</SelectItem>
              <SelectItem value="scheduled">Bekleyen</SelectItem>
              <SelectItem value="in_progress">Devam Eden</SelectItem>
              <SelectItem value="completed">Tamamlanan</SelectItem>
              <SelectItem value="cancelled">İptal Edilen</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <>
              {sortedAndFilteredMatches.length > 0 ? (
                <>
                  <Link href="/matches/knockout" className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full gap-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-100 border-purple-200 dark:border-purple-800">
                      <Swords className="h-4 w-4" />
                      Eleme Aşaması Oluştur
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteFixture(
                      typeof sortedAndFilteredMatches[0].tournament === 'string' 
                        ? sortedAndFilteredMatches[0].tournament 
                        : sortedAndFilteredMatches[0].tournament._id
                    )}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Fikstürü Sil
                  </Button>
                  <Link href="/matches/schedule" className="w-full sm:w-auto">
                    <Button className="w-full">Fikstür Oluştur</Button>
                  </Link>
                </>
              ) : (
                <Link href="/matches/schedule" className="w-full sm:w-auto">
                  <Button className="w-full">Fikstür Oluştur</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {sortedAndFilteredMatches.length > 0 ? (
        <div className="space-y-8">
          {Array.from(matchesByTournament.entries()).map(([tournamentKey, matches]) => {
            const [, tournamentName] = tournamentKey.split('-');
            return (
              <div key={tournamentKey} className="space-y-4">
                <h2 className="text-xl font-semibold">{tournamentName}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <Card key={match._id} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Swords className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">
                              {match.homeTeam.name} vs {match.awayTeam.name}
                            </CardTitle>
                          </div>
                          {getStatusBadge(match.status as MatchStatus)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 flex-1">
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(match.date).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {new Date(match.date).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Saha {match.field}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStageBadge(match.stage)}
                              {match.group && (
                                <Badge variant="outline">{match.group}</Badge>
                              )}
                            </div>
                          </div>
                          {match.status === 'completed' && match.score && (
                            <div className="flex items-center justify-center space-x-4 font-semibold">
                              <span>{match.score.homeTeam}</span>
                              <span>-</span>
                              <span>{match.score.awayTeam}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Link href={`/matches/${match._id}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="w-full space-x-2">
                            <span>Detaylar</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && match.status === 'scheduled' && (
                          <Link href={`/matches/${match._id}/edit`} className="w-full sm:w-auto">
                            <Button size="sm" className="w-full">Düzenle</Button>
                          </Link>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-muted-foreground text-center">
            <p>Henüz oluşturulmuş maç bulunmuyor.</p>
            {isAdmin && <p className="text-sm">Turnuva seçerek otomatik fikstür oluşturabilirsiniz.</p>}
          </div>
          {isAdmin && (
            <Link href="/matches/schedule">
              <Button>Fikstür Oluştur</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 