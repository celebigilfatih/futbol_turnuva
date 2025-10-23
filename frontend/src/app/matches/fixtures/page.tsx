'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpDown, Printer } from 'lucide-react';
import { matchService } from '@/lib/services/match';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { Match } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/components/ui/use-toast';
import { queryClient } from '@/lib/query-client';

export default function FixturesPage() {
  const { data: matchesResponse, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const response = await matchService.getAll();
      return response;
    },
  });

  const matches = matchesResponse?.data || [];

  // Add state for edit mode and edited matches
  const [editMode, setEditMode] = useState(false);
  const [editedMatches, setEditedMatches] = useState<Match[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Update initialization: only set editedMatches if not already set
  useEffect(() => {
    if (matches.length > 0 && editedMatches.length === 0) {
      const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEditedMatches(sortedMatches);
    }
  }, [matches]);

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
      newDate.setHours(newHour, newMinute, 0, 0);
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

  const [globalFilter, setGlobalFilter] = useState<string | undefined>(undefined);

  const columns: ColumnDef<Match>[] = useMemo(() => [
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <div className="text-left font-semibold text-primary dark:text-green-100">
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
        <div className="text-left font-semibold text-primary dark:text-green-100">
          Saat
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        if (editMode) {
          const currentTime = new Date(row.getValue('date'));
          const hours = String(currentTime.getHours()).padStart(2, '0');
          const minutes = String(currentTime.getMinutes()).padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;
          return <Input type="time" value={timeStr} onChange={(e) => handleTimeChange(row.index, e.target.value)} />;
        } else {
          return new Date(row.getValue('date')).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'group',
      header: ({ column }) => (
        <div className="text-left font-semibold text-primary dark:text-green-100">
          Grup
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => {
        const group = row.original.group;
        if (!group) return "-";
        return <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 text-black border-blue-300 dark:bg-blue-950 dark:text-black dark:border-blue-800 dark:hover:bg-blue-900">{group}</Badge>;
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'field',
      header: ({ column }) => (
        <div className="text-left font-semibold text-primary dark:text-green-100">
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
          return `Saha ${row.getValue('field')}`;
        }
      },
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'homeTeam.name',
      header: ({ column }) => (
        <div className="text-left font-semibold text-primary dark:text-green-100">
          Ev Sahibi
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => row.original.homeTeam.name,
      enableSorting: true,
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'awayTeam.name',
      header: ({ column }) => (
        <div className="text-left font-semibold text-primary dark:text-green-100">
          Deplasman
          <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
        </div>
      ),
      cell: ({ row }) => row.original.awayTeam.name,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fikstür</h1>
            <p className="text-muted-foreground">Tüm turnuvaların maç programı</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Ara..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Düzenlemeyi Bitir' : 'Fikstürü Düzenle'}
            </Button>
            {editMode && hasChanges && (
              <Button 
                onClick={handleSaveChanges}
                disabled={saveChangesMutation.isPending}
              >
                {saveChangesMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Kaydediliyor
                  </>
                ) : (
                  'Değişiklikleri Kaydet'
                )}
              </Button>
            )}
            <Button
              onClick={handlePrint}
              className="print:hidden"
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Yazdır
            </Button>
          </div>
        </div>
      </div>

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

      <div className="print-content">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            {matches.length > 0 && typeof matches[0].tournament !== 'string' && (
              <h2 className="text-2xl font-semibold">{matches[0].tournament.name}</h2>
            )}
          </div>
          <DataTable 
            key={editMode ? 'edit' : 'view'}
            columns={columns} 
            data={editedMatches.length > 0 ? editedMatches : matches}
            rowClassName={(row) => {
              const status = row.status;
              switch (status) {
                case 'in_progress':
                  return 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:hover:bg-yellow-950 dark:text-yellow-100 transition-colors';
                case 'completed':
                  return 'bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950 dark:text-green-100 transition-colors';
                case 'cancelled':
                  return 'bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-950 dark:text-red-100 transition-colors';
                default:
                  return 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 transition-colors';
              }
            }}
            hideSearch
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
          />
        </div>
      </div>
    </div>
  );
}