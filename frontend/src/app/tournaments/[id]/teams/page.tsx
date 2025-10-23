'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { tournamentService } from '@/lib/services/tournament';
import { teamService } from '@/lib/services/team';
import type { Team } from '@/types/api';
import { Shield, GripVertical, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TournamentTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Turnuva verilerini getir
  const { data: tournament, isLoading: isTournamentLoading } = useQuery({
    queryKey: ['tournament', resolvedParams.id],
    queryFn: async () => {
      const response = await tournamentService.getById(resolvedParams.id);
      return response.data;
    },
  });

  // Tüm takımları getir
  const { data: teamsResponse, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamService.getAll();
      return response;
    },
  });

  // Takım ekleme mutation'ı
  const addTeamMutation = useMutation({
    mutationFn: async ({ teamId, groupId }: { teamId: string; groupId: string }) => {
      return tournamentService.addTeam(resolvedParams.id, teamId, groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', resolvedParams.id] });
      toast({
        title: 'Başarılı',
        description: 'Takım gruba eklendi.',
      });
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Takım eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Takım çıkarma mutation'ı
  const removeTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return tournamentService.removeTeam(resolvedParams.id, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', resolvedParams.id] });
      toast({
        title: 'Başarılı',
        description: 'Takım gruptan çıkarıldı.',
      });
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Takım çıkarılırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Eğer geçerli bir hedef yoksa işlemi iptal et
    if (!destination) return;

    // Aynı yere bırakıldıysa işlemi iptal et
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Eğer takım havuzundan bir gruba taşınıyorsa
    if (source.droppableId === 'teams-pool' && destination.droppableId.startsWith('group-')) {
      const groupId = destination.droppableId.replace('group-', '');
      addTeamMutation.mutate({ teamId: draggableId, groupId });
    }
    // Eğer gruptan takım havuzuna taşınıyorsa
    else if (source.droppableId.startsWith('group-') && destination.droppableId === 'teams-pool') {
      removeTeamMutation.mutate(draggableId);
    }
    // Gruplar arası taşıma
    else if (source.droppableId.startsWith('group-') && destination.droppableId.startsWith('group-')) {
      const newGroupId = destination.droppableId.replace('group-', '');
      removeTeamMutation.mutate(draggableId);
      addTeamMutation.mutate({ teamId: draggableId, groupId: newGroupId });
    }
  };

  if (isTournamentLoading || isTeamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  // Turnuvada olmayan takımları filtrele
  const availableTeams = teamsResponse?.data.filter((team: Team) => {
    return !tournament?.groups.some(group => 
      group.teams.some(groupTeam => groupTeam._id === team._id)
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Takım Yönetimi</h1>
        <p className="text-muted-foreground">
          Takımları sürükleyerek gruplara ekleyebilir veya gruplardan çıkarabilirsiniz
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Takım Havuzu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Takım Havuzu</span>
              <Badge variant="outline" className="ml-2">
                {availableTeams.length} Takım
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="teams-pool" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {availableTeams.map((team: Team, index: number) => (
                    <Draggable key={team._id} draggableId={team._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-muted/50 rounded-lg p-4 flex items-center justify-between hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="font-medium">{team.name}</div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>

        <Separator />

        {/* Gruplar */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {tournament?.groups.map((group) => (
            <Card key={group._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{group.name}</span>
                  <Badge variant="outline">
                    {group.teams.length} / {tournament.teamsPerGroup}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={`group-${group._id}`}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[100px]"
                    >
                      {group.teams.map((team: Team, index: number) => (
                        <Draggable key={team._id} draggableId={team._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-muted/50 rounded-lg p-3 flex items-center justify-between hover:bg-muted/70 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="font-medium">{team.name}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTeamMutation.mutate(team._id);
                                }}
                              >
                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 