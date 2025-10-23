'use client';

import { useQuery } from '@tanstack/react-query';
import { matchService } from '@/lib/services/match';
import { tournamentService } from '@/lib/services/tournament';
import { Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

type MatchStage = 'group' | 'quarter_final' | 'semi_final' | 'final';

interface ExtendedMatch extends Omit<Match, 'stage'> {
  stage: MatchStage;
}

export default function BracketPage() {
  const { data: activeTournament } = useQuery({
    queryKey: ['tournaments', 'active'],
    queryFn: async () => {
      const response = await tournamentService.getAll();
      return response?.data?.find(t => t.status === 'knockout_stage' || t.status === 'group_stage') || null;
    },
  });

  const { data: matches } = useQuery({
    queryKey: ['matches', activeTournament?._id],
    queryFn: async () => {
      if (!activeTournament?._id) return [];
      const response = await matchService.getByTournament(activeTournament._id);
      return response.data as ExtendedMatch[];
    },
    enabled: !!activeTournament?._id,
  });

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Henüz maç bulunmuyor</h3>
        <p className="text-muted-foreground">Turnuva başladığında maçlar burada görüntülenecek</p>
      </div>
    );
  }

  const quarterFinals = matches.filter(match => match.stage === 'quarter_final');
  const semiFinals = matches.filter(match => match.stage === 'semi_final');
  const final = matches.find(match => match.stage === 'final');
  const groupMatches = matches.filter(match => match.stage === 'group');

  const groupedMatches = groupMatches.reduce((acc, match) => {
    const group = match.group || 'Diğer';
    if (!acc[group]) acc[group] = [];
    acc[group].push(match);
    return acc;
  }, {} as Record<string, ExtendedMatch[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{activeTournament?.name}</h1>
          <p className="text-muted-foreground">Turnuva Ağacı</p>
        </div>
      </div>

      <div className="relative min-w-[1200px] min-h-[800px] p-8">
        {/* Gruplar */}
        <div className="grid grid-cols-6 gap-4 mb-12">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((group) => (
            <div key={group} className="space-y-2">
              <h3 className="font-semibold text-center mb-4">Grup {group}</h3>
              <div className="space-y-2">
                {groupedMatches[group]?.map((match) => (
                  <Card key={match._id} className="p-2">
                    <CardContent className="p-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>{match.homeTeam.name}</span>
                        <span className="font-semibold">
                          {match.score ? `${match.score.homeTeam} - ${match.score.awayTeam}` : 'vs'}
                        </span>
                        <span>{match.awayTeam.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SVG Bağlantıları */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
          {/* Çeyrek Final Bağlantıları */}
          <path d="M200,300 C300,300 300,200 400,200" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />
          <path d="M200,400 C300,400 300,500 400,500" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />
          <path d="M800,300 C700,300 700,200 600,200" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />
          <path d="M800,400 C700,400 700,500 600,500" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />

          {/* Yarı Final Bağlantıları */}
          <path d="M400,250 C450,250 450,350 500,350" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />
          <path d="M600,250 C550,250 550,350 500,350" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />

          {/* Final Bağlantısı */}
          <path d="M500,400 L500,450" className="stroke-muted-foreground/20" fill="none" strokeWidth="2" />

          {/* Grup İsimleri */}
          <text x="150" y="280" className="text-sm font-medium">A1-B2</text>
          <text x="150" y="380" className="text-sm font-medium">C1-D2</text>
          <text x="850" y="280" className="text-sm font-medium">E1-F2</text>
          <text x="850" y="380" className="text-sm font-medium">F1-E2</text>
        </svg>

        {/* Çeyrek Final Maçları */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-8">
            {quarterFinals.slice(0, 2).map((match) => (
              <Card key={match._id} className="p-4">
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{match.homeTeam.name}</span>
                      <Badge variant="secondary">Çeyrek Final</Badge>
                      <span>{match.awayTeam.name}</span>
                    </div>
                    <div className="text-center font-bold">
                      {match.score ? `${match.score.homeTeam} - ${match.score.awayTeam}` : 'vs'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Yarı Final Maçları */}
          <div className="space-y-8 mt-16">
            {semiFinals.map((match) => (
              <Card key={match._id} className="p-4">
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{match.homeTeam.name}</span>
                      <Badge variant="secondary">Yarı Final</Badge>
                      <span>{match.awayTeam.name}</span>
                    </div>
                    <div className="text-center font-bold">
                      {match.score ? `${match.score.homeTeam} - ${match.score.awayTeam}` : 'vs'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Final Maçı */}
            {final && (
              <Card className="p-4 mt-16 border-primary">
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{final.homeTeam.name}</span>
                      <Badge variant="secondary">Final</Badge>
                      <span>{final.awayTeam.name}</span>
                    </div>
                    <div className="text-center font-bold">
                      {final.score ? `${final.score.homeTeam} - ${final.score.awayTeam}` : 'vs'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Diğer Çeyrek Final Maçları */}
          <div className="space-y-8">
            {quarterFinals.slice(2).map((match) => (
              <Card key={match._id} className="p-4">
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{match.homeTeam.name}</span>
                      <Badge variant="secondary">Çeyrek Final</Badge>
                      <span>{match.awayTeam.name}</span>
                    </div>
                    <div className="text-center font-bold">
                      {match.score ? `${match.score.homeTeam} - ${match.score.awayTeam}` : 'vs'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 