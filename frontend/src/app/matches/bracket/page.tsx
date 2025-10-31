'use client';

import { useQuery } from '@tanstack/react-query';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import { Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type MatchStage = 'group' | 'quarter_final' | 'semi_final' | 'final' | 'gold_final' | 'silver_final' | 'bronze_final' | 'prestige_final';

interface ExtendedMatch extends Omit<Match, 'stage'> {
  stage: MatchStage;
}

// Helper function to get team display name
const getTeamDisplay = (match: ExtendedMatch, isHome: boolean, allMatches: ExtendedMatch[]) => {
  const team = isHome ? match.homeTeam : match.awayTeam;
  const crossoverInfo = match.crossoverInfo;
  
  // If match is completed or has score, always show actual team name
  if (match.status === 'completed' || match.score) {
    return team.name;
  }
  
  // If crossoverInfo exists and match hasn't been played yet
  if (crossoverInfo) {
    const info = isHome ? 
      { group: crossoverInfo.homeTeamGroup, rank: crossoverInfo.homeTeamRank } :
      { group: crossoverInfo.awayTeamGroup, rank: crossoverInfo.awayTeamRank };
    
    const groupName = info.group;
    
    // If it's a knockout stage placeholder (QF1, SF1, F1), show as is
    if (groupName.startsWith('QF') || groupName.startsWith('SF') || groupName.startsWith('F')) {
      return groupName;
    }
    
    // For group-based placeholders (A, B, C, D)
    // Check if all group matches are completed
    const groupMatches = allMatches.filter(m => 
      m.stage === 'group' && m.group === groupName
    );
    
    const allGroupMatchesCompleted = groupMatches.length > 0 && 
      groupMatches.every(m => m.status === 'completed');
    
    // If group stage is completed, show actual team name
    if (allGroupMatchesCompleted) {
      return team.name;
    }
    
    // Otherwise show placeholder format like "A 1." or "B 2."
    const groupLetter = groupName.replace('Grup ', '');
    return `${groupLetter} ${info.rank}.`;
  }
  
  // Fallback to team name
  return team.name;
};

export default function BracketPage() {
  const { data: activeTournament } = useQuery({
    queryKey: ['tournaments', 'active'],
    queryFn: async () => {
      const response = await tournamentService.getAll();
      // Get the first tournament that is not completed
      return response?.data?.find(t => t.status !== 'completed') || response?.data?.[0] || null;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', activeTournament?._id],
    queryFn: async () => {
      if (!activeTournament?._id) return [];
      // Use the matches endpoint with tournament filter
      const response = await matchService.getAll();
      console.log('All matches response:', response);
      console.log('All matches data length:', response?.data?.length);
      // Filter matches by tournament ID on the client side
      const allMatches = response?.data || [];
      const tournamentMatches = allMatches.filter(
        m => typeof m.tournament !== 'string' && m.tournament._id === activeTournament._id
      );
      console.log('Bracket matches loaded:', tournamentMatches.length);
      return tournamentMatches as ExtendedMatch[];
    },
    enabled: !!activeTournament?._id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-muted-foreground">Maçlar yükleniyor...</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Henüz maç bulunmuyor</h3>
        <p className="text-muted-foreground">Turnuva başladığında maçlar burada görüntülenecek</p>
      </div>
    );
  }

  // Get all knockout stages
  const quarterFinals = matches.filter(match => match.stage === 'quarter_final');
  const semiFinals = matches.filter(match => match.stage === 'semi_final');
  const goldFinals = matches.filter(match => match.stage === 'gold_final');
  const silverFinals = matches.filter(match => match.stage === 'silver_final');
  
  console.log('Knockout matches:', {
    quarterFinals: quarterFinals.length,
    semiFinals: semiFinals.length,
    goldFinals: goldFinals.length,
    silverFinals: silverFinals.length,
    totalMatches: matches.length
  });
  
  // Separate Silver and Gold brackets
  // Silver bracket: Quarter finals with rank 3 vs 4
  const silverQuarterFinals = quarterFinals.filter(match => {
    const crossoverInfo = match.crossoverInfo;
    const isSilver = crossoverInfo && (
      (crossoverInfo.homeTeamRank === 3 && crossoverInfo.awayTeamRank === 4) ||
      (crossoverInfo.homeTeamRank === 4 && crossoverInfo.awayTeamRank === 3)
    );
    return isSilver;
  });
  
  // Gold bracket: Quarter finals with rank 1 vs 2
  const goldQuarterFinals = quarterFinals.filter(match => {
    const crossoverInfo = match.crossoverInfo;
    return crossoverInfo && (
      (crossoverInfo.homeTeamRank === 1 && crossoverInfo.awayTeamRank === 2) ||
      (crossoverInfo.homeTeamRank === 2 && crossoverInfo.awayTeamRank === 1)
    );
  });
  
  // Silver semi finals - check for 'Silver' in group name OR ranks from Silver QF
  const silverSemiFinals = semiFinals.filter(match => {
    const crossoverInfo = match.crossoverInfo;
    if (!crossoverInfo) return false;
    // Check if homeTeamGroup contains 'Silver' (e.g., 'Silver_QF1')
    return crossoverInfo.homeTeamGroup?.includes('Silver');
  });
  
  // Gold semi finals - check for 'Gold' in group name OR ranks from Gold QF
  const goldSemiFinals = semiFinals.filter(match => {
    const crossoverInfo = match.crossoverInfo;
    if (!crossoverInfo) return false;
    // Check if homeTeamGroup contains 'Gold' (e.g., 'Gold_QF1')
    return crossoverInfo.homeTeamGroup?.includes('Gold');
  });
  
  // Finals (already separated by stage)
  const silverFinal = silverFinals[0];
  const goldFinal = goldFinals[0];
  
  console.log('Filtered brackets:', {
    silverQF: silverQuarterFinals.length,
    goldQF: goldQuarterFinals.length,
    silverSF: silverSemiFinals.length,
    goldSF: goldSemiFinals.length,
    silverFinal: !!silverFinal,
    goldFinal: !!goldFinal
  });

  const MatchCard = ({ match, className = '' }: { match: ExtendedMatch; className?: string }) => {
    const homeTeamName = getTeamDisplay(match, true, matches);
    const awayTeamName = getTeamDisplay(match, false, matches);
    const homeScore = match.score?.homeTeam ?? '-';
    const awayScore = match.score?.awayTeam ?? '-';
    
    // Check if this is a placeholder match (has crossoverInfo)
    const isPlaceholder = !!match.crossoverInfo && !match.score;
    
    console.log('Match card:', {
      id: match._id,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      stage: match.stage,
      isPlaceholder
    });
    
    const formatMatchDate = (date: string | Date) => {
      const d = new Date(date);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${day}.${month} ${hours}:${minutes}`;
    };
    
    return (
      <div className={cn("relative", className)}>
        <Card className="overflow-hidden border-2 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            {/* Match Info Header - Only show for non-placeholder matches */}
            {!isPlaceholder && (
              <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {match.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatMatchDate(match.date)}</span>
                    </div>
                  )}
                  {match.field && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Saha {match.field}</span>
                    </div>
                  )}
                </div>
                <Badge variant={match.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {match.status === 'completed' ? 'Tamamlandı' : 'Yaklaşan'}
                </Badge>
              </div>
            )}
            
            {/* Teams */}
            <div className="divide-y">
              <div className={cn(
                "flex items-center justify-between px-4 py-3 transition-colors",
                !isPlaceholder && match.score && match.score.homeTeam > match.score.awayTeam ? "bg-green-50 dark:bg-green-950" : "bg-background"
              )}>
                <span className="font-semibold text-sm">{homeTeamName}</span>
                <span className={cn(
                  "text-xl font-bold min-w-[2rem] text-center",
                  !isPlaceholder && match.score && match.score.homeTeam > match.score.awayTeam ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )}>
                  {isPlaceholder ? '' : homeScore}
                </span>
              </div>
              <div className={cn(
                "flex items-center justify-between px-4 py-3 transition-colors",
                !isPlaceholder && match.score && match.score.awayTeam > match.score.homeTeam ? "bg-green-50 dark:bg-green-950" : "bg-background"
              )}>
                <span className="font-semibold text-sm">{awayTeamName}</span>
                <span className={cn(
                  "text-xl font-bold min-w-[2rem] text-center",
                  !isPlaceholder && match.score && match.score.awayTeam > match.score.homeTeam ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )}>
                  {isPlaceholder ? '' : awayScore}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{activeTournament?.name || 'Turnuva Ağacı'}</h1>
            <p className="text-muted-foreground">Eleme Aşaması Ağaçları</p>
          </div>
        </div>
        <Trophy className="h-12 w-12 text-yellow-500" />
      </div>

      {/* GOLD BRACKET - Full Tree: QF → SF → F */}
      {(goldQuarterFinals.length > 0 || goldSemiFinals.length > 0 || goldFinal) && (
        <div className="overflow-x-auto">
          <div className="min-w-[1400px] p-8 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              🥇 Altın Bracket (1. ve 2. Sıralar)
            </h2>
            
            <div className="relative flex items-start justify-center gap-12 px-8">
              {/* Gold Quarter Finals */}
              {goldQuarterFinals.length > 0 && (
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-6 text-center bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-full">
                    Altın Çeyrek Final
                  </h3>
                  <div className="space-y-16">
                    {goldQuarterFinals.map((match, idx) => (
                      <div key={match._id} className="relative">
                        <MatchCard match={match} className="w-[280px]" />
                        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-yellow-300 dark:bg-yellow-700" />
                        {idx % 2 === 0 && idx + 1 < goldQuarterFinals.length && (
                          <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+2rem)] bg-yellow-300 dark:bg-yellow-700" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gold Semi Finals */}
              {goldSemiFinals.length > 0 && (
                <div className="flex flex-col items-center" style={{ marginTop: goldQuarterFinals.length > 0 ? '80px' : '0' }}>
                  <h3 className="text-lg font-bold mb-6 text-center bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-full">
                    Altın Yarı Final
                  </h3>
                  <div className="space-y-16">
                    {goldSemiFinals.map((match, idx) => (
                      <div key={match._id} className="relative">
                        <MatchCard match={match} className="w-[280px]" />
                        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-yellow-300 dark:bg-yellow-700" />
                        {idx === 0 && goldSemiFinals.length > 1 && (
                          <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-yellow-300 dark:bg-yellow-700" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gold Final */}
              {goldFinal && (
                <div className="flex flex-col items-center" style={{ marginTop: goldSemiFinals.length > 0 ? '160px' : '0' }}>
                  <h3 className="text-lg font-bold mb-6 text-center bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-full">
                    🏆 Altın Final
                  </h3>
                  <MatchCard match={goldFinal} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SILVER BRACKET - Full Tree: QF → SF → F */}
      {(silverQuarterFinals.length > 0 || silverSemiFinals.length > 0 || silverFinal) && (
        <div className="overflow-x-auto">
          <div className="min-w-[1400px] p-8 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 rounded-lg border-2 border-gray-300 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-gray-500" />
              🥈 Gümüş Bracket (3. ve 4. Sıralar)
            </h2>
            
            <div className="relative flex items-start justify-center gap-12 px-8">
              {/* Silver Quarter Finals */}
              {silverQuarterFinals.length > 0 && (
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-6 text-center bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-full">
                    Gümüş Çeyrek Final
                  </h3>
                  <div className="space-y-16">
                    {silverQuarterFinals.map((match, idx) => (
                      <div key={match._id} className="relative">
                        <MatchCard match={match} className="w-[280px]" />
                        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-gray-300 dark:bg-gray-700" />
                        {idx % 2 === 0 && idx + 1 < silverQuarterFinals.length && (
                          <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+2rem)] bg-gray-300 dark:bg-gray-700" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Silver Semi Finals */}
              {silverSemiFinals.length > 0 && (
                <div className="flex flex-col items-center" style={{ marginTop: silverQuarterFinals.length > 0 ? '80px' : '0' }}>
                  <h3 className="text-lg font-bold mb-6 text-center bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-full">
                    Gümüş Yarı Final
                  </h3>
                  <div className="space-y-16">
                    {silverSemiFinals.map((match, idx) => (
                      <div key={match._id} className="relative">
                        <MatchCard match={match} className="w-[280px]" />
                        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-gray-300 dark:bg-gray-700" />
                        {idx === 0 && silverSemiFinals.length > 1 && (
                          <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-gray-300 dark:bg-gray-700" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Silver Final */}
              {silverFinal && (
                <div className="flex flex-col items-center" style={{ marginTop: silverSemiFinals.length > 0 ? '160px' : '0' }}>
                  <h3 className="text-lg font-bold mb-6 text-center bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-full">
                    🏆 Gümüş Final
                  </h3>
                  <MatchCard match={silverFinal} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Finals Message */}
      {!goldFinal && !silverFinal && goldQuarterFinals.length === 0 && silverQuarterFinals.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz eleme maçı yok</h3>
          <p className="text-muted-foreground">Grup maçları tamamlandıktan sonra eleme ağacı oluşturulacak</p>
        </div>
      )}
    </div>
  );
} 