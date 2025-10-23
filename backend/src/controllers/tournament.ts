import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Tournament from '../models/Tournament';
import Team from '../models/Team';
import Match, { IMatch } from '../models/Match';
import { ITeam } from '../models/Team';
import { ITournament } from '../models/Tournament';

// Maç aşamaları için tip tanımı
type MatchStage = 'group' | 'quarter_final' | 'semi_final' | 'final';
type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface FixtureMatch {
  tournament: mongoose.Types.ObjectId;
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  date: Date;
  field: number;
  stage: MatchStage;
  group?: string;
  status: MatchStatus;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

interface PartialFixtureMatch {
  tournament: mongoose.Types.ObjectId;
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  date?: Date;
  field?: number;
  stage: MatchStage;
  group?: string;
  status: MatchStatus;
  extraTimeEnabled: boolean;
  penaltyShootoutEnabled: boolean;
}

// Tüm turnuvaları getir
export const getAllTournaments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const tournaments = await Tournament.find()
      .populate('groups.teams')
      .skip(skip)
      .limit(limit)
      .sort({ startDate: -1 });

    const total = await Tournament.countDocuments();

    res.json({
      data: tournaments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Turnuvalar getirilirken bir hata oluştu.' });
  }
};

// Tek turnuva getir
export const getTournamentById = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate({
        path: 'groups.teams',
        model: 'Team',
        select: 'name players'
      });
      
    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }
    res.json({ data: tournament });
  } catch (error) {
    res.status(500).json({ message: 'Turnuva getirilirken bir hata oluştu.' });
  }
};

// Yeni turnuva oluştur
export const createTournament = async (req: Request, res: Response) => {
  try {
    console.log('Received tournament data:', req.body); // Debug için eklendi
    const { teamsPerGroup, numberOfGroups, ...tournamentData } = req.body;
    
    // Veri doğrulama
    if (!teamsPerGroup || !numberOfGroups) {
      return res.status(400).json({ 
        message: 'Grup başına takım sayısı ve grup sayısı zorunludur.',
        receivedData: { teamsPerGroup, numberOfGroups }
      });
    }
    
    // Grupları oluştur (A, B, C, ...)
    const groups = Array.from({ length: numberOfGroups }, (_, index) => ({
      _id: new mongoose.Types.ObjectId(), // Her grup için benzersiz ID oluştur
      name: `Grup ${String.fromCharCode(65 + index)}`, // A'dan başlayarak grup isimleri (A, B, C, ...)
      teams: []
    }));

    // Turnuvayı oluştur
    const tournament = new Tournament({
      ...tournamentData,
      teamsPerGroup,
      numberOfGroups,
      groups,
      status: 'pending'
    });

    await tournament.save();
    res.status(201).json({ data: tournament });
  } catch (error) {
    console.error('Turnuva oluşturma hatası:', error);
    res.status(400).json({ 
      message: 'Turnuva oluşturulurken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Turnuva güncelle
export const updateTournament = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('groups.teams');

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }
    res.json({ data: tournament });
  } catch (error) {
    res.status(400).json({ message: 'Turnuva güncellenirken bir hata oluştu.' });
  }
};

// Turnuva sil
export const deleteTournament = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Turnuvaya ait maçları sil
    const deletedMatches = await Match.deleteMany({ tournament: tournament._id });

    // Turnuvayı sil
    await Tournament.findByIdAndDelete(tournament._id);

    res.json({ 
      message: 'Turnuva ve ilgili maçlar başarıyla silindi.',
      deletedData: {
        tournament: 1,
        matches: deletedMatches.deletedCount
      }
    });
  } catch (error) {
    console.error('Turnuva silme hatası:', error);
    res.status(500).json({ message: 'Turnuva silinirken bir hata oluştu.' });
  }
};

// Turnuva durumunu güncelle
export const updateTournamentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).populate('groups.teams');

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }
    res.json({ data: tournament });
  } catch (error) {
    res.status(400).json({ message: 'Turnuva durumu güncellenirken bir hata oluştu.' });
  }
};

// Turnuvaya takım ekle
export const addTeam = async (req: Request, res: Response) => {
  try {
    const { teamId, groupId } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Takım bulunamadı.' });
    }

    // Takımın zaten bir grupta olup olmadığını kontrol et
    const isTeamAlreadyInTournament = tournament.groups.some(group => 
      group.teams.includes(teamId)
    );

    if (isTeamAlreadyInTournament) {
      return res.status(400).json({ message: 'Takım zaten turnuvada bulunuyor.' });
    }

    // Seçilen grubu bul
    const targetGroup = tournament.groups.find(group => group._id.toString() === groupId);
    if (!targetGroup) {
      return res.status(404).json({ message: 'Grup bulunamadı.' });
    }

    // Grubun dolu olup olmadığını kontrol et
    if (targetGroup.teams.length >= tournament.teamsPerGroup) {
      return res.status(400).json({ message: 'Seçilen grup dolu.' });
    }

    // Takımı gruba ekle
    targetGroup.teams.push(teamId);
    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id).populate('groups.teams');
    res.json({ data: updatedTournament });
  } catch (error) {
    res.status(400).json({ message: 'Takım eklenirken bir hata oluştu.' });
  }
};

// Turnuvadan takım çıkar
export const removeTeam = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    tournament.groups.forEach(group => {
      group.teams = group.teams.filter(teamId => teamId.toString() !== req.params.teamId);
    });

    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id).populate('groups.teams');
    res.json({ data: updatedTournament });
  } catch (error) {
    res.status(400).json({ message: 'Takım çıkarılırken bir hata oluştu.' });
  }
};

// Turnuva gruplarını getir
export const getGroups = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('groups.teams')
      .select('groups');

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    res.json({ data: tournament.groups });
  } catch (error) {
    res.status(500).json({ message: 'Gruplar getirilirken bir hata oluştu.' });
  }
};

// Replacing generateFixture function with new implementation
export const generateFixture = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('groups.teams');
    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Generate all group stage matches from each group
    const allMatches: FixtureMatch[] = [];
    for (const group of tournament.groups) {
      const teams = group.teams;
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const homeTeam = (typeof teams[i] === 'string') ? new mongoose.Types.ObjectId(teams[i]) : ((teams[i] as any)._id);
          const awayTeam = (typeof teams[j] === 'string') ? new mongoose.Types.ObjectId(teams[j]) : ((teams[j] as any)._id);
          allMatches.push({
            tournament: tournament._id,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            stage: 'group',
            group: group.name,
            status: 'scheduled',
            extraTimeEnabled: tournament.extraTimeEnabled,
            penaltyShootoutEnabled: tournament.penaltyShootoutEnabled,
            field: 0, // To be assigned
            date: new Date(0) // Placeholder
          });
        }
      }
    }

    // Calculate the interval for each match slot (match duration + break duration)
    const slotInterval = (tournament.matchDuration || 90) + (tournament.breakDuration || 15);
    const numFields = tournament.numberOfFields;

    // Helper: Parse a time string ("HH:MM") into a Date for a given day
    const parseTime = (day: Date, timeStr: string): Date => {
      const [hour, minute] = timeStr.split(':').map(Number);
      // Create date in Turkey timezone (UTC+3) 
      // For Turkey time 11:00, we need to store it as 08:00 UTC
      // So we subtract 3 hours from the intended Turkey time
      const d = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour - 3, minute, 0, 0));
      return d;
    };

    // Generate global time slots based on tournament settings
    const slots: { time: Date, index: number }[] = [];
    let slotIndex = 0;
    let currentDay = new Date(tournament.startDate);
    // Ensure we generate enough slot fields to schedule all matches
    while (slots.length * numFields < allMatches.length) {
      const morningStart = parseTime(currentDay, tournament.startTime);
      const lunchStart = parseTime(currentDay, tournament.lunchBreakStart);
      // Create afternoon start time accounting for timezone
      const lunchStartUTC = new Date(Date.UTC(lunchStart.getUTCFullYear(), lunchStart.getUTCMonth(), lunchStart.getUTCDate(), 
                                             lunchStart.getUTCHours(), lunchStart.getUTCMinutes(), lunchStart.getUTCSeconds(), lunchStart.getUTCMilliseconds()));
      const afternoonStart = new Date(lunchStartUTC.getTime() + tournament.lunchBreakDuration * 60000);
      const dayEnd = parseTime(currentDay, tournament.endTime);

      // Generate morning slots
      let t = new Date(morningStart);
      while (t < lunchStart) {
        // Store slot times in UTC but representing correct Turkey time
        const slotTime = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 
                                          t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds(), t.getUTCMilliseconds()));
        slots.push({ time: slotTime, index: slotIndex });
        slotIndex++;
        t.setMinutes(t.getMinutes() + slotInterval);
      }
      // Generate afternoon slots
      t = new Date(afternoonStart);
      while (t < dayEnd) {
        // Store slot times in UTC but representing correct Turkey time
        const slotTime = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 
                                          t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds(), t.getUTCMilliseconds()));
        slots.push({ time: slotTime, index: slotIndex });
        slotIndex++;
        t.setMinutes(t.getMinutes() + slotInterval);
      }
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Schedule matches into slots ensuring teams do not play in consecutive slots
    const scheduledMatches: FixtureMatch[] = [];
    const teamLastSlot = new Map<string, number>();
    let unscheduled = [...allMatches];

    for (const slot of slots) {
      let fieldsUsed = 0;
      for (let i = 0; i < unscheduled.length && fieldsUsed < numFields; i++) {
        const match = unscheduled[i] as FixtureMatch;
        const homeId = match.homeTeam.toString();
        const awayId = match.awayTeam.toString();
        const homeLast = teamLastSlot.get(homeId);
        const awayLast = teamLastSlot.get(awayId);
        // Ensure at least one slot gap between matches for both teams
        if ((homeLast === undefined || homeLast <= slot.index - 2) &&
            (awayLast === undefined || awayLast <= slot.index - 2)) {
          // Use timezone-adjusted time
          match.date = new Date(Date.UTC(slot.time.getUTCFullYear(), slot.time.getUTCMonth(), slot.time.getUTCDate(), 
                                        slot.time.getUTCHours(), slot.time.getUTCMinutes(), slot.time.getUTCSeconds(), slot.time.getUTCMilliseconds()));
          match.field = fieldsUsed + 1; // Assign field number (1-indexed) in this slot
          scheduledMatches.push(match);
          teamLastSlot.set(homeId, slot.index);
          teamLastSlot.set(awayId, slot.index);
          unscheduled.splice(i, 1);
          i--; // Adjust index after removal
          fieldsUsed++;
        }
      }
      if (unscheduled.length === 0) break;
    }

    // Fallback: if any matches remain unscheduled, assign them to available slots ignoring rest constraint
    if (unscheduled.length > 0) {
      console.warn('Some matches could not be scheduled with rest constraints; scheduling them without the gap.');
      for (const slot of slots) {
        let fieldsUsed = scheduledMatches.filter(m => (m.date as Date).getTime() === slot.time.getTime()).length;
        while (fieldsUsed < numFields && unscheduled.length > 0) {
          const match = unscheduled.shift() as FixtureMatch;
          // Use timezone-adjusted time
          match.date = new Date(Date.UTC(slot.time.getUTCFullYear(), slot.time.getUTCMonth(), slot.time.getUTCDate(), 
                                        slot.time.getUTCHours(), slot.time.getUTCMinutes(), slot.time.getUTCSeconds(), slot.time.getUTCMilliseconds()));
          match.field = fieldsUsed + 1;
          scheduledMatches.push(match);
          fieldsUsed++;
        }
        if (unscheduled.length === 0) break;
      }
    }

    // Remove existing matches for the tournament and insert the new schedule
    await Match.deleteMany({ tournament: tournament._id });
    await Match.insertMany(scheduledMatches);

    // Update tournament status
    tournament.status = 'group_stage';
    await tournament.save();

    // Prepare schedule summary for response
    const uniqueTimesSet = new Set<string>();
    scheduledMatches.forEach(m => {
      const h = String((m as FixtureMatch).date.getHours()).padStart(2, '0');
      const min = String((m as FixtureMatch).date.getMinutes()).padStart(2, '0');
      uniqueTimesSet.add(`${h}:${min}`);
    });
    const uniqueTimes = Array.from(uniqueTimesSet).sort();

    res.json({ 
      message: 'Fikstür başarıyla oluşturuldu.',
      data: {
        totalMatches: scheduledMatches.length,
        scheduledDays: Math.ceil(scheduledMatches.length / (numFields * uniqueTimes.length)),
        matchesPerDay: numFields * uniqueTimes.length,
        dailySchedule: {
          startTime: tournament.startTime,
          endTime: tournament.endTime,
          lunchBreak: {
            start: tournament.lunchBreakStart,
            duration: tournament.lunchBreakDuration
          },
          matchDuration: tournament.matchDuration || 90,
        breakDuration: tournament.breakDuration || 15,
          matchTimes: uniqueTimes
        }
      }
    });
  } catch (error) {
    console.error('Fikstür oluşturma hatası:', error);
    res.status(500).json({ message: 'Fikstür oluşturulurken bir hata oluştu.' });
  }
};

// Takımlar için müsait zamanı bulan yardımcı fonksiyon
function findNextAvailableTime(
  startTime: Date,
  teamSchedule: { [key: string]: Date[] },
  homeTeamId: string,
  awayTeamId: string,
  matchDuration: number,
  breakDuration: number,
  lunchBreakStart: Date,
  lunchBreakEnd: Date,
  existingMatches: FixtureMatch[],
  numberOfFields: number,
  tournamentStartTime: string = '09:00',
  tournamentEndTime: string = '18:00'
): Date {
  let currentTime = new Date(startTime);
  
  // Turnuva başlangıç saatini ayarla
  const [startHour, startMinute] = tournamentStartTime.split(':').map(Number);
  const [endHour, endMinute] = tournamentEndTime.split(':').map(Number);

  // Eğer saat 09:00'dan önceyse, 09:00'a ayarla
  if (currentTime.getHours() < startHour || 
      (currentTime.getHours() === startHour && currentTime.getMinutes() < startMinute)) {
    currentTime.setHours(startHour, startMinute, 0, 0);
  }

  const totalDuration = matchDuration + breakDuration; // Toplam süre (maç + dinlenme)

  while (true) {
    // Saat 18:00'i geçtiyse ertesi gün 09:00'a ayarla
    if (currentTime.getHours() > endHour || 
        (currentTime.getHours() === endHour && currentTime.getMinutes() > endMinute)) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(startHour, startMinute, 0, 0);
      continue;
    }

    // Öğle arası kontrolü
    const lunchStart = new Date(lunchBreakStart);
    const lunchEnd = new Date(lunchBreakEnd);
    lunchStart.setFullYear(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
    lunchEnd.setFullYear(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());

    const matchEndTime = new Date(currentTime.getTime() + matchDuration * 60000);

    if ((currentTime >= lunchStart && currentTime < lunchEnd) || 
        (matchEndTime > lunchStart && matchEndTime <= lunchEnd)) {
      currentTime = new Date(lunchEnd);
      continue;
    }

    // Takımların son maç zamanlarını kontrol et
    const homeTeamLastMatch = teamSchedule[homeTeamId]?.length > 0 
      ? teamSchedule[homeTeamId][teamSchedule[homeTeamId].length - 1] 
      : null;
    const awayTeamLastMatch = teamSchedule[awayTeamId]?.length > 0 
      ? teamSchedule[awayTeamId][teamSchedule[awayTeamId].length - 1] 
      : null;

    // Her iki takım için de bir maç dinlenme süresini kontrol et
    let shouldRest = false;

    if (homeTeamLastMatch) {
      const lastMatchEndTime = new Date(homeTeamLastMatch.getTime() + totalDuration * 60000);
      const nextMatchStartTime = new Date(lastMatchEndTime.getTime() + totalDuration * 60000);
      if (currentTime < nextMatchStartTime) {
        shouldRest = true;
        currentTime = nextMatchStartTime;
      }
    }

    if (awayTeamLastMatch) {
      const lastMatchEndTime = new Date(awayTeamLastMatch.getTime() + totalDuration * 60000);
      const nextMatchStartTime = new Date(lastMatchEndTime.getTime() + totalDuration * 60000);
      if (currentTime < nextMatchStartTime) {
        shouldRest = true;
        currentTime = nextMatchStartTime;
      }
    }

    if (shouldRest) {
      continue;
    }

    // Saha uygunluğunu kontrol et
    const availableField = findAvailableField(
      existingMatches,
      currentTime,
      numberOfFields,
      matchDuration,
      breakDuration
    );

    if (availableField !== -1) {
      return currentTime;
    }

    // Eğer uygun saha bulunamazsa, sonraki zaman dilimine geç
    currentTime = new Date(currentTime.getTime() + totalDuration * 60000);
  }
}

function checkRestTime(
  time: Date,
  teamSchedule: { [key: string]: Date[] },
  homeTeamId: string,
  awayTeamId: string,
  minRestTime: number,
  totalDuration: number // matchDuration + breakDuration
): boolean {
  const homeTeamMatches = teamSchedule[homeTeamId] || [];
  const awayTeamMatches = teamSchedule[awayTeamId] || [];

  for (const lastMatchTime of [...homeTeamMatches, ...awayTeamMatches]) {
    const matchEndTime = new Date(lastMatchTime.getTime() + totalDuration * 60000);
    const restTime = (time.getTime() - matchEndTime.getTime()) / (60 * 1000);
    if (restTime < minRestTime) {
      return false;
    }
    const isSameDay = time.toDateString() === lastMatchTime.toDateString();
    if (isSameDay) {
      const hoursDiff = (time.getTime() - lastMatchTime.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 4) {
        return false;
      }
    }
  }
  return true;
}

function checkDailyMatchLimit(
  time: Date,
  teamSchedule: { [key: string]: Date[] },
  homeTeamId: string,
  awayTeamId: string,
  maxMatchesPerDay: number
): boolean {
  const homeTeamMatches = teamSchedule[homeTeamId] || [];
  const awayTeamMatches = teamSchedule[awayTeamId] || [];

  const dayStart = new Date(time);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(time);
  dayEnd.setHours(23, 59, 59, 999);

  const homeTeamDailyMatches = homeTeamMatches.filter(matchTime => matchTime >= dayStart && matchTime <= dayEnd).length;
  const awayTeamDailyMatches = awayTeamMatches.filter(matchTime => matchTime >= dayStart && matchTime <= dayEnd).length;

  return homeTeamDailyMatches < maxMatchesPerDay && awayTeamDailyMatches < maxMatchesPerDay;
}

// Takımların müsaitlik kontrolü
function checkTeamAvailability(
  matchTime: Date,
  teamSchedule: { [key: string]: Date[] },
  homeTeamId: string,
  awayTeamId: string,
  totalDuration: number // matchDuration + breakDuration
): boolean {
  // Maç bitiş zamanını hesapla (maç süresi + mola süresi)
  const matchEndTime = new Date(matchTime.getTime() + totalDuration * 60000);

  // Her iki takımın da programını kontrol et
  for (const teamId of [homeTeamId, awayTeamId]) {
    const teamMatches = teamSchedule[teamId] || [];
    
    for (const existingMatchTime of teamMatches) {
      // Mevcut maçın bitiş zamanını hesapla (maç süresi + mola süresi)
      const existingMatchEndTime = new Date(existingMatchTime.getTime() + totalDuration * 60000);

      // Zaman çakışması kontrolü
      if (
        (matchTime >= existingMatchTime && matchTime < existingMatchEndTime) ||
        (matchEndTime > existingMatchTime && matchEndTime <= existingMatchEndTime) ||
        (matchTime <= existingMatchTime && matchEndTime >= existingMatchEndTime)
      ) {
        return false;
      }
    }
  }

  return true;
}

function findAvailableField(
  existingMatches: FixtureMatch[],
  matchTime: Date,
  numberOfFields: number,
  matchDuration: number,
  breakDuration: number
): number {
  // Maç bitiş zamanını hesapla (maç süresi + mola süresi)
  const matchEndTime = new Date(matchTime.getTime() + (matchDuration + breakDuration) * 60000);

  // Her saha için kontrol et
  for (let field = 1; field <= numberOfFields; field++) {
    let isFieldAvailable = true;

    // Bu sahada olan maçları kontrol et
    for (const match of existingMatches.filter(m => m.field === field)) {
      if (!match.date) continue; // date undefined ise bu maçı atla
      const existingMatchStart = new Date(match.date);
      // Mevcut maçın bitiş zamanını hesapla (maç süresi + mola süresi)
      const existingMatchEnd = new Date(existingMatchStart.getTime() + (matchDuration + breakDuration) * 60000);

      // Zaman çakışması kontrolü
      if (
        (matchTime >= existingMatchStart && matchTime < existingMatchEnd) ||
        (matchEndTime > existingMatchStart && matchEndTime <= existingMatchEnd) ||
        (matchTime <= existingMatchStart && matchEndTime >= existingMatchEnd)
      ) {
        isFieldAvailable = false;
        break;
      }
    }

    if (isFieldAvailable) {
      return field;
    }
  }

  return -1;
}

export const generateKnockoutMatches = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('groups.teams');

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Grup maçlarının tamamlandığını kontrol et
    const groupMatches = await Match.find({
      tournament: tournament._id,
      stage: 'group'
    });

    const pendingGroupMatches = groupMatches.filter(match => 
      match.status !== 'completed' && match.status !== 'cancelled'
    );

    if (pendingGroupMatches.length > 0) {
      return res.status(400).json({ 
        message: 'Tüm grup maçları tamamlanmadan eleme maçları oluşturulamaz.' 
      });
    }

    // Her grup için puan durumunu hesapla ve ilk iki takımı al
    const qualifiedTeams = [];
    for (const group of tournament.groups) {
      const groupStandings = await calculateGroupStandings(tournament._id, group.name);
      qualifiedTeams.push(
        groupStandings[0]?.team, // Birinci
        groupStandings[1]?.team  // İkinci
      );
    }

    // Çeyrek final eşleşmelerini oluştur (çapraz eşleşme)
    const quarterFinalMatches = [];
    // A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
    for (let i = 0; i < qualifiedTeams.length; i += 4) {
      quarterFinalMatches.push(
        {
          tournament: tournament._id,
          homeTeam: qualifiedTeams[i],      // A1
          awayTeam: qualifiedTeams[i + 3],  // B2
          stage: 'quarter_final',
          status: 'scheduled',
          extraTimeEnabled: tournament.extraTimeEnabled,
          penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
        },
        {
          tournament: tournament._id,
          homeTeam: qualifiedTeams[i + 2],  // B1
          awayTeam: qualifiedTeams[i + 1],  // A2
          stage: 'quarter_final',
          status: 'scheduled',
          extraTimeEnabled: tournament.extraTimeEnabled,
          penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
        }
      );
    }

    // Maç zamanlarını ve sahalarını planla
    let currentDate = new Date(tournament.startDate);
    let currentTime = new Date(currentDate);
    const [startHour, startMinute] = tournament.startTime.split(':').map(Number);
    // Use local time instead of UTC
    currentTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), startHour, startMinute, 0, 0);

    // Son grup maçının tarihini bul ve ondan sonraki güne planla
    const lastGroupMatch = await Match.findOne({ 
      tournament: tournament._id,
      stage: 'group'
    }).sort({ date: -1 });

    if (lastGroupMatch) {
      currentDate = new Date(lastGroupMatch.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const [startHour, startMinute] = tournament.startTime.split(':').map(Number);
      // Create date in Turkey timezone (UTC+3) 
      // For Turkey time 11:00, we need to store it as 08:00 UTC
      // So we subtract 3 hours from the intended Turkey time
      currentTime = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour - 3, startMinute, 0, 0));
    }

    // Çeyrek final maçlarını planla
    for (let i = 0; i < quarterFinalMatches.length; i++) {
      // Use timezone-adjusted time
      (quarterFinalMatches[i] as any).date = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                                                   currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds()));
      (quarterFinalMatches[i] as any).field = (i % tournament.numberOfFields) + 1;

      // Sonraki maç için zamanı güncelle
      if ((i + 1) % tournament.numberOfFields === 0) {
        const newMinutes = currentTime.getMinutes() + (tournament.matchDuration || 90) + (tournament.breakDuration || 15);
        // Use timezone-adjusted time
        currentTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                              currentTime.getHours(), newMinutes, currentTime.getSeconds(), currentTime.getMilliseconds());
      }
    }

    // Maçları veritabanına kaydet
    await Match.insertMany(quarterFinalMatches);

    // Turnuva durumunu güncelle
    tournament.status = 'quarter_final';
    await tournament.save();

    res.json({
      message: 'Çeyrek final maçları başarıyla oluşturuldu',
      data: {
        matches: quarterFinalMatches,
        nextStage: 'quarter_final'
      }
    });
  } catch (error) {
    console.error('Eleme maçları oluşturma hatası:', error);
    res.status(500).json({ message: 'Eleme maçları oluşturulurken bir hata oluştu.' });
  }
};

interface GroupStanding {
  team: mongoose.Types.ObjectId;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

// Grup sıralamasını hesapla
const calculateGroupStandings = async (tournamentId: mongoose.Types.ObjectId, groupName: string): Promise<GroupStanding[]> => {
  // Gruptaki tüm maçları getir
  const matches = await Match.find({
    tournament: tournamentId,
    group: groupName,
    stage: 'group',
    status: 'completed'
  });

  // Takım istatistiklerini hesapla
  const standings = new Map<string, GroupStanding>();

  for (const match of matches) {
    if (!match.score || !match.homeTeam || !match.awayTeam) continue;

    // Ev sahibi takım
    if (!standings.has(match.homeTeam.toString())) {
      standings.set(match.homeTeam.toString(), {
        team: match.homeTeam as mongoose.Types.ObjectId,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      });
    }

    // Deplasman takımı
    if (!standings.has(match.awayTeam.toString())) {
      standings.set(match.awayTeam.toString(), {
        team: match.awayTeam as mongoose.Types.ObjectId,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      });
    }

    const homeTeamStats = standings.get(match.homeTeam.toString())!;
    const awayTeamStats = standings.get(match.awayTeam.toString())!;

    // Gol istatistiklerini güncelle
    homeTeamStats.goalsFor += match.score.homeTeam;
    homeTeamStats.goalsAgainst += match.score.awayTeam;
    awayTeamStats.goalsFor += match.score.awayTeam;
    awayTeamStats.goalsAgainst += match.score.homeTeam;

    // Gol averajını güncelle
    homeTeamStats.goalDifference = homeTeamStats.goalsFor - homeTeamStats.goalsAgainst;
    awayTeamStats.goalDifference = awayTeamStats.goalsFor - awayTeamStats.goalsAgainst;

    // Puanları güncelle
    if (match.score.homeTeam > match.score.awayTeam) {
      homeTeamStats.points += 3; // Galibiyet
    } else if (match.score.homeTeam < match.score.awayTeam) {
      awayTeamStats.points += 3; // Galibiyet
    } else {
      homeTeamStats.points += 1; // Beraberlik
      awayTeamStats.points += 1; // Beraberlik
    }
  }

  // Sıralama kriterleri:
  // 1. Puan
  // 2. Averaj
  // 3. Atılan gol
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
};

// Yarı final ve final maçlarını oluştur
export const generateSemiFinalAndFinal = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Çeyrek final maçlarının tamamlandığını kontrol et
    const quarterFinalMatches = await Match.find({
      tournament: tournament._id,
      stage: 'quarter_final'
    });

    const pendingQuarterFinals = quarterFinalMatches.filter(match => 
      match.status !== 'completed' && match.status !== 'cancelled'
    );

    if (pendingQuarterFinals.length > 0) {
      return res.status(400).json({ 
        message: 'Tüm çeyrek final maçları tamamlanmadan yarı final maçları oluşturulamaz.' 
      });
    }

    // Çeyrek final kazananlarını bul
    const semiFinalTeams: mongoose.Types.ObjectId[] = [];
    for (const match of quarterFinalMatches) {
      if (!match.score || !match.homeTeam || !match.awayTeam) continue;
      const winner = match.score.homeTeam > match.score.awayTeam ? 
        match.homeTeam as mongoose.Types.ObjectId : 
        match.awayTeam as mongoose.Types.ObjectId;
      semiFinalTeams.push(winner);
    }

    // Yarı final eşleşmelerini oluştur
    const semiFinalMatches: PartialFixtureMatch[] = [
      {
        tournament: tournament._id,
        homeTeam: semiFinalTeams[0],
        awayTeam: semiFinalTeams[1],
        stage: 'semi_final',
        status: 'scheduled',
        extraTimeEnabled: tournament.extraTimeEnabled,
        penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
      },
      {
        tournament: tournament._id,
        homeTeam: semiFinalTeams[2],
        awayTeam: semiFinalTeams[3],
        stage: 'semi_final',
        status: 'scheduled',
        extraTimeEnabled: tournament.extraTimeEnabled,
        penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
      }
    ];

    // Son çeyrek final maçının tarihini bul
    const lastQuarterFinal = await Match.findOne({
      tournament: tournament._id,
      stage: 'quarter_final'
    }).sort({ date: -1 });

    if (!lastQuarterFinal?.date) {
      return res.status(400).json({ message: 'Çeyrek final maçlarının tarihi bulunamadı.' });
    }

    // Yarı final maçlarını planla
    let currentDate = new Date(lastQuarterFinal.date);
    currentDate.setDate(currentDate.getDate() + 1);
    const [startHour, startMinute] = tournament.startTime.split(':').map(Number);
    // Create date in Turkey timezone (UTC+3) 
    // For Turkey time 11:00, we need to store it as 08:00 UTC
    // So we subtract 3 hours from the intended Turkey time
    let currentTime = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour - 3, startMinute, 0, 0));

    // Yarı final maçlarını zamanla
    for (let i = 0; i < semiFinalMatches.length; i++) {
      // Use timezone-adjusted time
      semiFinalMatches[i].date = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                                         currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds()));
      semiFinalMatches[i].field = 1; // Ana sahada oynansın

      // Sonraki maç için zamanı güncelle
      const newMinutes = currentTime.getMinutes() + tournament.matchDuration + tournament.breakDuration;
      // Use timezone-adjusted time
      currentTime = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                            currentTime.getHours(), newMinutes, currentTime.getSeconds(), currentTime.getMilliseconds()));
    }

    // Yarı final maçlarını kaydet
    await Match.insertMany(semiFinalMatches);

    // Turnuva durumunu güncelle
    tournament.status = 'knockout_stage';
    await tournament.save();

    res.json({
      message: 'Yarı final maçları başarıyla oluşturuldu',
      matches: semiFinalMatches.length
    });
  } catch (error) {
    console.error('Yarı final maçları oluşturma hatası:', error);
    res.status(500).json({ message: 'Yarı final maçları oluşturulurken bir hata oluştu.' });
  }
};

// Final maçını oluştur
export const generateFinal = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Yarı final maçlarının tamamlandığını kontrol et
    const semiFinalMatches = await Match.find({
      tournament: tournament._id,
      stage: 'semi_final'
    });

    const pendingSemiFinals = semiFinalMatches.filter(match => 
      match.status !== 'completed' && match.status !== 'cancelled'
    );

    if (pendingSemiFinals.length > 0) {
      return res.status(400).json({ 
        message: 'Tüm yarı final maçları tamamlanmadan final maçı oluşturulamaz.' 
      });
    }

    // Yarı final kazananlarını bul
    const finalists: mongoose.Types.ObjectId[] = [];
    for (const match of semiFinalMatches) {
      if (!match.score || !match.homeTeam || !match.awayTeam) continue;
      const winner = match.score.homeTeam > match.score.awayTeam ? 
        match.homeTeam as mongoose.Types.ObjectId : 
        match.awayTeam as mongoose.Types.ObjectId;
      finalists.push(winner);
    }

    // Final maçını oluştur
    const finalMatch: PartialFixtureMatch = {
      tournament: tournament._id,
      homeTeam: finalists[0],
      awayTeam: finalists[1],
      stage: 'final',
      status: 'scheduled',
      extraTimeEnabled: tournament.extraTimeEnabled,
      penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
    };

    // Son yarı final maçının tarihini bul
    const lastSemiFinal = await Match.findOne({
      tournament: tournament._id,
      stage: 'semi_final'
    }).sort({ date: -1 });

    if (!lastSemiFinal?.date) {
      return res.status(400).json({ message: 'Yarı final maçlarının tarihi bulunamadı.' });
    }

    // Final maçını planla
    let finalDate = new Date(lastSemiFinal.date);
    finalDate.setDate(finalDate.getDate() + 1);
    const [startHour, startMinute] = tournament.startTime.split(':').map(Number);
    // Create date in Turkey timezone (UTC+3) 
    // For Turkey time 11:00, we need to store it as 08:00 UTC
    // So we subtract 3 hours from the intended Turkey time
    finalDate = new Date(Date.UTC(finalDate.getFullYear(), finalDate.getMonth(), finalDate.getDate(), startHour - 3, startMinute, 0, 0));

    finalMatch.date = finalDate;
    finalMatch.field = 1; // Ana sahada oynansın

    // Final maçını kaydet
    await Match.create(finalMatch);

    // Turnuva durumunu güncelle
    tournament.status = 'completed';
    await tournament.save();

    res.json({
      message: 'Final maçı başarıyla oluşturuldu',
      match: finalMatch
    });
  } catch (error) {
    console.error('Final maçı oluşturma hatası:', error);
    res.status(500).json({ message: 'Final maçı oluşturulurken bir hata oluştu.' });
  }
};

export const deleteFixture = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    // Önce maçların var olup olmadığını kontrol et
    const existingMatches = await Match.find({ tournament: tournament._id });
    
    if (existingMatches.length === 0) {
      return res.status(400).json({ message: 'Bu turnuvada silinecek maç bulunmuyor.' });
    }

    // Turnuvaya ait tüm maçları sil
    const result = await Match.deleteMany({ tournament: tournament._id });

    if (result.deletedCount === 0) {
      return res.status(400).json({ message: 'Maçlar silinemedi.' });
    }

    // Turnuva durumunu güncelle
    tournament.status = 'pending';
    await tournament.save();

    res.json({ 
      message: 'Fikstür başarıyla silindi',
      data: {
        deletedMatches: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Fikstür silme hatası:', error);
    res.status(500).json({ message: 'Fikstür silinirken bir hata oluştu.' });
  }
};

// Çeyrek final maçlarını oluştur
export const generateQuarterFinals = async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Turnuva bulunamadı.' });
    }

    const pendingGroupMatches = await Match.find({
      tournament: tournament._id,
      stage: 'group',
      status: { $nin: ['completed', 'cancelled'] }
    });

    if (pendingGroupMatches.length > 0) {
      return res.status(400).json({ 
        message: 'Tüm grup maçları tamamlanmadan çeyrek final maçları oluşturulamaz.' 
      });
    }

    const qualifiedTeams: mongoose.Types.ObjectId[] = [];
    for (const group of tournament.groups) {
      const groupStandings = await calculateGroupStandings(tournament._id, group.name);
      if (groupStandings[0]?.team) {
        const teamId = (typeof groupStandings[0].team === 'string') ? new mongoose.Types.ObjectId(groupStandings[0].team) : (groupStandings[0].team as mongoose.Types.ObjectId);
        qualifiedTeams.push(teamId);
      }
      if (groupStandings[1]?.team) {
        const teamId = (typeof groupStandings[1].team === 'string') ? new mongoose.Types.ObjectId(groupStandings[1].team) : (groupStandings[1].team as mongoose.Types.ObjectId);
        qualifiedTeams.push(teamId);
      }
    }

    const quarterFinalMatches: PartialFixtureMatch[] = [];
    // A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
    for (let i = 0; i < qualifiedTeams.length; i += 4) {
      quarterFinalMatches.push(
        {
          tournament: tournament._id,
          homeTeam: qualifiedTeams[i],      // A1
          awayTeam: qualifiedTeams[i + 3],  // B2
          stage: 'quarter_final',
          status: 'scheduled',
          extraTimeEnabled: tournament.extraTimeEnabled,
          penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
        },
        {
          tournament: tournament._id,
          homeTeam: qualifiedTeams[i + 2],  // B1
          awayTeam: qualifiedTeams[i + 1],  // A2
          stage: 'quarter_final',
          status: 'scheduled',
          extraTimeEnabled: tournament.extraTimeEnabled,
          penaltyShootoutEnabled: tournament.penaltyShootoutEnabled
        }
      );
    }

    // Maç zamanlarını ve sahalarını planla
    let currentDate = new Date(tournament.startDate);
    let currentTime = new Date(currentDate);
    const [startHour, startMinute] = tournament.startTime.split(':').map(Number);
    // Use local time instead of UTC
    currentTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), startHour, startMinute, 0, 0);

    // Son grup maçının tarihini bul ve ondan sonraki güne planla
    const lastGroupMatch = await Match.findOne({
      tournament: tournament._id,
      stage: 'group'
    }).sort({ date: -1 });

    if (lastGroupMatch?.date) {
      currentDate = new Date(lastGroupMatch.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const [startHour, startMinute] = tournament.startTime.split(':').map(Number);
      // Create date in Turkey timezone (UTC+3) 
      // For Turkey time 11:00, we need to store it as 08:00 UTC
      // So we subtract 3 hours from the intended Turkey time
      currentTime = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour - 3, startMinute, 0, 0));
    }

    // Çeyrek final maçlarını planla
    for (let i = 0; i < quarterFinalMatches.length; i++) {
      // Use timezone-adjusted time
      quarterFinalMatches[i].date = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                                           currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds()));
      quarterFinalMatches[i].field = (i % tournament.numberOfFields) + 1;

      // Sonraki maç için zamanı güncelle
      if ((i + 1) % tournament.numberOfFields === 0) {
        const newMinutes = currentTime.getMinutes() + (tournament.matchDuration || 90) + (tournament.breakDuration || 15);
        // Use timezone-adjusted time
        currentTime = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
                              currentTime.getHours(), newMinutes, currentTime.getSeconds(), currentTime.getMilliseconds()));
      }
    }

    // Maçları veritabanına kaydet
    await Match.insertMany(quarterFinalMatches);

    // Turnuva durumunu güncelle
    tournament.status = 'knockout_stage';
    await tournament.save();

    res.json({
      message: 'Çeyrek final maçları başarıyla oluşturuldu',
      matches: quarterFinalMatches.length
    });
  } catch (error) {
    console.error('Çeyrek final maçları oluşturma hatası:', error);
    res.status(500).json({ message: 'Çeyrek final maçları oluşturulurken bir hata oluştu.' });
  }
};