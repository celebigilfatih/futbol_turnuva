# Bracket Visualization Fixes

## Issues Addressed

### 1. ✅ Team Names Showing Instead of Placeholders

**Problem**: Semi-final and final matches were showing actual team names (Samsunspor, Kayserispor, etc.) instead of placeholder format.

**Root Cause**: Semi-finals and final matches were not generated with `crossoverInfo` metadata.

**Solution**: Updated backend to include `crossoverInfo` for all knockout stages.

### 2. ✅ Final Match Missing from Bracket

**Problem**: The bracket tree only showed Quarter Finals → Semi Finals, but no Final column.

**Root Cause**: The automatic fixture generation was not creating the final match.

**Solution**: Added final match generation in the backend after semi-finals.

### 3. ⚠️ Tournament Start Time Issue

**Problem**: Matches starting at 13:30 instead of tournament configured start time (14:00).

**Likely Cause**: Existing tournament in database has wrong `startTime` value.

**Solution**: Need to check/update tournament settings. The code correctly uses `tournament.startTime`.

## Code Changes

### Backend: `tournament.ts`

#### Added crossoverInfo to Semi-Finals

```typescript
semiFinals.push({
  tournament: tournament._id,
  homeTeam: firstQF.homeTeam,
  awayTeam: quarterFinals[1]?.homeTeam || firstQF.awayTeam,
  stage: 'semi_final',
  status: 'scheduled',
  extraTimeEnabled: tournament.extraTimeEnabled,
  penaltyShootoutEnabled: tournament.penaltyShootoutEnabled,
  crossoverInfo: {
    homeTeamGroup: 'QF1',  // Winner of Quarter Final 1
    homeTeamRank: 1,
    awayTeamGroup: 'QF2',  // Winner of Quarter Final 2
    awayTeamRank: 1
  }
});
```

#### Added Final Match Generation

```typescript
// Generate final match
if (semiFinals.length >= 2) {
  const finalMatch: PartialFixtureMatch = {
    tournament: tournament._id,
    homeTeam: semiFinals[0].homeTeam,
    awayTeam: semiFinals[1].homeTeam,
    stage: 'final',
    status: 'scheduled',
    extraTimeEnabled: tournament.extraTimeEnabled,
    penaltyShootoutEnabled: tournament.penaltyShootoutEnabled,
    crossoverInfo: {
      homeTeamGroup: 'SF1',  // Winner of Semi Final 1
      homeTeamRank: 1,
      awayTeamGroup: 'SF2',  // Winner of Semi Final 2
      awayTeamRank: 1
    }
  };
  
  // Schedule final after semi finals
  let finalDate = new Date(sfDate);
  finalDate.setDate(finalDate.getDate() + 1); // Next day after semi finals
  finalDate = new Date(finalDate.getFullYear(), finalDate.getMonth(), finalDate.getDate(), startHour, startMinute, 0, 0);
  
  (finalMatch as any).date = finalDate;
  (finalMatch as any).field = 1;
  
  knockoutMatches = [...knockoutMatches, finalMatch];
}
```

### Frontend: `bracket/page.tsx`

#### Updated Team Display Logic

```typescript
const getTeamDisplay = (match: ExtendedMatch, isHome: boolean) => {
  const team = isHome ? match.homeTeam : match.awayTeam;
  const crossoverInfo = match.crossoverInfo;
  
  if (crossoverInfo) {
    const info = isHome ? 
      { group: crossoverInfo.homeTeamGroup, rank: crossoverInfo.homeTeamRank } :
      { group: crossoverInfo.awayTeamGroup, rank: crossoverInfo.awayTeamRank };
    
    const groupName = info.group;
    
    // Handle knockout stage placeholders (QF1, SF1, etc.)
    if (groupName.startsWith('QF') || groupName.startsWith('SF') || groupName.startsWith('F')) {
      return groupName; // Return as is: "QF1", "SF1", etc.
    }
    
    // Handle group placeholders (Grup A, Grup B, etc.)
    const groupLetter = groupName.replace('Grup ', '');
    return `${groupLetter} ${info.rank}.`;
  }
  
  return team.name;
};
```

## New Bracket Display Format

### Quarter Finals
Shows group-based placeholders:
- A 1. vs B 2.
- B 1. vs A 2.
- C 1. vs D 2.
- D 1. vs C 2.

### Semi Finals
Shows knockout-based placeholders:
- QF1 vs QF2
- QF3 vs QF4

### Final
Shows knockout-based placeholders:
- SF1 vs SF2

## Complete Bracket Tree Structure

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Çeyrek Final │         │  Yarı Final  │         │    Final     │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ A 1.         │──┐      │              │         │              │
│ B 2.         │  │      │              │         │              │
└──────────────┘  ├─────→│ QF1          │──┐      │              │
                  │      │ QF2          │  │      │              │
┌──────────────┐  │      └──────────────┘  ├─────→│ SF1          │
│ B 1.         │──┘                        │      │ SF2          │
│ A 2.         │                           │      └──────────────┘
└──────────────┘                           │
                                           │
┌──────────────┐                           │
│ C 1.         │──┐                        │
│ D 2.         │  │      ┌──────────────┐  │
└──────────────┘  ├─────→│ QF3          │──┘
                  │      │ QF4          │
┌──────────────┐  │      └──────────────┘
│ D 1.         │──┘
│ C 2.         │
└──────────────┘
```

## crossoverInfo Format

### Group Stage Matches
```typescript
{
  homeTeamGroup: "Grup A",
  homeTeamRank: 1,
  awayTeamGroup: "Grup B",
  awayTeamRank: 2
}
```
Display: "A 1. vs B 2."

### Knockout Stage Matches
```typescript
{
  homeTeamGroup: "QF1",  // or "SF1", "F1"
  homeTeamRank: 1,
  awayTeamGroup: "QF2",  // or "SF2", "F2"
  awayTeamRank: 1
}
```
Display: "QF1 vs QF2"

## Testing Instructions

### Test 1: Fresh Fixture Generation

1. Delete all existing matches
2. Go to `/matches/schedule`
3. Select tournament
4. Click "Fikstür Oluştur"
5. **Expected Results**:
   - Redirected to `/matches/bracket`
   - **Quarter Finals** column shows: A 1., B 2., B 1., A 2., C 1., D 2., D 1., C 2.
   - **Yarı Final** column shows: QF1, QF2, QF3, QF4
   - **Final** column shows: SF1, SF2
   - NO team names visible (Samsunspor, etc.)
   - NO dates, times, or field numbers for knockout matches

### Test 2: Tournament Start Time

1. Go to tournament settings
2. Check `startTime` field
3. If it shows wrong time (13:30 instead of 14:00):
   - Update tournament settings
   - Set correct start time (14:00)
   - Regenerate fixture

### Test 3: Bracket Tree Layout

1. View bracket page
2. **Expected Layout**:
   - 3 columns: Quarter Finals | Semi Finals | Final
   - Connector lines between stages
   - Proper vertical alignment
   - All stages visible

## Start Time Issue - Troubleshooting

If matches are still starting at wrong time after regeneration:

### Check 1: Tournament Settings
```typescript
// Backend console log
console.log('Tournament start time:', tournament.startTime);
// Should output: "14:00" (not "13:30")
```

### Check 2: Database Value
```javascript
// MongoDB query
db.tournaments.find({}, { name: 1, startTime: 1 })
// Check if startTime is "14:00"
```

### Check 3: Match Generation
```typescript
// In generateFixture function
console.log('Morning start:', morningStart);
console.log('Parse result:', parseTime(currentDay, tournament.startTime));
```

### Fix: Update Tournament
If tournament has wrong start time in database:

**Option 1**: Update via UI
1. Go to tournament edit page
2. Change start time to "14:00"
3. Save
4. Regenerate fixture

**Option 2**: Update via MongoDB
```javascript
db.tournaments.updateOne(
  { _id: ObjectId("your-tournament-id") },
  { $set: { startTime: "14:00" } }
)
```

## Summary

✅ **Fixed Issues**:
1. Semi-finals now show "QF1 vs QF2" format (not team names)
2. Final now shows "SF1 vs SF2" format (not team names)
3. Final column now appears in bracket tree
4. All knockout matches hide dates/times/fields until played

⚠️ **Start Time Issue**:
- Code is correct and uses `tournament.startTime`
- Issue is likely with tournament data in database
- Solution: Update tournament settings and regenerate

## Migration Note

**If you regenerated fixtures before these fixes**:
- Old fixtures don't have crossoverInfo for semi-finals/final
- Team names will still show for those matches
- **Solution**: Regenerate fixture again with new code

**Steps**:
1. Go to `/matches/schedule`
2. Select your tournament
3. Click "Fikstür Oluştur"
4. This will delete old matches and create new ones with proper crossoverInfo
5. Check bracket page - should now show QF1, SF1 format
