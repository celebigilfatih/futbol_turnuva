"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import {
  Trophy,
  Medal,
  Award,
  Star,
  ArrowLeft,
  Save,
  Trash2,
  Calendar,
  MapPin,
  Users
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/services/api"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface GroupStanding {
  team: {
    id: string
    name: string
  }
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  rank: number
}

interface CrossoverMatch {
  _id?: string
  stage: 'gold_final' | 'silver_final' | 'bronze_final' | 'prestige_final'
  label: string
  homeTeam: {
    teamId: string
    rank: number
    group: string
  }
  awayTeam: {
    teamId: string
    rank: number
    group: string
  }
  date: string
  field: number
}

const finalStageConfig = [
  {
    stage: 'gold_final' as const,
    label: 'Gold Final',
    defaultLabel: '🥇 Altın Final',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    defaultRanks: { home: 1, away: 2 }
  },
  {
    stage: 'silver_final' as const,
    label: 'Silver Final',
    defaultLabel: '🥈 Gümüş Final',
    icon: Medal,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    defaultRanks: { home: 3, away: 4 }
  },
  {
    stage: 'bronze_final' as const,
    label: 'Bronze Final',
    defaultLabel: '🥉 Bronz Final',
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    defaultRanks: { home: 5, away: 6 }
  },
  {
    stage: 'prestige_final' as const,
    label: 'Prestige Final',
    defaultLabel: '⭐ Prestij Final',
    icon: Star,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    defaultRanks: { home: 7, away: 8 }
  }
]

export default function CrossoverFinalsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const [matches, setMatches] = useState<CrossoverMatch[]>([])
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set(['gold_final', 'silver_final']))

  // Fetch group standings
  const { data: standingsResponse } = useQuery({
    queryKey: ['groupStandings', resolvedParams.id],
    queryFn: async () => {
      const response = await api.get(`/crossover-finals/${resolvedParams.id}/standings`)
      return response.data
    }
  })

  const standings: GroupStanding[] = (standingsResponse as any)?.data || []

  // Fetch existing crossover finals
  const { data: existingMatchesResponse } = useQuery({
    queryKey: ['crossoverFinals', resolvedParams.id],
    queryFn: async () => {
      const response = await api.get(`/crossover-finals/${resolvedParams.id}`)
      return response.data
    }
  })

  // Initialize matches from existing or create new
  useEffect(() => {
    const existingData = (existingMatchesResponse as any)?.data
    if (existingData && existingData.length > 0) {
      const formattedMatches = existingData.map((m: any) => ({
        _id: m._id,
        stage: m.stage,
        label: m.finalStageLabel || '',
        homeTeam: {
          teamId: m.homeTeam._id,
          rank: m.crossoverInfo?.homeTeamRank || 1,
          group: m.crossoverInfo?.homeTeamGroup || 'Grup A'
        },
        awayTeam: {
          teamId: m.awayTeam._id,
          rank: m.crossoverInfo?.awayTeamRank || 2,
          group: m.crossoverInfo?.awayTeamGroup || 'Grup B'
        },
        date: m.date,
        field: m.field
      }))
      setMatches(formattedMatches)
      setSelectedStages(new Set(formattedMatches.map((m: CrossoverMatch) => m.stage)))
    }
  }, [existingMatchesResponse])

  const createMutation = useMutation({
    mutationFn: async (data: { matches: CrossoverMatch[] }) => {
      const response = await api.post(`/crossover-finals/${resolvedParams.id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Crossover finalleri başarıyla oluşturuldu."
      })
      queryClient.invalidateQueries({ queryKey: ['crossoverFinals', resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Crossover finalleri oluşturulurken bir hata oluştu.",
        variant: "destructive"
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/crossover-finals/${resolvedParams.id}`)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Crossover finalleri silindi."
      })
      setMatches([])
      queryClient.invalidateQueries({ queryKey: ['crossoverFinals', resolvedParams.id] })
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Crossover finalleri silinirken bir hata oluştu.",
        variant: "destructive"
      })
    }
  })

  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages)
    if (newStages.has(stage)) {
      newStages.delete(stage)
      setMatches(matches.filter(m => m.stage !== stage))
    } else {
      newStages.add(stage)
      const config = finalStageConfig.find(f => f.stage === stage)
      if (config) {
        addMatch(stage as any, config)
      }
    }
    setSelectedStages(newStages)
  }

  const addMatch = (stage: CrossoverMatch['stage'], config: typeof finalStageConfig[0]) => {
    const groups = [...new Set(standings.map(s => s.group))].sort()
    const homeGroup = groups[0] || 'Grup A'
    const awayGroup = groups[1] || 'Grup B'

    const homeTeam = standings.find(s => 
      s.group === homeGroup && s.rank === config.defaultRanks.home
    )
    const awayTeam = standings.find(s => 
      s.group === awayGroup && s.rank === config.defaultRanks.away
    )

    const newMatch: CrossoverMatch = {
      stage,
      label: config.defaultLabel,
      homeTeam: {
        teamId: homeTeam?.team.id || '',
        rank: config.defaultRanks.home,
        group: homeGroup
      },
      awayTeam: {
        teamId: awayTeam?.team.id || '',
        rank: config.defaultRanks.away,
        group: awayGroup
      },
      date: new Date().toISOString(),
      field: 1
    }

    setMatches([...matches, newMatch])
  }

  const updateMatch = (index: number, updates: Partial<CrossoverMatch>) => {
    const newMatches = [...matches]
    newMatches[index] = { ...newMatches[index], ...updates }
    setMatches(newMatches)
  }

  const removeMatch = (index: number) => {
    setMatches(matches.filter((_, i) => i !== index))
  }

  const getTeamsByRankAndGroup = (rank: number, group: string) => {
    return standings.filter(s => s.rank === rank && s.group === group)
  }

  const handleSave = () => {
    if (matches.some(m => !m.homeTeam.teamId || !m.awayTeam.teamId)) {
      toast({
        title: "Hata",
        description: "Tüm maçlar için takımları seçiniz.",
        variant: "destructive"
      })
      return
    }

    createMutation.mutate({ matches })
  }

  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          Bu sayfaya erişim için admin yetkisi gereklidir.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/tournaments/${resolvedParams.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Crossover Final Ayarları</h1>
            <p className="text-muted-foreground">
              Gruplardan çapraz eşleşme ile final maçları oluşturun
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {matches.length > 0 && (
            <Button variant="outline" onClick={() => deleteMutation.mutate()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Tümünü Sil
            </Button>
          )}
          <Button onClick={handleSave} disabled={matches.length === 0 || createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {/* Stage Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Final Aşamalarını Seçin</CardTitle>
          <CardDescription>
            Oluşturmak istediğiniz final aşamalarını seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {finalStageConfig.map((config) => {
              const Icon = config.icon
              const isSelected = selectedStages.has(config.stage)
              return (
                <button
                  key={config.stage}
                  onClick={() => toggleStage(config.stage)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    isSelected
                      ? `${config.bgColor} ${config.borderColor}`
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn("h-8 w-8 mx-auto mb-2", isSelected ? config.color : 'text-muted-foreground')} />
                  <div className="text-sm font-semibold">{config.defaultLabel}</div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Match Configuration */}
      {matches.map((match, index) => {
        const config = finalStageConfig.find(f => f.stage === match.stage)
        if (!config) return null

        const Icon = config.icon
        const groups = [...new Set(standings.map(s => s.group))].sort()

        const homeTeamName = standings.find(s => s.team.id === match.homeTeam.teamId)?.team.name || 'Takım seçiniz'
        const awayTeamName = standings.find(s => s.team.id === match.awayTeam.teamId)?.team.name || 'Takım seçiniz'

        return (
          <Card key={`${match.stage}-${index}`} className={cn("border-2", config.borderColor)}>
            <CardHeader className={config.bgColor}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-6 w-6", config.color)} />
                  <div>
                    <CardTitle>{config.defaultLabel}</CardTitle>
                    <CardDescription>Çapraz Eşleşme Ayarları</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMatch(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Match Label */}
              <div className="space-y-2">
                <Label>Maç Etiketi</Label>
                <Input
                  value={match.label}
                  onChange={(e) => updateMatch(index, { label: e.target.value })}
                  placeholder={config.defaultLabel}
                />
              </div>

              {/* Team Selection Grid */}
              <div className="grid md:grid-cols-5 gap-4 items-center">
                {/* Home Team Column */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label>Ev Sahibi Takım</Label>
                  </div>
                  <Select
                    value={match.homeTeam.group}
                    onValueChange={(group) => {
                      const team = getTeamsByRankAndGroup(match.homeTeam.rank, group)[0]
                      updateMatch(index, {
                        homeTeam: {
                          ...match.homeTeam,
                          group,
                          teamId: team?.team.id || ''
                        }
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={match.homeTeam.rank.toString()}
                    onValueChange={(rank) => {
                      const team = getTeamsByRankAndGroup(parseInt(rank), match.homeTeam.group)[0]
                      updateMatch(index, {
                        homeTeam: {
                          ...match.homeTeam,
                          rank: parseInt(rank),
                          teamId: team?.team.id || ''
                        }
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                        <SelectItem key={rank} value={rank.toString()}>
                          {rank}. Sıra
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-semibold text-sm truncate">{homeTeamName}</div>
                    <div className="text-xs text-muted-foreground">{match.homeTeam.group} - {match.homeTeam.rank}. Sıra</div>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center">
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                </div>

                {/* Away Team Column */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label>Deplasman Takım</Label>
                  </div>
                  <Select
                    value={match.awayTeam.group}
                    onValueChange={(group) => {
                      const team = getTeamsByRankAndGroup(match.awayTeam.rank, group)[0]
                      updateMatch(index, {
                        awayTeam: {
                          ...match.awayTeam,
                          group,
                          teamId: team?.team.id || ''
                        }
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={match.awayTeam.rank.toString()}
                    onValueChange={(rank) => {
                      const team = getTeamsByRankAndGroup(parseInt(rank), match.awayTeam.group)[0]
                      updateMatch(index, {
                        awayTeam: {
                          ...match.awayTeam,
                          rank: parseInt(rank),
                          teamId: team?.team.id || ''
                        }
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                        <SelectItem key={rank} value={rank.toString()}>
                          {rank}. Sıra
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-semibold text-sm truncate">{awayTeamName}</div>
                    <div className="text-xs text-muted-foreground">{match.awayTeam.group} - {match.awayTeam.rank}. Sıra</div>
                  </div>
                </div>
              </div>

              {/* Match Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Maç Tarihi ve Saati
                  </Label>
                  <Input
                    type="datetime-local"
                    value={match.date.slice(0, 16)}
                    onChange={(e) => updateMatch(index, { date: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Saha Numarası
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={match.field}
                    onChange={(e) => updateMatch(index, { field: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {matches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Yukarıdan final aşamalarını seçerek başlayın
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
