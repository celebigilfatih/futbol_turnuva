import { useQuery } from '@tanstack/react-query';
import { playerService } from '@/lib/services/player';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopScorersProps {
  tournamentId: string;
  limit?: number;
}

export function TopScorers({ tournamentId, limit }: TopScorersProps) {
  const { data: topScorers, isLoading } = useQuery({
    queryKey: ['topScorers', tournamentId],
    queryFn: () => playerService.getTopScorers(tournamentId, limit),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!topScorers || topScorers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Henüz gol kaydedilmemiş</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topScorers?.map((player, index) => (
        <div
          key={player._id || index}
          className={cn(
            "group relative p-4 rounded-xl border transition-all duration-200",
            index === 0 
              ? "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 hover:shadow-md border-amber-200 dark:border-amber-900/30" 
              : "bg-card hover:bg-muted/30 hover:shadow-sm"
          )}
        >
          {index === 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-xl" />
          )}
          <div className="flex items-center gap-4">
            {/* Sıralama */}
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
              index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-950" :
              index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900" :
              index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500 text-orange-950" :
              "bg-muted text-muted-foreground"
            )}>
              {index === 0 ? (
                <Trophy className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>

            {/* Oyuncu Bilgisi */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm truncate">{player.name}</p>
                {index === 0 && (
                  <Trophy className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{player.team.name}</p>
            </div>

            {/* İstatistikler */}
            <div className="flex items-center gap-3">
              {/* Gol Sayısı */}
              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm",
                  index === 0 
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-sm" 
                    : "bg-primary/10 text-primary"
                )}>
                  {player.goals}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Gol</p>
              </div>

              {/* Maç Sayısı */}
              <div className="text-center hidden sm:block">
                <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-muted text-xs font-semibold">
                  {player.matches}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Maç</p>
              </div>

              {/* Maç Başı Ortalama */}
              <div className="text-center hidden md:block">
                <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                  {player.goalsPerMatch}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ort.</p>
              </div>
            </div>
          </div>

          {/* Hover Effect Arrow */}
          {index === 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}