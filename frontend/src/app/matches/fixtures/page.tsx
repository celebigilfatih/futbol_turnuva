'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpDown, Printer, Filter, Download, Clock, MapPin, Users } from 'lucide-react';
import { matchService } from '@/lib/services/match';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { Match } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/components/ui/use-toast';
import { queryClient } from '@/lib/query-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FixturesPage() {
  const { data: matchesResponse, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const response = await matchService.getAll();
      return response;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const matches = matchesResponse?.data || [];

  // Filter states
  const [editMode, setEditMode] = useState(false);
  const [editedMatches, setEditedMatches] = useState<Match[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'field'>('date');

  // Get unique tournaments for filter
  const tournaments = useMemo(() => {
    const unique = new Map();
    matches.forEach(match => {
      if (typeof match.tournament !== 'string') {
        unique.set(match.tournament._id, match.tournament);
      }
    });
    return Array.from(unique.values());
  }, [matches]);

  // Get unique fields for filter
  const fields = useMemo(() => {
    return Array.from(new Set(matches.map(m => m.field))).sort((a, b) => a - b);
  }, [matches]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    // Filter by tournament
    if (selectedTournament !== 'all') {
      filtered = filtered.filter(m => 
        typeof m.tournament !== 'string' && m.tournament._id === selectedTournament
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === selectedStatus);
    }

    // Filter by field
    if (selectedField !== 'all') {
      const fieldNum = parseInt(selectedField);
      filtered = filtered.filter(m => m.field === fieldNum);
    }

    // Filter by search text
    if (globalFilter) {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter(m => 
        m.homeTeam.name.toLowerCase().includes(searchLower) ||
        m.awayTeam.name.toLowerCase().includes(searchLower) ||
        m.group?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => {
        // Helper function to get stage sort order with Silver/Gold distinction
        const getStageSortOrder = (match: Match) => {
          const crossoverInfo = (match as any).crossoverInfo;
          
          const baseStageOrder: { [key: string]: number } = {
            'group': 0,
            'quarter_final': 1,
            'semi_final': 5,
            'silver_final': 9,      // Silver Final
            'gold_final': 10,       // Gold Final  
            'bronze_final': 11,
            'prestige_final': 12
          };
          
          const baseOrder = baseStageOrder[match.stage] ?? 99;
          
          // For quarter_final and semi_final, distinguish Silver vs Gold within same stage
          if (match.stage === 'quarter_final' && crossoverInfo) {
            const isGoldMatch = (crossoverInfo.homeTeamRank === 1 && crossoverInfo.awayTeamRank === 2) ||
                               (crossoverInfo.homeTeamRank === 2 && crossoverInfo.awayTeamRank === 1);
            return baseOrder + (isGoldMatch ? 2 : 0); // Silver QF: 1, Gold QF: 3
          } else if (match.stage === 'semi_final' && crossoverInfo) {
            const isGoldMatch = crossoverInfo.homeTeamGroup?.includes('Gold');
            return baseOrder + (isGoldMatch ? 2 : 0); // Silver SF: 5, Gold SF: 7
          }
          
          return baseOrder;
        };

        // For knockout matches, sort by stage order
        if (a.stage !== 'group' && b.stage !== 'group') {
          const aStageOrder = getStageSortOrder(a);
          const bStageOrder = getStageSortOrder(b);
          if (aStageOrder !== bStageOrder) {
            return aStageOrder - bStageOrder;
          }
        }

        // Group matches and non-matching stages: sort by date
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    } else if (sortBy === 'field') {
      filtered.sort((a, b) => {
        if (a.field !== b.field) return a.field - b.field;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }

    return filtered;
  }, [matches, selectedTournament, selectedStatus, selectedField, globalFilter, sortBy]);

  // Update initialization: only set editedMatches if not already set
  useEffect(() => {
    if (filteredMatches.length > 0 && editedMatches.length === 0) {
      setEditedMatches(filteredMatches);
    }
  }, [filteredMatches]);

  // Function to handle time change and update subsequent matches for the same field
  const handleTimeChange = (index: number, newTime: string) => {
    setEditedMatches(prev => {
      const updated = [...prev];
      const match = updated[index];
      const oldDate = new Date(match.date);
      const [newHourStr, newMinuteStr] = newTime.split(':');
      const newHour = parseInt(newHourStr, 10);
      const newMinute = parseInt(newMinuteStr, 10);
      const newDate = new Date(oldDate);
      newDate.setUTCHours(newHour, newMinute, 0, 0);
      const delta = newDate.getTime() - oldDate.getTime();
      updated[index] = { ...match, date: newDate.toISOString() };
      for (let i = index + 1; i < updated.length; i++) {
        // Only update matches on the same field
        if (updated[i].field === match.field) {
          const currDate = new Date(updated[i].date);
          const newCurrDate = new Date(currDate.getTime() + delta);
          updated[i] = { ...updated[i], date: newCurrDate.toISOString() };
        }
      }
      setHasChanges(true);
      return updated;
    });
  };

  // Add field editing state
  const handleFieldChange = (index: number, newField: string) => {
    setEditedMatches(prev => {
      const updated = [...prev];
      const fieldNumber = parseInt(newField);
      if (!isNaN(fieldNumber) && fieldNumber > 0) {
        updated[index] = { 
          ...updated[index], 
          field: fieldNumber // Keep as number since Match.field is now number
        };
        setHasChanges(true);
      }
      return updated;
    });
  };

  // Save changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async (matches: Match[]) => {
      const promises = matches.map(match => 
        matchService.update(match._id, { 
          date: match.date,
          field: match.field
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Fikstür değişiklikleri kaydedildi.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Fikstür değişiklikleri kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });

  const handleSaveChanges = () => {
    saveChangesMutation.mutate(editedMatches);
    setEditMode(false);
  };

  // Yazdırma fonksiyonu
  const handlePrint = () => {
    window.print();
  };

  const columns: ColumnDef<Match>[] = useMemo(() => [
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <div className="text-left font-semibold text-slate-700 dark:text-slate-200">
          Tarih
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString('tr-TR'),
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'date',
      id: 'time',
      header: ({ column }) => (
        <div className="text-left font-semibold text-slate-700 dark:text-slate-200">
          Saat
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        if (editMode) {
          const currentTime = new Date(row.getValue('date'));
          const hours = String(currentTime.getUTCHours()).padStart(2, '0');
          const minutes = String(currentTime.getUTCMinutes()).padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;
          return <Input type="time" value={timeStr} onChange={(e) => handleTimeChange(row.index, e.target.value)} />;
        } else {
          const date = new Date(row.getValue('date'));
          const hours = String(date.getUTCHours()).padStart(2, '0');
          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'group',
      header: ({ column }) => (
        <div className="text-left font-semibold text-slate-700 dark:text-slate-200">
          Grup/Aşama
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        const match = row.original;
        
        // Helper function to get stage label in Turkish
        const getStageName = (stage: string) => {
          const stageMap: { [key: string]: string } = {
            'group': 'Grup Maçı',
            'gold_final': 'Altın Final',
            'silver_final': 'Gümüş Final',
            'bronze_final': 'Bronz Final',
            'prestige_final': 'Prestij Final'
          };
          return stageMap[stage] || stage;
        };

        // For knockout stages (quarter_final, semi_final), determine if Silver or Gold
        // based on crossoverInfo:
        // - Silver = 3rd vs 4th crossover OR winners from Silver bracket
        // - Gold = 1st vs 2nd crossover OR winners from Gold bracket
        // Note: Finals use gold_final/silver_final stages directly
        const getKnockoutStageName = (match: Match) => {
          if (match.stage === 'group' || match.stage === 'gold_final' || match.stage === 'silver_final' || match.stage === 'bronze_final' || match.stage === 'prestige_final') {
            return getStageName(match.stage);
          }

          const crossoverInfo = (match as any).crossoverInfo;
          
          if (!crossoverInfo) {
            return match.stage;
          }
          
          // Determine if this is a Silver or Gold match based on crossoverInfo
          let isSilverMatch = false;
          let isGoldMatch = false;
          
          if (match.stage === 'quarter_final') {
            // Silver QF: 3rd vs 4th crossover (3 vs 4, 4 vs 3)
            isSilverMatch = (crossoverInfo.homeTeamRank === 3 && crossoverInfo.awayTeamRank === 4) ||
                           (crossoverInfo.homeTeamRank === 4 && crossoverInfo.awayTeamRank === 3);
            // Gold QF: 1st vs 2nd crossover (1 vs 2, 2 vs 1)
            isGoldMatch = (crossoverInfo.homeTeamRank === 1 && crossoverInfo.awayTeamRank === 2) ||
                         (crossoverInfo.homeTeamRank === 2 && crossoverInfo.awayTeamRank === 1);
          } else if (match.stage === 'semi_final') {
            // Silver SF: Winners from Silver QF
            isSilverMatch = crossoverInfo.homeTeamGroup?.includes('Silver');
            // Gold SF: Winners from Gold QF
            isGoldMatch = crossoverInfo.homeTeamGroup?.includes('Gold');
          }
          
          if (match.stage === 'quarter_final') {
            return isGoldMatch ? 'Altın Çeyrek Final' : 'Gümüş Çeyrek Final';
          } else if (match.stage === 'semi_final') {
            return isGoldMatch ? 'Altın Yarı Final' : 'Gümüş Yarı Final';
          }
          
          return match.stage;
        };

        // For group stage, show group name
        if (match.stage === 'group') {
          return (
            <Badge variant="outline" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/50">
              {match.group || '-'}
            </Badge>
          );
        }
        
        // For knockout stages, show stage name
        return (
          <Badge variant="outline" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/50">
            {getKnockoutStageName(match)}
          </Badge>
        );
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'field',
      header: ({ column }) => (
        <div className="text-left font-semibold text-slate-700 dark:text-slate-200">
          Saha
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        if (editMode) {
          const fieldValue = row.original.field;
          return (
            <Input
              type="number"
              min="1"
              value={fieldValue}
              onChange={(e) => handleFieldChange(row.index, e.target.value)}
              className="w-20"
            />
          );
        } else {
          return (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Saha {row.getValue('field')}</span>
            </div>
          );
        }
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'homeTeam.name',
      header: ({ column }) => (
        <div className="text-left font-semibold text-slate-700 dark:text-slate-200">
          Ev Sahibi
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        const match = row.original;
        
        // If match has no score and is a knockout stage, show placeholder
        if (!match.score && match.stage !== 'group' && match.crossoverInfo) {
          const homeRank = match.crossoverInfo.homeTeamRank;
          const homeGroup = match.crossoverInfo.homeTeamGroup.replace('Grup ', '');
          return (
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {homeGroup}{homeRank}
            </span>
          );
        }
        
        return match.homeTeam.name;
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'awayTeam.name',
      header: ({ column }) => (
        <div className="text-left font-semibold text-slate-700 dark:text-slate-200">
          Deplasman
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        const match = row.original;
        
        // If match has no score and is a knockout stage, show placeholder
        if (!match.score && match.stage !== 'group' && match.crossoverInfo) {
          const awayRank = match.crossoverInfo.awayTeamRank;
          const awayGroup = match.crossoverInfo.awayTeamGroup.replace('Grup ', '');
          return (
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {awayGroup}{awayRank}
            </span>
          );
        }
        
        return match.awayTeam.name;
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'score',
      header: ({ column }) => (
        <div className="text-center font-semibold text-slate-700 dark:text-slate-200">
          Skor
        </div>
      ),
      cell: ({ row }) => {
        const match = row.original;
        const score = match.score;
        if (!score) {
          return (
            <div className="text-center">
              <Link href={`/matches/${match._id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  Gir
                </Button>
              </Link>
            </div>
          );
        }
        return (
          <div className="text-center font-bold">
            <span className={score.homeTeam > score.awayTeam ? 'text-teal-600 dark:text-teal-400' : ''}>
              {score.homeTeam}
            </span>
            {' - '}
            <span className={score.awayTeam > score.homeTeam ? 'text-teal-600 dark:text-teal-400' : ''}>
              {score.awayTeam}
            </span>
          </div>
        );
      },
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="text-center font-semibold text-slate-700 dark:text-slate-200">
          Durum
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        switch (status) {
          case 'scheduled':
            return <div className="text-center"><Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">Bekliyor</Badge></div>;
          case 'in_progress':
            return <div className="text-center"><Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">Devam Ediyor</Badge></div>;
          case 'completed':
            return <div className="text-center"><Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800">Tamamlandı</Badge></div>;
          case 'cancelled':
            return <div className="text-center"><Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">İptal Edildi</Badge></div>;
          default:
            return <div className="text-center"><Badge variant="outline">-</Badge></div>;
        }
      },
      enableSorting: true,
      enableGlobalFilter: true,
    }
  ], [editMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fikstür</h1>
            <p className="text-sm text-muted-foreground">
              Toplam {filteredMatches.length} maç
              {selectedTournament !== 'all' && ` • Seçili turnuva: ${tournaments.find(t => t._id === selectedTournament)?.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="print:hidden"
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Filtreler</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Ara
            </label>
            <Input
              placeholder="Takım veya grup adı..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Tournament Filter */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Turnuva
            </label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Turnuvalar</SelectItem>
                {tournaments.map(tour => (
                  <SelectItem key={tour._id} value={tour._id}>
                    {tour.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Durum
            </label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="scheduled">Bekliyor</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Filter */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Saha
            </label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sahalar</SelectItem>
                {fields.map(field => (
                  <SelectItem key={field} value={field.toString()}>
                    Saha {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Sırala
            </label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'field')}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tarih</SelectItem>
                <SelectItem value="field">Saha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {editMode && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
            İptal
          </Button>
          {hasChanges && (
            <Button 
              onClick={handleSaveChanges}
              disabled={saveChangesMutation.isPending}
              size="sm"
            >
              {saveChangesMutation.isPending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                  Kaydediliyor
                </>
              ) : (
                <>Değişiklikleri Kaydet</>
              )}
            </Button>
          )}
          <span className="text-xs text-slate-600 dark:text-slate-400 ml-auto">
            {hasChanges ? '✓ Değişiklikler var' : 'Değişiklik yok'}
          </span>
        </div>
      )}

      {!editMode && (
        <Button variant="outline" onClick={() => setEditMode(true)} size="sm">
          Fikstürü Düzenle
        </Button>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
          table, th, td {
            color: #000 !important;
            font-weight: 600 !important;
          }
        }
      `}</style>

      {/* Table */}
      <div className="print-content">
        {filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Sonuç yok</h3>
            <p className="text-sm text-muted-foreground mt-2">Seçilen filtrelerle eşleşen maç bulunamadı</p>
          </div>
        ) : (
          <DataTable 
            key={editMode ? 'edit' : 'view'}
            columns={columns} 
            data={editMode ? editedMatches : filteredMatches}
            rowClassName={(row) => {
              const status = row.status;
              switch (status) {
                case 'in_progress':
                  return 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-100 transition-colors';
                case 'completed':
                  return 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 dark:text-teal-100 transition-colors';
                case 'cancelled':
                  return 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-100 transition-colors';
                default:
                  return 'hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:text-slate-100 transition-colors';
              }
            }}
            hideSearch
          />
        )}
      </div>
    </div>
  );
}