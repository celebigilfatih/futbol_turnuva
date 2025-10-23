import { useQuery } from '@tanstack/react-query';
import { playerService } from '@/lib/services/player';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      <Card>
        <CardHeader>
          <CardTitle>Gol Krallığı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gol Krallığı</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Sıra</TableHead>
              <TableHead>Oyuncu</TableHead>
              <TableHead className="text-right">Gol</TableHead>
              <TableHead className="text-right">Maç</TableHead>
              <TableHead className="text-right">Maç Başı</TableHead>
              <TableHead className="text-right">Dk/Gol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topScorers?.map((player, index) => (
              <TableRow key={player._id || index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{player.team.name}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">{player.goals}</TableCell>
                <TableCell className="text-right">{player.matches}</TableCell>
                <TableCell className="text-right">{player.goalsPerMatch}</TableCell>
                <TableCell className="text-right">{player.minutesPerGoal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}