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
      const response = await matchService.getByTournament(activeTournament._id);
      console.log('Bracket matches loaded:', response.data?.length);
      return response.data as ExtendedMatch[];
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

  // Crossover finals
  const goldFinals = matches.filter(match => match.stage === 'gold_final');
  const silverFinals = matches.filter(match => match.stage === 'silver_final');
  const bronzeFinals = matches.filter(match => match.stage === 'bronze_final');
  const prestigeFinals = matches.filter(match => match.stage === 'prestige_final');
  
  // Traditional knockout stages
  const quarterFinals = matches.filter(match => match.stage === 'quarter_final');
  const semiFinals = matches.filter(match => match.stage === 'semi_final');
  const final = matches.find(match => match.stage === 'final');

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
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
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
      {/* Debug Info */}
      {activeTournament && matches && (
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs">
          <p>Tournament: {activeTournament.name} ({activeTournament.status})</p>
          <p>Total Matches: {matches.length}</p>
          <p>Quarter Finals: {quarterFinals.length} | Semi Finals: {semiFinals.length} | Final: {final ? 1 : 0}</p>
          <p>Crossover: Gold {goldFinals.length} | Silver {silverFinals.length} | Bronze {bronzeFinals.length} | Prestige {prestigeFinals.length}</p>
        </div>
      )}

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
            <p className="text-muted-foreground">Final Aşamaları ve Eşleşmeler</p>
          </div>
        </div>
        <Trophy className="h-12 w-12 text-yellow-500" />
      </div>

      {/* Gold Finals Bracket - Separate Tree */}
      {goldFinals.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-8 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              🥇 Altın Final Ağacı
            </h2>
            <div className="relative flex items-center justify-center gap-12">
              {/* Semi-finals */}
              <div className="flex flex-col gap-16">
                {goldFinals.slice(0, 2).map((match, idx) => (
                  <div key={match._id} className="relative">
                    <MatchCard match={match} className="w-[280px]" />
                    {/* Connector to final */}
                    <div className="absolute left-full top-1/2 w-12 h-0.5 bg-yellow-400 dark:bg-yellow-600" />
                    {idx === 0 && goldFinals.length > 2 && (
                      <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-yellow-400 dark:bg-yellow-600" />
                    )}
                  </div>
                ))}
              </div>
              {/* Final */}
              {goldFinals.length > 2 && (
                <div className="flex flex-col items-center" style={{ marginTop: '80px' }}>
                  <MatchCard match={goldFinals[2]} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Silver Finals Bracket - Separate Tree */}
      {silverFinals.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-8 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 rounded-lg border-2 border-gray-300 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-gray-500" />
              🥈 Gümüş Final Ağacı
            </h2>
            <div className="relative flex items-center justify-center gap-12">
              {/* Semi-finals */}
              <div className="flex flex-col gap-16">
                {silverFinals.slice(0, 2).map((match, idx) => (
                  <div key={match._id} className="relative">
                    <MatchCard match={match} className="w-[280px]" />
                    {/* Connector to final */}
                    <div className="absolute left-full top-1/2 w-12 h-0.5 bg-gray-400 dark:bg-gray-600" />
                    {idx === 0 && silverFinals.length > 2 && (
                      <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-gray-400 dark:bg-gray-600" />
                    )}
                  </div>
                ))}
              </div>
              {/* Final */}
              {silverFinals.length > 2 && (
                <div className="flex flex-col items-center" style={{ marginTop: '80px' }}>
                  <MatchCard match={silverFinals[2]} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bronze Finals Bracket - Separate Tree */}
      {bronzeFinals.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border-2 border-orange-300 dark:border-orange-700">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-orange-500" />
              🥉 Bronz Final Ağacı
            </h2>
            <div className="relative flex items-center justify-center gap-12">
              {/* Semi-finals */}
              <div className="flex flex-col gap-16">
                {bronzeFinals.slice(0, 2).map((match, idx) => (
                  <div key={match._id} className="relative">
                    <MatchCard match={match} className="w-[280px]" />
                    {/* Connector to final */}
                    <div className="absolute left-full top-1/2 w-12 h-0.5 bg-orange-400 dark:bg-orange-600" />
                    {idx === 0 && bronzeFinals.length > 2 && (
                      <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-orange-400 dark:bg-orange-600" />
                    )}
                  </div>
                ))}
              </div>
              {/* Final */}
              {bronzeFinals.length > 2 && (
                <div className="flex flex-col items-center" style={{ marginTop: '80px' }}>
                  <MatchCard match={bronzeFinals[2]} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prestige Finals Bracket - Separate Tree */}
      {prestigeFinals.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-lg border-2 border-purple-300 dark:border-purple-700">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-purple-500" />
              ⭐ Prestij Final Ağacı
            </h2>
            <div className="relative flex items-center justify-center gap-12">
              {/* Semi-finals */}
              <div className="flex flex-col gap-16">
                {prestigeFinals.slice(0, 2).map((match, idx) => (
                  <div key={match._id} className="relative">
                    <MatchCard match={match} className="w-[280px]" />
                    {/* Connector to final */}
                    <div className="absolute left-full top-1/2 w-12 h-0.5 bg-purple-400 dark:bg-purple-600" />
                    {idx === 0 && prestigeFinals.length > 2 && (
                      <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-purple-400 dark:bg-purple-600" />
                    )}
                  </div>
                ))}
              </div>
              {/* Final */}
              {prestigeFinals.length > 2 && (
                <div className="flex flex-col items-center" style={{ marginTop: '80px' }}>
                  <MatchCard match={prestigeFinals[2]} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Traditional Knockout Bracket */}
      {(quarterFinals.length > 0 || semiFinals.length > 0 || final) && (
        <div className="overflow-x-auto">
          <div className="min-w-[1400px] p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Eleme Aşaması Ağacı
            </h2>
            
            {/* Bracket Tree Layout */}
            <div className="relative flex items-start justify-center gap-12 px-8">
              {/* Quarter Finals Column */}
              {quarterFinals.length > 0 && (
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-6 text-center bg-purple-100 dark:bg-purple-900 px-4 py-2 rounded-full">
                    Çeyrek Final
                  </h3>
                  <div className="space-y-8">
                    {quarterFinals.map((match, idx) => (
                      <div key={match._id} className="relative">
                        <MatchCard match={match} className="w-[280px]" />
                        {/* Connector line to semi-finals */}
                        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-slate-300 dark:bg-slate-700" />
                        {idx % 2 === 0 && idx + 1 < quarterFinals.length && (
                          <>
                            {/* Vertical line connecting pairs */}
                            <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+2rem)] bg-slate-300 dark:bg-slate-700" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Semi Finals Column */}
              {semiFinals.length > 0 && (
                <div className="flex flex-col items-center" style={{ marginTop: quarterFinals.length > 0 ? '80px' : '0' }}>
                  <h3 className="text-lg font-bold mb-6 text-center bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                    Yarı Final
                  </h3>
                  <div className="space-y-16">
                    {semiFinals.map((match, idx) => (
                      <div key={match._id} className="relative">
                        <MatchCard match={match} className="w-[280px]" />
                        {/* Connector line to final */}
                        <div className="absolute left-full top-1/2 w-12 h-0.5 bg-slate-300 dark:bg-slate-700" />
                        {idx === 0 && semiFinals.length > 1 && (
                          <>
                            {/* Vertical line connecting semi-finals */}
                            <div className="absolute left-[calc(100%+3rem)] top-1/2 w-0.5 h-[calc(100%+4rem)] bg-slate-300 dark:bg-slate-700" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Column */}
              {final && (
                <div className="flex flex-col items-center" style={{ marginTop: semiFinals.length > 0 ? '160px' : '0' }}>
                  <h3 className="text-lg font-bold mb-6 text-center bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-full">
                    🏆 Final
                  </h3>
                  <MatchCard match={final} className="w-[280px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Finals Message */}
      {goldFinals.length === 0 && silverFinals.length === 0 && bronzeFinals.length === 0 && prestigeFinals.length === 0 && quarterFinals.length === 0 && semiFinals.length === 0 && !final && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz final maçı bulunmuyor</h3>
          <p className="text-muted-foreground">Final aşamaları oluşturulduktan sonra burada görüntülenecek</p>
        </div>
      )}
    </div>
  );
} 