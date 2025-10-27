# Placeholder Match Display System

## Overview

The bracket visualization now intelligently displays matches in two modes:
1. **Placeholder Mode**: For knockout matches before group stage completion
2. **Live Mode**: For matches with actual qualified teams

## Display Logic

### Placeholder Matches

When a match has `crossoverInfo` metadata, it's displayed in placeholder mode:

**Shows:**
- ✅ Team qualification format: "A 1.", "B 2.", "C 1.", "D 2."
- ✅ Match card structure (clean, minimal)
- ✅ Group letter (without "Grup" prefix)
- ✅ Rank number

**Hides:**
- ❌ Actual team names (Samsunspor, Kayserispor, etc.)
- ❌ Match date and time
- ❌ Field number
- ❌ Status badge (Yaklaşan, Tamamlandı)
- ❌ Scores (shown as empty, not "-")

### Live Matches

When a match does NOT have `crossoverInfo`, it's displayed in live mode:

**Shows:**
- ✅ Actual team names
- ✅ Match date and time
- ✅ Field number
- ✅ Status badge
- ✅ Scores (or "-" if not played)
- ✅ Winner highlighting (green background)

## Visual Comparison

### Placeholder Match Card
```
┌─────────────────────┐
│                     │
│ A 1.                │
│                     │
│ B 2.                │
│                     │
└─────────────────────┘
```

### Live Match Card
```
┌─────────────────────┐
│ 28.10 14:00 | Saha 2│
│ Yaklaşan            │
├─────────────────────┤
│ Samsunspor      3   │
│ Kayserispor     1   │
└─────────────────────┘
```

## Code Implementation

### Detection Logic

```typescript
const isPlaceholder = !!match.crossoverInfo;
```

A match is a placeholder if it has `crossoverInfo` metadata, regardless of whether teams are assigned.

### Team Display

```typescript
const getTeamDisplay = (match: ExtendedMatch, isHome: boolean) => {
  const crossoverInfo = match.crossoverInfo;
  
  // Always show placeholder format if crossoverInfo exists
  if (crossoverInfo) {
    const info = isHome ? 
      { group: crossoverInfo.homeTeamGroup, rank: crossoverInfo.homeTeamRank } :
      { group: crossoverInfo.awayTeamGroup, rank: crossoverInfo.awayTeamRank };
    
    const groupLetter = info.group.replace('Grup ', ''); // "Grup A" → "A"
    return `${groupLetter} ${info.rank}.`;
  }
  
  return team.name; // Actual team name
};
```

### Conditional Rendering

```typescript
{/* Only show match info for non-placeholder matches */}
{!isPlaceholder && (
  <div className="bg-muted/50 px-3 py-2 border-b">
    {/* Date, Time, Field, Status */}
  </div>
)}

{/* Score display */}
<span>
  {isPlaceholder ? '' : homeScore}
</span>
```

## When Matches Transition

### From Placeholder to Live

Matches transition from placeholder to live mode when:

1. **Group stage completes**
2. **Teams are qualified**
3. **System updates match with actual teams**
4. **crossoverInfo is removed** (or kept for display history)

Currently, the system keeps `crossoverInfo` permanently, so matches will always show in placeholder format until this is explicitly removed.

## User Experience Benefits

### Before Group Stage
- ✅ **Clear tournament structure** - Users see "A 1. vs B 2." format
- ✅ **No confusion** - No fake team names or dates
- ✅ **Focus on qualification** - Emphasizes who needs to qualify
- ✅ **Professional appearance** - Matches look planned but not finalized

### After Group Stage
- ✅ **Real information** - Actual teams, dates, times visible
- ✅ **Detailed match cards** - Full information including field and status
- ✅ **Live updates** - Scores and winner highlighting
- ✅ **Complete context** - All match details available

## Automatic Generation Integration

When you generate fixtures automatically:

1. **Group matches created** - Standard match cards with full info
2. **Quarter finals created** - With `crossoverInfo`, shown as placeholders
3. **Semi finals created** - With `crossoverInfo`, shown as placeholders
4. **Bracket page opens** - Shows clean placeholder format

Example bracket after generation:
```
Quarter Finals     Semi Finals      Final

A 1.          →
B 2.          →    ?          →
                              →    ?
B 1.          →    ?          →
A 2.          →

C 1.          →
D 2.          →    ?          →
                              →
D 1.          →    ?          →
C 2.          →
```

## crossoverInfo Structure

```typescript
interface CrossoverInfo {
  homeTeamGroup: string;    // "Grup A"
  homeTeamRank: number;     // 1
  awayTeamGroup: string;    // "Grup B"
  awayTeamRank: number;     // 2
}
```

This metadata:
- Defines which group and rank for each team slot
- Persists throughout the match lifecycle
- Determines placeholder display format
- Shows qualification pattern (crossover matching)

## Edge Cases

### Old Matches (No crossoverInfo)

Matches created before automatic generation won't have `crossoverInfo`:
- Display in **live mode** by default
- Show actual team names even before group stage completes
- May show temporary/incorrect teams

**Solution**: Regenerate fixtures to add `crossoverInfo` metadata.

### Manual Knockout Creation

If you manually create knockout matches:
- Must add `crossoverInfo` manually for placeholder display
- Otherwise will show in live mode immediately

### Completed Matches

Even with `crossoverInfo`, matches can be completed:
- Still show placeholder format ("A 1. vs B 2.")
- Still hide date/time/field/status
- **Empty scores** (not actual scores)

**Note**: This is current behavior. Future enhancement could show actual info after match completion.

## Future Enhancements

### Smart Transition

Automatically remove `crossoverInfo` when:
- Group stage is marked complete
- Actual qualified teams are determined
- Matches are updated with real teams

```typescript
// Future implementation idea
if (match.crossoverInfo && tournamentStatus === 'knockout_stage') {
  // Group stage complete, show actual teams
  return team.name;
}
```

### Hybrid Display

Show both formats:
```
┌─────────────────────┐
│ A 1. (Samsunspor)   │
│ B 2. (Kayserispor)  │
└─────────────────────┘
```

### Date Teaser

Show scheduled date/time for placeholders:
```
┌─────────────────────┐
│ 28.10 14:00 | Saha 2│
├─────────────────────┤
│ A 1.                │
│ B 2.                │
└─────────────────────┘
```

## Testing Scenarios

### Test 1: Fresh Fixture Generation
1. Generate new fixture
2. Check bracket page
3. **Expected**: All knockout matches show "A 1. vs B 2." format
4. **Expected**: No dates, times, or fields visible for knockouts

### Test 2: Old Matches
1. Use existing matches (before auto-generation)
2. Check bracket page
3. **Expected**: Shows team names, dates, fields (live mode)

### Test 3: Completed Group Stage
1. Complete all group matches
2. Qualify teams to knockouts
3. Check bracket page
4. **Expected**: Still shows placeholder format (with current implementation)

## Summary

The placeholder display system ensures that:
- ✅ Knockout matches look professional before teams qualify
- ✅ "A 1. vs B 2." format clearly shows qualification pattern
- ✅ No confusing dates/times for matches that can't be played yet
- ✅ Clean, minimal appearance for placeholder matches
- ✅ Full information display for live/completed matches

This creates a **tournament bracket that evolves** from a clean structural view to a detailed live scoreboard as the tournament progresses.
